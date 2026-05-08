/*
==================================================
POLLING STATUS — CORRIGIDO
==================================================
*/
const pollConnectionStatus = async (agentId: string, sessionId: string) => {
  let attempts = 0;
  const maxAttempts = 60;

  if (pollingRef.current) {
    clearInterval(pollingRef.current);
  }

  // FIX 1: Salva o session_id no Supabase ANTES de começar o polling
  // Assim o agente sempre tem session_id persistido para lookup correto
  await supabase
    .from("whatsapp_agents")
    .update({ session_id: sessionId, updated_at: new Date().toISOString() })
    .eq("id", agentId);

  pollingRef.current = setInterval(async () => {
    attempts++;

    try {
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

      if (isConnected) {
        clearInterval(pollingRef.current);
        console.log("[WHATSAPP_CONNECTED]");

        // FIX 2: Update direto sem lookup prévio — lookup era overhead desnecessário
        // e podia falhar se RLS bloqueasse SELECT mas permitisse UPDATE
        const updateResult = await supabase
          .from("whatsapp_agents")
          .update({
            conectado: true,
            status_conexao: "conectado",
            qr_code: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", agentId) // usa agentId direto, sem trim() que mascara erros
          .select("*");

        console.info("[WHATSAPP_UPDATE_RESULT]", updateResult);

        if (updateResult.error) {
          console.error("[WHATSAPP_UPDATE_ERROR]", updateResult.error);
          toast.error("Erro ao salvar status no banco: " + updateResult.error.message);
          // Não retorna — ainda atualiza o estado local para o UI refletir
        }

        // FIX 3: Atualiza cache React Query com dados confirmados do banco
        // Se o update retornou dados, usa eles. Senão usa fallback local.
        const confirmedAgent = updateResult.data?.[0];

        queryClient.setQueryData(["whatsapp-agents"], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((item: any) => {
            if (item.id !== agentId) return item;
            return confirmedAgent
              ? { ...item, ...confirmedAgent } // dados reais do banco
              : { ...item, conectado: true, status_conexao: "conectado", qr_code: null };
          });
        });

        // FIX 4: Remove o invalidateQueries — ele causava race condition
        // sobrescrevendo o setQueryData com refetch dos dados antigos em cache
        // O cache já está correto pelo setQueryData acima
        // queryClient.invalidateQueries({ queryKey: ["whatsapp-agents"] }); // REMOVIDO

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
        toast.success("WhatsApp conectado");
        return;
      }

      // QR Code — sem alteração
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
CONECTAR — CORRIGIDO
==================================================
*/
const connectWhatsApp = async (agent: any) => {
  try {
    const agentId = agent?.id;
    // FIX 5: Sempre gera sessionId novo para evitar sessão "zumbi" no servidor
    const sessionId = crypto.randomUUID();

    console.log("[WHATSAPP_CONNECT_START]", { agentId, sessionId });
    setConnectionStatus("iniciando");

    const response = await fetch(`${API_BASE_URL}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
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
    toast.error(error?.message || "Erro conectar");
  }
};
