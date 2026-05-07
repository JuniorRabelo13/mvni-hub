const connectWhatsApp = async (agent: any) => {
  try {
    /*
    ==================================================
    IDENTIFICAÇÃO
    ==================================================
    */

    const agentId = agent?.id || agent?.uuid || crypto.randomUUID();

    const sessionId = agent?.sessionId || agent?.session_id || crypto.randomUUID();

    console.log("CONNECTING SESSION:", {
      agentId,
      sessionId,
    });

    /*
    ==================================================
    LIMPA POLLING ANTIGO
    ==================================================
    */

    try {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    } catch (error) {
      console.error("CLEAR POLLING ERROR:", error);
    }

    /*
    ==================================================
    ESTADO INICIAL
    ==================================================
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
    ==================================================
    START SESSION
    ==================================================
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

    /*
    ==================================================
    VALIDA RESPONSE
    ==================================================
    */

    if (!startResponse.ok) {
      const errorText = await startResponse.text();

      console.error("START RESPONSE ERROR:", errorText);

      throw new Error(errorText || "Erro ao iniciar sessão");
    }

    /*
    ==================================================
    JSON START
    ==================================================
    */

    let startData: any = {};

    try {
      startData = await startResponse.json();
    } catch {
      startData = {};
    }

    console.log("START SESSION SUCCESS:", startData);

    /*
    ==================================================
    QR CODE
    ==================================================
    */

    setTimeout(async () => {
      try {
        console.log("FETCHING QR:", sessionId);

        const qrResponse = await fetch(`${API_BASE_URL}/qr/${sessionId}`, {
          method: "GET",

          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!qrResponse.ok) {
          console.error("QR RESPONSE ERROR:", qrResponse.status);

          return;
        }

        let qrData: any = {};

        try {
          qrData = await qrResponse.json();
        } catch {
          qrData = {};
        }

        console.log("QR DATA:", qrData);

        /*
        ==================================================
        QR ENCONTRADO
        ==================================================
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
        }
      } catch (error) {
        console.error("QR FETCH ERROR:", error);
      }
    }, 2000);

    /*
    ==================================================
    INICIA POLLING
    ==================================================
    */

    await pollConnectionStatus(agentId, sessionId);
  } catch (error: any) {
    console.error("CONNECT WHATSAPP ERROR:", error);

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

        error: error?.message || "Erro ao conectar WhatsApp",

        updatedAt: new Date().toISOString(),
      },
    }));

    toast.error(error?.message || "Erro ao conectar WhatsApp");
  }
};
