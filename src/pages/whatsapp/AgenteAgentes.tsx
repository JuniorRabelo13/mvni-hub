import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integracoes/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = "http://155.133.23.9:3333";

export default function AgenteAgentes() {
  const queryClient = useQueryClient();

  const pollingRef = useRef<any>(null);

  const [qrCode, setQrCode] = useState<string | null>(null);

  const [showQrModal, setShowQrModal] = useState(false);

  const [connectionStatus, setConnectionStatus] = useState("desconectado");

  const [agentConnections, setAgentConnections] = useState<any>({});

  /*
  ==================================================
  QUERY AGENTES
  ==================================================
  */

  const { data: agents = [] } = useQuery({
    queryKey: ["whatsapp-agents"],

    queryFn: async () => {
      const { data, error } = await supabase.from("whatsapp_agents").select("*").order("created_at", {
        ascending: false,
      });

      if (error) {
        console.error("[SUPABASE_ERROR]", error);

        throw error;
      }

      return data || [];
    },
  });

  /*
  ==================================================
  POLLING STATUS
  ==================================================
  */

  const pollConnectionStatus = async (agentId: string, sessionId: string) => {
    let attempts = 0;

    const maxAttempts = 60;

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      attempts++;

      try {
        /*
        ==========================================
        STATUS
        ==========================================
        */

        const statusResponse = await fetch(`${API_BASE_URL}/status/${sessionId}`);

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

          /*
          ==========================================
          UPDATE BANCO
          ==========================================
          */

          const { error: updateError } = await supabase
            .from("whatsapp_agents")
            .update({
              conectado: true,
              status_conexao: "conectado",
              qr_code: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", agentId);

          if (updateError) {
            console.error("[SUPABASE_UPDATE_ERROR]", updateError);
          }

          /*
          ==========================================
          CACHE LOCAL
          ==========================================
          */

          queryClient.setQueryData(["whatsapp-agents"], (oldData: any) => {
            if (!oldData) return oldData;

            return oldData.map((item: any) => {
              if (item.id !== agentId) {
                return item;
              }

              return {
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
            },
          }));

          setConnectionStatus("conectado");

          setQrCode(null);

          setShowQrModal(false);

          toast.success("WhatsApp conectado");

          /*
          ==========================================
          REFRESH QUERY
          ==========================================
          */

          queryClient.invalidateQueries({
            queryKey: ["whatsapp-agents"],
          });

          return;
        }

        /*
        ==========================================
        QR CODE
        ==========================================
        */

        const qrResponse = await fetch(`${API_BASE_URL}/qr/${sessionId}`);

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

  /*
  ==================================================
  CONECTAR WHATSAPP
  ==================================================
  */

  const connectWhatsApp = async (agent: any) => {
    try {
      const agentId = agent?.id;

      const sessionId = crypto.randomUUID();

      console.log("[WHATSAPP_CONNECT_START]", {
        agentId,
        sessionId,
      });

      setConnectionStatus("iniciando");

      /*
      ==========================================
      START SESSION
      ==========================================
      */

      const response = await fetch(`${API_BASE_URL}/start`, {
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

      /*
      ==========================================
      UPDATE LOCAL
      ==========================================
      */

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

      /*
      ==========================================
      UPDATE BANCO
      ==========================================
      */

      const { error: updateError } = await supabase
        .from("whatsapp_agents")
        .update({
          session_id: sessionId,
          status_conexao: "iniciando",
          conectado: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", agentId);

      if (updateError) {
        console.error("[SUPABASE_SESSION_UPDATE_ERROR]", updateError);
      }

      /*
      ==========================================
      START POLLING
      ==========================================
      */

      await pollConnectionStatus(agentId, sessionId);
    } catch (error: any) {
      console.error("[WHATSAPP_CONNECT_ERROR]", error);

      toast.error(error?.message || "Erro conectar WhatsApp");
    }
  };

  /*
  ==================================================
  DESTROY INTERVAL
  ==================================================
  */

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  /*
  ==================================================
  RENDER
  ==================================================
  */

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
                const localConnection = agentConnections?.[agent.id];

                const isConnected =
                  localConnection?.status === "conectado" ||
                  localConnection?.connected === true ||
                  localConnection?.conectado === true ||
                  agent?.conectado === true ||
                  agent?.status_conexao === "conectado" ||
                  agent?.status_conexao === "connected";

                return (
                  <tr key={agent.id} className="border-b border-zinc-900">
                    <td className="py-6 font-bold">{agent.numero_whatsapp || "Sem número"}</td>

                    <td className="py-6">
                      <span className="bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold">ativo</span>
                    </td>

                    <td className="py-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />

                        <span className="font-semibold">{isConnected ? "CONECTADO" : "DESCONECTADO"}</span>
                      </div>
                    </td>

                    <td className="py-6">
                      <button onClick={() => connectWhatsApp(agent)} className="font-bold text-yellow-500">
                        Conectar
                      </button>
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-950 border border-yellow-500/20 rounded-3xl p-10 w-[500px]">
            <h2 className="text-3xl font-bold mb-8">Conectar WhatsApp</h2>

            <img src={qrCode} alt="QR Code" className="w-full rounded-2xl" />

            <div className="mt-6 text-center text-zinc-400">Aguardando conexão...</div>
          </div>
        </div>
      )}
    </div>
  );
}
