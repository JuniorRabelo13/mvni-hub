import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { buildApiUrl } from "./utils/api-config";

export default function AgenteAgentes() {
  const queryClient = useQueryClient();

  const pollingRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [qrCode, setQrCode] = useState<string | null>(null);

  const [showQrModal, setShowQrModal] = useState(false);

  const [connectionStatus, setConnectionStatus] = useState("desconectado");
  const [agentConnections, setAgentConnections] = useState<any>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<any>(null);


  const { data: agents = [] } = useQuery({
    queryKey: ["whatsapp-agents"],
    staleTime: 0,
    gcTime: 0,


    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_agents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data || [];
    },
  });

  const pollConnectionStatus = async (agentId: string, sessionId: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    let attempts = 0;

    const maxAttempts = 60;

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    await supabase
      .from("whatsapp_agents")
      .update({
        session_id: sessionId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentId);

    pollingRef.current = setInterval(async () => {
      attempts++;

      try {
        /*
        ==========================================
        STATUS
        ==========================================
        */

        const statusResponse = await fetch(buildApiUrl(`/status/${sessionId}`), { signal });

        let statusData: any = {};

        try {
          statusData = await statusResponse.json();
        } catch {
          statusData = {};
        }

        console.log("[WHATSAPP_STATUS]", statusData);

        const normalizedStatus = String(statusData?.status || "").toLowerCase();

        const isConnected =
          normalizedStatus === "conectado" ||
          normalizedStatus === "connected" ||
          normalizedStatus === "open" ||
          normalizedStatus === "authenticated" ||
          statusData?.connected === true ||
          statusData?.conectado === true;

        /*
        ==========================================
        CONECTADO
        ==========================================
        */

        if (isConnected) {
          clearInterval(pollingRef.current);

          console.log("[WHATSAPP_CONNECTED]");

          const updateResult = await supabase
            .from("whatsapp_agents")
            .update({
              conectado: true,
              status_conexao: "conectado",
              qr_code: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", agentId)
            .select("*");

          console.log("[WHATSAPP_UPDATE_RESULT]", updateResult);

          const confirmedAgent = updateResult?.data?.[0];

          /*
          ==========================================
          CACHE LOCAL
          ==========================================
          */

          queryClient.setQueryData(["whatsapp-agents"], (oldData: any) => {
            if (!oldData) return oldData;

            return oldData.map((item: any) => {
              if (item.id !== agentId) return item;

              return confirmedAgent
                ? {
                    ...item,
                    ...confirmedAgent,
                  }
                : {
                    ...item,
                    conectado: true,
                    status_conexao: "conectado",
                    qr_code: null,
                  };
            });
          });

          /*
          ==========================================
          ESTADO LOCAL
          ==========================================
          */

          setAgentConnections((prev: any) => ({
            ...prev,

            [agentId]: {
              ...(prev?.[agentId] || {}),

              status: "conectado",

              connected: true,

              conectado: true,

              loading: false,

              qr: null,

              error: null,

              updatedAt: new Date().toISOString(),
            },
          }));

          setConnectionStatus("conectado");

          setQrCode(null);

          setShowQrModal(false);

          toast.success("WhatsApp conectado com sucesso");

          return;
        }

        /*
        ==========================================
        QR CODE
        ==========================================
        */

        const qrResponse = await fetch(buildApiUrl(`/qr/${sessionId}`), { signal });

        let qrData: any = {};

        try {
          qrData = await qrResponse.json();
        } catch {
          qrData = {};
        }

        console.log("[WHATSAPP_QR]", qrData);

        if (qrData?.qr) {
          setQrCode(qrData.qr);

          setShowQrModal(true);

          setConnectionStatus("qr");

          setAgentConnections((prev: any) => ({
            ...prev,

            [agentId]: {
              ...(prev?.[agentId] || {}),

              status: "qr",

              connected: false,

              conectado: false,

              qr: qrData.qr,

              loading: false,
            },
          }));
        }

        /*
        ==========================================
        TIMEOUT
        ==========================================
        */

        if (attempts >= maxAttempts) {
          clearInterval(pollingRef.current);

          setConnectionStatus("erro");

          toast.error("Timeout conexão WhatsApp");
        }
      } catch (error: any) {
        console.error("[WHATSAPP_POLL_ERROR]", error);
      }
    }, 2000);
  };

  const connectWhatsApp = async (agent: any) => {
    try {
      const agentId = agent?.id;
      const sessionId = agent?.session_id || crypto.randomUUID();

      console.log("[WHATSAPP_CONNECT_START]", {
        agentId,
        sessionId,
      });

      setConnectionStatus("iniciando");

      // Tenta fechar sessão antiga se houver (cleanup preventivo)
      try {
        await fetch(buildApiUrl(`/logout/${sessionId}`), { 
          method: "DELETE",
          headers: { "Content-Type": "application/json" }
        });
        console.log("[WHATSAPP_LOGOUT_PREVENTIVO]", sessionId);
      } catch (e) {
        console.log("[WHATSAPP_LOGOUT_SILENT_FAIL]", e);
      }

      const response = await fetch(buildApiUrl("/start"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro iniciar sessão");
      }

      setAgentConnections((prev: any) => ({
        ...prev,

        [agentId]: {
          status: "iniciando",

          connected: false,

          conectado: false,

          loading: true,

          sessionId,
        },
      }));

      await pollConnectionStatus(agentId, sessionId);
    } catch (error: any) {
      console.error("[WHATSAPP_CONNECT_ERROR]", error);

      toast.error(error?.message || "Erro conectar WhatsApp");
    }
  };

  const deleteAgent = async (agent: any) => {
    try {
      setDeletingId(agent.id);
      
      // 1. Tenta destruir sessão no provider
      const sessionId = agent.session_id;
      if (sessionId) {
        try {
          await fetch(buildApiUrl(`/logout/${sessionId}`), { 
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
          });
          console.log("[WHATSAPP_DELETE_LOGOUT_SUCCESS]", sessionId);
        } catch (e) {
          console.warn("[WHATSAPP_DELETE_LOGOUT_FAIL]", e);
        }
      }

      // 2. Remove do Supabase
      const { error } = await supabase
        .from("whatsapp_agents")
        .delete()
        .eq("id", agent.id);

      if (error) throw error;

      // 3. Cleanup de polling se for o agente atual
      handleCloseModal();

      // 4. Atualiza cache local
      queryClient.setQueryData(["whatsapp-agents"], (oldData: any) => {
        if (!oldData) return [];
        return oldData.filter((item: any) => item.id !== agent.id);
      });

      toast.success("Número removido com sucesso");
    } catch (error: any) {
      console.error("[WHATSAPP_DELETE_ERROR]", error);
      toast.error("Erro ao remover número");
    } finally {
      setDeletingId(null);
      setShowDeleteModal(false);
      setAgentToDelete(null);
    }
  };

  const handleCloseModal = () => {

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setQrCode(null);
    setShowQrModal(false);
    setConnectionStatus("desconectado");
    // Limpar estado de loading/iniciando para todos os agentes
    setAgentConnections({});
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseModal();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="p-10 text-white">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-5xl font-bold">Números Conectados</h1>

        <button className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold">Novo Número</button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 border border-yellow-500/20 rounded-3xl p-8">
          <h2 className="text-3xl font-bold mb-10">Agentes Ativos</h2>

          <table className="w-full">
            <thead>
              <tr className="text-left text-zinc-400 border-b border-zinc-800">
                <th className="pb-4">Número</th>

                <th className="pb-4">Status</th>

                <th className="pb-4">Conexão</th>

                <th className="pb-4">Ações</th>
              </tr>
            </thead>

            <tbody>
              {agents.map((agent: any) => {
                const localConnection = agentConnections[agent.id];
                
                // Prioridade 1: Estado Local (polling ativo)
                // Prioridade 2: Status do Supabase
                const normalizedLocalStatus = localConnection?.status?.toLowerCase();
                const normalizedDbStatus = (agent?.status_conexao || agent?.status || "").toLowerCase();
                
                const isConnected = 
                  normalizedLocalStatus === "conectado" ||
                  normalizedLocalStatus === "connected" ||
                  normalizedLocalStatus === "open" ||
                  normalizedLocalStatus === "authenticated" ||
                  localConnection?.connected === true ||
                  localConnection?.conectado === true ||
                  normalizedDbStatus === "conectado" ||
                  normalizedDbStatus === "connected" ||
                  normalizedDbStatus === "open" ||
                  normalizedDbStatus === "authenticated" ||
                  agent?.conectado === true;

                const isStarting = 
                  normalizedLocalStatus === "iniciando" || 
                  normalizedDbStatus === "iniciando" ||
                  localConnection?.loading === true;

                return (
                  <tr key={agent.id} className="border-b border-zinc-900">
                    <td className="py-6 font-bold">{agent.numero_whatsapp || "Sem número"}</td>
                    <td className="py-6">
                      <span className="bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                        {agent.status || "ativo"}
                      </span>
                    </td>
                    <td className="py-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          isConnected ? "bg-green-500" : isStarting ? "bg-yellow-500" : "bg-red-500"
                        }`} />
                        <span className="font-semibold uppercase">
                          {isConnected ? "CONECTADO" : isStarting ? "INICIANDO" : "DESCONECTADO"}
                        </span>
                      </div>
                    </td>
                    <td className="py-6">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => connectWhatsApp(agent)} 
                          disabled={isStarting || isConnected || deletingId === agent.id}
                          className={`font-bold transition-opacity ${isStarting || isConnected ? "text-zinc-600" : "text-yellow-500 hover:text-yellow-400"}`}
                        >
                          {isConnected ? "Conectado" : isStarting ? "Conectando..." : "Conectar"}
                        </button>
                        
                        <button 
                          onClick={() => {
                            setAgentToDelete(agent);
                            setShowDeleteModal(true);
                          }} 
                          disabled={deletingId === agent.id}
                          className="text-red-500 hover:text-red-400 font-bold disabled:opacity-50 transition-colors"
                        >
                          {deletingId === agent.id ? "Apagando..." : "Apagar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border border-yellow-500/20 rounded-3xl p-8">
          <h2 className="text-3xl font-bold mb-10">Controle</h2>

          <div className="bg-zinc-900 rounded-2xl p-6 mb-6 flex items-center justify-between">
            <span className="text-xl">Ativos:</span>

            <span className="text-2xl font-bold">{agents.length}</span>
          </div>
        </div>
      </div>

      {showQrModal && qrCode && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-zinc-950 border border-yellow-500/20 rounded-3xl p-10 w-full max-w-[500px] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={handleCloseModal}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h2 className="text-3xl font-bold mb-8">Conectar WhatsApp</h2>

            <img src={qrCode} alt="QR Code" className="w-full rounded-2xl mb-6" />

            <div className="text-center text-zinc-400 mb-8">Aguardando conexão...</div>

            <button 
              onClick={handleCloseModal}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-4 rounded-xl font-bold transition-colors"
            >
              Cancelar conexão
            </button>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => !deletingId && setShowDeleteModal(false)}
        >
          <div 
            className="bg-zinc-950 border border-red-500/20 rounded-3xl p-10 w-full max-w-[450px] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 text-white">Confirmar Exclusão</h2>
            <p className="text-zinc-400 mb-8">
              Tem certeza que deseja remover o número <span className="text-white font-bold">{agentToDelete?.numero_whatsapp}</span>? 
              A sessão será encerrada e os dados apagados.
            </p>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingId !== null}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white py-4 rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={() => deleteAgent(agentToDelete)}
                disabled={deletingId !== null}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingId ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Apagando...
                  </>
                ) : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
