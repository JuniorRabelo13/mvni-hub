const connectWhatsApp = async (agent: any) => {
  try {
    const agentId = agent?.id || agent?.uuid || crypto.randomUUID();

    const sessionId = agent?.sessionId || agent?.session_id || crypto.randomUUID();

    console.log("CONNECTING:", {
      agentId,
      sessionId,
    });

    /*
    =========================================
    LIMPA POLLING
    =========================================
    */

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    /*
    =========================================
    RESET UI
    =========================================
    */

    setQrCode(null);

    setShowQrModal(false);

    setConnectionStatus("iniciando");

    setAgentConnections((prev: any) => ({
      ...prev,

      [agentId]: {
        ...(prev?.[agentId] || {}),

        status: "iniciando",

        connected: false,

        conectado: false,

        loading: true,

        qr: null,

        sessionId,

        error: null,

        updatedAt: new Date().toISOString(),
      },
    }));

    /*
    =========================================
    REMOVE SESSÃO ANTIGA
    =========================================
    */

    try {
      await fetch(`${API_BASE_URL}/session/${sessionId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("DELETE SESSION ERROR:", error);
    }

    /*
    =========================================
    START SESSION
    =========================================
    */

    const startResponse = await fetch(`${API_BASE_URL}/start`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        sessionId,
      }),
    });

    if (!startResponse.ok) {
      const errorText = await startResponse.text();

      throw new Error(errorText || "Erro ao iniciar sessão");
    }

    console.log("SESSION STARTED");

    /*
    =========================================
    AGUARDA QR
    =========================================
    */

    await new Promise((resolve) => setTimeout(resolve, 3000));

    /*
    =========================================
    BUSCA QR
    =========================================
    */

    const qrResponse = await fetch(`${API_BASE_URL}/qr/${sessionId}`);

    if (!qrResponse.ok) {
      throw new Error("Erro ao buscar QR");
    }

    const qrData = await qrResponse.json();

    console.log("QR DATA:", qrData);

    /*
    =========================================
    QR OK
    =========================================
    */

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

          loading: false,

          qr: qrData.qr,

          sessionId,

          error: null,

          updatedAt: new Date().toISOString(),
        },
      }));
    } else {
      throw new Error("QR não encontrado");
    }

    /*
    =========================================
    START POLLING
    =========================================
    */

    pollConnectionStatus(agentId, sessionId);
  } catch (error: any) {
    console.error("CONNECT ERROR:", error);

    setQrCode(null);

    setShowQrModal(false);

    setConnectionStatus("erro");

    setAgentConnections((prev: any) => ({
      ...prev,

      [agent?.id]: {
        ...(prev?.[agent?.id] || {}),

        status: "erro",

        connected: false,

        conectado: false,

        loading: false,

        qr: null,

        error: error?.message || "Erro ao conectar",

        updatedAt: new Date().toISOString(),
      },
    }));

    toast.error(error?.message || "Erro ao conectar WhatsApp");
  }
};
