const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore,
    Browsers,
    initAuthState,
    Curve,
    generateRegistrationId
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
 * Inicializa um novo estado de credenciais se não existir
 */
function createNewCreds() {
    const identityKey = Curve.generateKeyPair();
    return {
        noiseKey: Curve.generateKeyPair(),
        signedIdentityKey: identityKey,
        signedPreKey: {
            keyPair: Curve.generateKeyPair(),
            signature: Buffer.alloc(0), // Will be signed later
            keyId: 1
        },
        registrationId: generateRegistrationId(),
        advSecretKey: Buffer.alloc(0),
        processedHistoryMessages: [],
        nextPreKeyId: 1,
        firstUnuploadedPreKeyId: 1,
        accountSettings: { unarchiveChats: false },
        registered: false,
        pairingEphemeralKeyPair: Curve.generateKeyPair(),
        myAppStateKeyId: undefined,
        lastAccountSyncTimestamp: undefined,
    };
}

/**
 * Provedor de estado de autenticação customizado para o Supabase
 */
async function useSupabaseAuthState(agentId) {
    const writeData = async (data, key) => {
        // Converter Buffers para base64 para salvar no JSONB se necessário
        const replacer = (key, value) => {
            if (value && value.type === 'Buffer') return Buffer.from(value.data).toString('base64');
            if (Buffer.isBuffer(value)) return value.toString('base64');
            return value;
        };

        const { error } = await supabase
            .from('whatsapp_sessions')
            .upsert({ 
                agent_id: agentId, 
                key_id: key, 
                value: JSON.parse(JSON.stringify(data, replacer)),
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

        if (!data?.value) return null;

        // Reverter base64 para Buffer se necessário
        const reviver = (key, value) => {
            if (typeof value === 'string' && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value) && value.length > 20) {
                // Tentativa heurística de identificar base64 que deve ser Buffer
                // Baileys usa buffers para chaves
                if (key === 'public' || key === 'private' || key === 'iv' || key === 'data' || key === 'signature' || key === 'key') {
                    return Buffer.from(value, 'base64');
                }
            }
            return value;
        };

        return JSON.parse(JSON.stringify(data.value), reviver);
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
    let creds = await readData('creds');
    if (!creds) {
        creds = createNewCreds();
    }

    return {
        state: {
            creds,
            keys: makeCacheableSignalKeyStore({
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`);
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
            logger: pino({ level: 'error' }),
            browser: Browsers.macOS('Desktop'),
            syncFullHistory: false,
            markOnlineOnConnect: true,
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
        .select('id, status_conexao')
        .in('status_conexao', ['iniciando', 'conectado', 'qr', 'desconectado']);

    if (error) {
        logger.error({ error }, 'Erro ao buscar agentes');
        return;
    }

    for (const agent of data) {
        if (agent.status_conexao === 'iniciando') {
            startAgentSession(agent.id);
        } else if (agent.status_conexao === 'desconectado') {
            if (activeSessions.has(agent.id)) {
                logger.info({ agentId: agent.id }, 'Encerrando sessão a pedido do sistema');
                const sock = activeSessions.get(agent.id);
                sock.ev.removeAllListeners();
                sock.logout();
                activeSessions.delete(agent.id);
            }
        } else if (agent.status_conexao === 'conectado' || agent.status_conexao === 'qr') {
            // Se deveria estar ativo mas não está no worker (ex: reinício do worker)
            if (!activeSessions.has(agent.id)) {
                startAgentSession(agent.id);
            }
        }
    }
}

console.log('🚀 WhatsApp Worker iniciado. Monitorando conexões...');
setInterval(pollForNewConnections, 5000);
pollForNewConnections();
