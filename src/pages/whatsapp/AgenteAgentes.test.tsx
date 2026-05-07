const pollConnectionStatus = async (agentId: string, sessionId: string) => {
  let attempts = 0;

  const maxAttempts = 30;

  pollingRef.current = setInterval(async () => {
    attempts++;

    try {
      const response = await fetch(`${API_BASE_URL}/status/${sessionId}`);

      const data = await response.json();

      console.log("WHATSAPP STATUS:", data);

      /*
      ==========================================
      STATUS CONECTADO
      ==========================================
      */

      if (data.status === "conectado") {
        try {
          clearInterval(pollingRef.current);
        } catch {}

        setQrCode(null);

        setShowQrModal(false);

        setConnectionStatus("conectado");

        setAgentConnections((prev) => ({
          ...prev,
          [agentId]: {
            ...prev[agentId],
            status: "conectado",
            connected: true,
            conectado: true,
            qr: null,
            loading: false,
            attempts: 0,
            error: null,
          },
        }));

        toast.success("WhatsApp conectado com sucesso");

        return;
      }

      /*
      ==========================================
      STATUS QR
      ==========================================
      */

      if (data.status === "qr") {
        const qrResponse = await fetch(`${API_BASE_URL}/qr/${sessionId}`);

        const qrData = await qrResponse.json();

        if (qrData?.qr) {
          setQrCode(qrData.qr);

          setConnectionStatus("qr");

          setAgentConnections((prev) => ({
            ...prev,
            [agentId]: {
              ...prev[agentId],
              status: "qr",
              connected: false,
              qr: qrData.qr,
              loading: false,
              error: null,
            },
          }));
        }

        return;
      }

      /*
      ==========================================
      STATUS DESCONECTADO
      ==========================================
      */

      if (data.status === "desconectado") {
        setConnectionStatus("desconectado");

        setAgentConnections((prev) => ({
          ...prev,
          [agentId]: {
            ...prev[agentId],
            status: "desconectado",
            connected: false,
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
        try {
          clearInterval(pollingRef.current);
        } catch {}

        setConnectionStatus("erro");

        setAgentConnections((prev) => ({
          ...prev,
          [agentId]: {
            ...prev[agentId],
            status: "erro",
            connected: false,
            loading: false,
            error: "Timeout ao conectar WhatsApp",
          },
        }));

        toast.error("Falha na conexão");
      }
    } catch (error) {
      console.error(error);

      try {
        clearInterval(pollingRef.current);
      } catch {}

      setConnectionStatus("erro");

      setAgentConnections((prev) => ({
        ...prev,
        [agentId]: {
          ...prev[agentId],
          status: "erro",
          connected: false,
          loading: false,
          error: "Erro ao consultar status",
        },
      }));

      toast.error("Erro ao consultar status do WhatsApp");
    }
  }, 2000);
};
