import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { buildApiUrl } from "./utils/api-config";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, QrCode as QrCodeIcon, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


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
        // Polling híbrido: Consulta status e QR simultaneamente para resposta instantânea
        const [statusRes, qrRes] = await Promise.all([
          fetch(buildApiUrl(`/status/${sessionId}`), { signal }).catch(() => null),
          fetch(buildApiUrl(`/qr/${sessionId}`), { signal }).catch(() => null)
        ]);

        let statusData: any = {};
        if (statusRes?.ok) {
          try {
            statusData = await statusRes.json();
          } catch {
            statusData = {};
          }
        }

        console.log("[WHATSAPP_POLL_STATUS]", statusData);
        
        const normalizedStatus = String(statusData?.status || "").toLowerCase();
        const isConnected =
          normalizedStatus === "conectado" ||
          normalizedStatus === "connected" ||
          normalizedStatus === "open" ||
          normalizedStatus === "authenticated" ||
          statusData?.connected === true ||
          statusData?.conectado === true;

        if (isConnected) {
          clearInterval(pollingRef.current);
          console.log("[WHATSAPP_CONNECTED_DETECTED]", statusData);

          const connectedPhone = statusData?.phone || 
                               statusData?.remoteJid?.split('@')[0] || 
                               statusData?.pushName || 
                               null;

          const { data: updateResult, error: updateError } = await supabase
            .from("whatsapp_agents")
            .update({
              conectado: true,
              status_conexao: "conectado",
              qr_code: null,
              numero_whatsapp: connectedPhone || "Aguardando...",
              updated_at: new Date().toISOString(),
            })
            .eq("id", agentId)
            .select();

          if (updateError) {
            console.error("[WHATSAPP_DB_UPDATE_ERROR]", updateError);
          }

          const confirmedAgent = updateResult?.[0];

          queryClient.setQueryData(["whatsapp-agents"], (oldData: any) => {
            if (!oldData) return oldData;
            return oldData.map((item: any) => {
              if (item.id !== agentId) return item;
              return confirmedAgent
                ? { ...item, ...confirmedAgent }
                : { ...item, conectado: true, status_conexao: "conectado", qr_code: null };
            });
          });

          setAgentConnections((prev: any) => ({
            ...prev,
            [agentId]: {
              ...(prev?.[agentId] || {}),
              status: "conectado",
              connected: true,
              conectado: true,
              loading: false,
               qr: null,
               numero_whatsapp: connectedPhone || "Aguardando...",
               updatedAt: new Date().toISOString(),
             },
           }));

          setConnectionStatus("conectado");
          setQrCode(null);
          setShowQrModal(false);
          toast.success("WhatsApp conectado com sucesso");
          return;
        }

        // Se não estiver conectado, processa o QR Code
        if (qrRes?.ok) {
          let qrData: any = {};
          try {
            qrData = await qrRes.json();
          } catch {
            qrData = {};
          }

          if (qrData?.qr) {
            console.log("[WHATSAPP_QR_RECEIVED]");
            setQrCode(qrData.qr);
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
        }

        if (attempts >= maxAttempts) {
          clearInterval(pollingRef.current);
          setConnectionStatus("erro");
          toast.error("Tempo limite de conexão excedido");
        }
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        console.error("[WHATSAPP_POLL_ERROR]", error);
      }
    }, 2500);

  };

  const connectWhatsApp = async (agent: any) => {
    try {
      const agentId = agent?.id || crypto.randomUUID();
      const sessionId = agent?.session_id || crypto.randomUUID();

      console.log("[WHATSAPP_CONNECT_START]", { agentId, sessionId });
      setConnectionStatus("iniciando");
      setShowQrModal(true);

      // Persistir registro inicial no Supabase se for um novo número
      if (!agent?.numero_whatsapp) {
        const { error: insertError } = await supabase
          .from("whatsapp_agents")
          .insert([{
            id: agentId,
            session_id: sessionId,
            status_conexao: "iniciando",
            conectado: false,
            numero_whatsapp: "Aguardando...",
            user_id: (await supabase.auth.getUser()).data.user?.id || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);

        if (insertError) {
          console.error("[WHATSAPP_INSERT_ERROR]", insertError);
          toast.error("Erro ao criar registro do agente");
          setShowQrModal(false);
          return;
        }

        // Atualizar o cache do React Query para mostrar o item imediatamente
        queryClient.invalidateQueries({ queryKey: ["whatsapp-agents"] });
      }


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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) throw new Error("Erro iniciar sessão");

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
      const sessionId = agent.session_id;
      if (sessionId) {
        try {
          await fetch(buildApiUrl(`/logout/${sessionId}`), { 
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
          });
        } catch (e) {
          console.warn("[WHATSAPP_DELETE_LOGOUT_FAIL]", e);
        }
      }

      const { error } = await supabase.from("whatsapp_agents").delete().eq("id", agent.id);
      if (error) throw error;

      handleCloseModal();
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
    setAgentConnections({});
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleCloseModal();
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return (
    <TooltipProvider>
      <div className="p-6 md:p-10 text-white min-h-screen bg-black">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 text-white">Números Conectados</h1>
            <p className="text-zinc-500 text-lg font-medium">Gerencie suas instâncias e conexões do WhatsApp</p>
          </div>

          <button 
            onClick={() => connectWhatsApp({})}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-yellow-500/20 flex items-center gap-2 group"
          >
            <svg className="group-hover:rotate-90 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Novo Número
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 border border-zinc-800/50 bg-zinc-900/10 backdrop-blur-md rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/20">
              <h2 className="text-2xl font-bold tracking-tight">Agentes Ativos</h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Realtime Sync</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left text-zinc-500 border-b border-zinc-800/30 bg-zinc-900/40">
                    <th className="px-8 py-6 text-[11px] font-bold uppercase tracking-[0.15em] w-[35%] text-zinc-500">Número WhatsApp</th>
                    <th className="px-8 py-6 text-[11px] font-bold uppercase tracking-[0.15em] w-[15%] text-center text-zinc-500">Status</th>
                    <th className="px-8 py-6 text-[11px] font-bold uppercase tracking-[0.15em] w-[25%] text-center text-zinc-500">Conexão</th>
                    <th className="px-8 py-6 text-[11px] font-bold uppercase tracking-[0.15em] w-[25%] text-right text-zinc-500">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-800/30">
                  {agents.map((agent: any) => {
                    const localConnection = agentConnections[agent.id];
                    const normalizedLocalStatus = localConnection?.status?.toLowerCase();
                    const normalizedDbStatus = (agent?.status_conexao || agent?.status || "").toLowerCase();
                    
                    const isConnected = 
                      normalizedLocalStatus === "conectado" || normalizedLocalStatus === "connected" ||
                      normalizedLocalStatus === "open" || normalizedLocalStatus === "authenticated" ||
                      localConnection?.connected === true || localConnection?.conectado === true ||
                      normalizedDbStatus === "conectado" || normalizedDbStatus === "connected" ||
                      normalizedDbStatus === "open" || normalizedDbStatus === "authenticated" ||
                      agent?.conectado === true;

                    const isStarting = 
                      normalizedLocalStatus === "iniciando" || normalizedDbStatus === "iniciando" ||
                      localConnection?.loading === true;

                    return (
                      <tr key={agent.id} className="group hover:bg-zinc-800/20 transition-colors">
                        <td className="px-8 py-7 font-bold text-lg tracking-tight text-white align-middle">
                          {localConnection?.numero_whatsapp && localConnection?.numero_whatsapp !== "Aguardando..." ? (
                            localConnection.numero_whatsapp
                          ) : agent.numero_whatsapp && agent.numero_whatsapp !== "Aguardando..." ? (
                            agent.numero_whatsapp
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-32 bg-zinc-800 animate-pulse rounded-md" />
                              <Loader2 className="h-3 w-3 text-zinc-600 animate-spin" />
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-7 text-center align-middle">
                          <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider inline-block">
                            {agent.status || "ativo"}
                          </span>
                        </td>
                        <td className="px-8 py-7 align-middle">
                          <div className="flex flex-col items-center gap-2 text-center">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${
                                isConnected ? "bg-green-500 shadow-green-500/20" : isStarting ? "bg-yellow-500 shadow-yellow-500/20" : "bg-red-500 shadow-red-500/20"
                              }`} />
                              <span className={`text-xs font-black uppercase tracking-widest ${
                                isConnected ? "text-green-500" : isStarting ? "text-yellow-500" : "text-red-500"
                              }`}>
                                {isConnected ? "CONECTADO" : isStarting ? "INICIANDO" : "DESCONECTADO"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-7 align-middle">
                          <div className="flex items-center justify-end gap-6 text-right">
                            <button 
                              onClick={() => connectWhatsApp(agent)} 
                              disabled={isStarting || isConnected || deletingId === agent.id}
                              className={`text-sm font-black uppercase tracking-widest transition-all ${
                                isStarting || isConnected ? "text-zinc-700 cursor-not-allowed" : "text-yellow-500 hover:text-yellow-400 hover:scale-105 active:scale-95"
                              }`}
                            >
                              {isConnected ? "Ativo" : isStarting ? "Processando" : "Conectar"}
                            </button>
                            
                            <button 
                              onClick={() => {
                                setAgentToDelete(agent);
                                setShowDeleteModal(true);
                              }} 
                              disabled={deletingId === agent.id}
                              className="text-zinc-600 hover:text-red-500 transition-all active:scale-90 disabled:opacity-30"
                              title="Remover instância"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {agents.length === 0 && (
                <div className="p-20 text-center text-zinc-500 font-medium">Nenhum agente configurado ainda.</div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6 text-white">
            <div className="border border-zinc-800/50 bg-zinc-900/10 backdrop-blur-md rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.28-2.28a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              </div>
              <h2 className="text-2xl font-bold mb-8 tracking-tight text-white">Resumo</h2>
              <div className="space-y-4">
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-[1.5rem] p-6 transition-all hover:bg-white/[0.05]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-1">Total de Ativos</p>
                      <p className="text-4xl font-black text-white">{agents.length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showQrModal} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-yellow-500/20 p-0 overflow-hidden rounded-3xl">
          <div className="p-10 relative">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-3xl font-bold flex items-center gap-3">
                <QrCodeIcon className="w-8 h-8 text-yellow-500" />
                Conectar WhatsApp
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center">
              {qrCode ? (
                <div className="relative group">
                  <img 
                    src={qrCode} 
                    alt="QR Code" 
                    className="w-full aspect-square rounded-2xl mb-6 shadow-2xl border border-white/5 transition-transform duration-500 group-hover:scale-[1.02]" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center pointer-events-none">
                    <span className="text-white text-sm font-bold bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm">
                      Escaneie com seu celular
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full aspect-square bg-zinc-900/50 rounded-2xl mb-6 flex flex-col items-center justify-center border border-white/5 gap-4">
                  <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
                  <p className="text-zinc-500 text-sm font-medium animate-pulse">Gerando QRCode...</p>
                </div>
              )}

              <div className="text-center space-y-2 mb-8">
                <p className="text-white font-bold tracking-tight">
                  {qrCode ? "Aguardando conexão..." : "Iniciando sessão..."}
                </p>
                <p className="text-zinc-500 text-sm max-w-[280px] mx-auto">
                  Abra o WhatsApp no seu celular e escaneie o código acima.
                </p>
              </div>

              <button 
                onClick={handleCloseModal}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-4 rounded-xl font-bold transition-all active:scale-95 border border-white/5"
              >
                Cancelar conexão
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => !deletingId && setShowDeleteModal(false)}>
          <div className="bg-zinc-950 border border-red-500/20 rounded-3xl p-10 w-full max-w-[450px] relative" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4 text-white">Confirmar Exclusão</h2>
            <p className="text-zinc-400 mb-8">
              Tem certeza que deseja remover o número <span className="text-white font-bold">{agentToDelete?.numero_whatsapp}</span>? 
              A sessão será encerrada e os dados apagados.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteModal(false)} disabled={deletingId !== null} className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white py-4 rounded-xl font-bold transition-colors disabled:opacity-50">Cancelar</button>
              <button onClick={() => deleteAgent(agentToDelete)} disabled={deletingId !== null} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {deletingId ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Apagando...</> : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}
