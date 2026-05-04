const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore,
    Browsers
} = require('@whiskeysockets/baileys');
const { createClient } = require('@supabase/supabase-js');
const pino = require('pino');
const dotenv = require('dotenv');

dotenv.config();

const logger = pino({ level: 'info' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Armazenamento de sessões ativas em memória para o worker
const activeSessions = new Map();

/**
 * Provedor de estado de autenticação customizado para o Supabase
 */
async function useSupabaseAuthState(agentId) {
    const writeData = async (data, key) => {
        const { error } = await supabase
            .from('whatsapp_sessions')
            .upsert({ 
                agent_id: agentId, 
                key_id: key, 
                value: data,
                updated_at: new Date().toISOString()
            }, { onConflict: 'agent_id,key_id' });
        
        if (error) logger.error({ error, key }, 'Erro ao salvar dados de sessão no Supabase');
    };

    const readData = async (key) => {
        const { data, error } = await supabase
            .from('whatsapp_sessions')
            .select('value')
            .eq('agent_id', agentId)
            .eq('key_id', key)
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
            logger.error({ error, key }, 'Erro ao ler dados de sessão do Supabase');
        }
        return data?.value || null;
    };

    const removeData = async (key) => {
        const { error } = await supabase
            .from('whatsapp_sessions')
            .delete()
            .eq('agent_id', agentId)
            .eq('key_id', key);
        
        if (error) logger.error({ error, key }, 'Erro ao remover dados de sessão do Supabase');
    };

    // Baileys espera que 'creds' seja o estado inicial
    const creds = await readData('creds') || {};

    return {
        state: {
            creds,
            keys: makeCacheableSignalKeyStore({
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`);
                            if (type === 'app-state-sync-key' && value) {
                                // Buffer serialization fix if needed
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    for (const type in data) {
                        for (const id in data[type]) {
                            const value = data[type][id];
                            const key = `${type}-${id}`;
                            if (value) {
                                await writeData(value, key);
                            } else {
                                await removeData(key);
                            }
                        }
                    }
                }
            }, logger)
        },
        saveCreds: () => writeData(creds, 'creds')
    };
}

async function startAgentSession(agentId) {
    if (activeSessions.has(agentId)) {
        logger.info({ agentId }, 'Sessão já ativa para este agente');
        return;
    }

    logger.info({ agentId }, 'Iniciando nova sessão Baileys');
    
    try {
        const { state, saveCreds } = await useSupabaseAuthState(agentId);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            printQRInTerminal: false,
            auth: state,
            logger: pino({ level: 'warn' }),
            browser: Browsers.macOS('Desktop'),
            syncFullHistory: false
        });

        activeSessions.set(agentId, sock);

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                logger.info({ agentId }, 'Novo QR Code gerado');
                await supabase.from('whatsapp_agents').update({
                    qr_code: qr,
                    status_conexao: 'qr',
                    conectado: false
                }).eq('id', agentId);
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                logger.info({ agentId, shouldReconnect }, 'Conexão fechada');
                
                activeSessions.delete(agentId);

                if (shouldReconnect) {
                    startAgentSession(agentId);
                } else {
                    await supabase.from('whatsapp_agents').update({
                        status_conexao: 'desconectado',
                        conectado: false,
                        qr_code: null
                    }).eq('id', agentId);
                    
                    // Limpar sessões do banco se deslogado
                    await supabase.from('whatsapp_sessions').delete().eq('agent_id', agentId);
                }
            } else if (connection === 'open') {
                logger.info({ agentId }, 'Conexão estabelecida com sucesso');
                await supabase.from('whatsapp_agents').update({
                    status_conexao: 'conectado',
                    conectado: true,
                    qr_code: null,
                    ultima_atividade: new Date().toISOString()
                }).eq('id', agentId);
            }
        });

    } catch (err) {
        logger.error({ err, agentId }, 'Erro ao iniciar sessão do agente');
        activeSessions.delete(agentId);
    }
}

// Loop de verificação para novos agentes solicitando conexão
async function pollForNewConnections() {
    const { data, error } = await supabase
        .from('whatsapp_agents')
        .select('id')
        .eq('status_conexao', 'iniciando');

    if (error) {
        logger.error({ error }, 'Erro ao buscar agentes iniciando');
    } else if (data && data.length > 0) {
        for (const agent of data) {
            startAgentSession(agent.id);
        }
    }

    // Também verificar agentes que deveriam estar conectados mas o worker reiniciou
    const { data: activeAgents } = await supabase
        .from('whatsapp_agents')
        .select('id')
        .eq('conectado', true);
    
    if (activeAgents) {
        for (const agent of activeAgents) {
            if (!activeSessions.has(agent.id)) {
                startAgentSession(agent.id);
            }
        }
    }
}

console.log('🚀 WhatsApp Worker iniciado. Monitorando conexões...');
setInterval(pollForNewConnections, 5000);
pollForNewConnections();
