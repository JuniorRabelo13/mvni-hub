import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import makeWASocket, { 
  DisconnectReason, 
  fetchLatestBaileysVersion, 
  proto,
  initAuthCreds,
  BufferJSON
} from 'https://esm.sh/@whiskeysockets/baileys@6.5.0?no-check'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, agentId } = await req.json()

    if (!agentId) {
      throw new Error('agentId is required')
    }

    if (action === 'connect') {
      console.log(`Starting connection for agent ${agentId}`)

      // Custom Auth State using Supabase
      const writeData = async (data: any, key: string) => {
        const { error } = await supabase
          .from('whatsapp_sessions')
          .upsert({ 
            agent_id: agentId, 
            key_id: key, 
            value: JSON.parse(JSON.stringify(data, BufferJSON.replacer)) 
          }, { onConflict: 'agent_id, key_id' });
        if (error) console.error('Error writing session data:', error);
      };

      const readData = async (key: string) => {
        const { data, error } = await supabase
          .from('whatsapp_sessions')
          .select('value')
          .eq('agent_id', agentId)
          .eq('key_id', key)
          .maybeSingle();
        if (error) console.error('Error reading session data:', error);
        return data ? JSON.parse(JSON.stringify(data.value), BufferJSON.reviver) : null;
      };

      const removeData = async (key: string) => {
        await supabase
          .from('whatsapp_sessions')
          .delete()
          .eq('agent_id', agentId)
          .eq('key_id', key);
      };

      const creds = await readData('creds') || initAuthCreds();

      const { version } = await fetchLatestBaileysVersion()

      const sock = makeWASocket({
        version,
        printQRInTerminal: false,
        auth: {
          creds,
          keys: {
            get: async (type, ids) => {
              const data: any = {};
              await Promise.all(
                ids.map(async (id) => {
                  let value = await readData(`${type}-${id}`);
                  if (type === 'app-state-sync-key' && value) {
                    value = proto.Message.AppStateSyncKeyData.fromObject(value);
                  }
                  data[id] = value;
                })
              );
              return data;
            },
            set: async (data) => {
              const tasks = [];
              for (const category in data) {
                for (const id in data[category]) {
                  const value = data[category][id];
                  const key = `${category}-${id}`;
                  tasks.push(value ? writeData(value, key) : removeData(key));
                }
              }
              await Promise.all(tasks);
            }
          }
        },
        browser: ['MVNI Hub PF', 'Chrome', '1.0.0']
      })

      return new Promise((resolve) => {
        let qrGenerated = false;

        sock.ev.on('creds.update', async () => {
          await writeData(sock.authState.creds, 'creds');
        });

        sock.ev.on('connection.update', async (update) => {
          const { connection, lastDisconnect, qr } = update;

          if (qr) {
            console.log(`QR generated for agent ${agentId}`);
            await supabase.from('whatsapp_agents').update({
              status_conexao: 'qr',
              qr_code: qr,
              conectado: false
            }).eq('id', agentId);
            
            if (!qrGenerated) {
              qrGenerated = true;
              resolve(new Response(JSON.stringify({ status: 'qr', qr }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }));
            }
          }

          if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reason: ', lastDisconnect?.error, 'Should reconnect:', shouldReconnect);
            
            await supabase.from('whatsapp_agents').update({
              status_conexao: 'desconectado',
              conectado: false,
              qr_code: null
            }).eq('id', agentId);

            // In a real environment, we would handle reconnection logic here
            // But in Edge Functions, we just exit.
          } else if (connection === 'open') {
            console.log(`Agent ${agentId} connected successfully`);
            await supabase.from('whatsapp_agents').update({
              status_conexao: 'conectado',
              conectado: true,
              qr_code: null,
              ultima_atividade: new Date().toISOString()
            }).eq('id', agentId);

            if (!qrGenerated) {
              resolve(new Response(JSON.stringify({ status: 'connected' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }));
            }
          }
        });

        // Timeout to avoid keeping the function running forever
        setTimeout(() => {
          if (!qrGenerated) {
            resolve(new Response(JSON.stringify({ error: 'Timeout waiting for QR code' }), {
              status: 408,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }));
          }
        }, 45000);
      });
    }

    if (action === 'disconnect') {
      console.log(`Disconnecting agent ${agentId}`);
      
      // Clear session data
      await supabase
        .from('whatsapp_sessions')
        .delete()
        .eq('agent_id', agentId);

      await supabase.from('whatsapp_agents').update({
        status_conexao: 'desconectado',
        conectado: false,
        qr_code: null
      }).eq('id', agentId);

      return new Response(JSON.stringify({ status: 'disconnected' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error('Error in whatsapp-connect:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
