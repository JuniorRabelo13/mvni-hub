const pollConnectionStatus = async (agentId: string, sessionId: string) => {
  let attempts = 0;

  const maxAttempts = 30;

  try {
    clearInterval(pollingRef.current);
  } catch {}

  pollingRef.current = setInterval(async () => {
    attempts++;

    try {
      const response = await fetch(`${API_BASE_URL}/status/${sessionId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      console.log("WHATSAPP STATUS:", data);

      /*
      ==================================================
      NORMALIZA STATUS
      ==================================================
      */

      const normalizedStatus = String(data?.status || "")
        .toLowerCase()
        .trim();

      const isConnected =
        normalizedStatus === "conectado" ||
        normalizedStatus === "connected" ||
        normalizedStatus === "open" ||
        normalizedStatus === "ativo" ||
        data?.connected === true;

      const isDisconnected =
        normalizedStatus === "desconectado" ||
        normalizedStatus === "disconnected" ||
        normalizedStatus === "close" ||
        normalizedStatus === "closed";

      const hasQr = normalizedStatus === "qr" || normalizedStatus === "qrcode" || !!data?.qr;

      /*
      ==================================================
      STATUS CONECTADO
      ==================================================
      */

      if (isConnected) {
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
            sessionId,
            updatedAt: new Date().toISOString(),
          },
        }));

        toast.success("WhatsApp conectado com sucesso");

        return;
      }

      /*
      ==================================================
      STATUS QR CODE
      ==================================================
      */

      if (hasQr) {
        let qrImage = data?.qr || null;

        /*
        ==================================================
        BUSCA QR SE NÃO VEIO NO STATUS
        ==================================================
        */

        if (!qrImage) {
          try {
            const qrResponse = await fetch(`${API_BASE_URL}/qr/${sessionId}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            });

            if (qrResponse.ok) {
              const qrData = await qrResponse.json();

              console.log("QR DATA:", qrData);

              if (qrData?.qr) {
                qrImage = qrData.qr;
              }
            }
          } catch (qrError) {
            console.error("QR FETCH ERROR:", qrError);
          }
        }

        /*
        ==================================================
        ATUALIZA QR
        ==================================================
        */

        if (qrImage) {
          setQrCode(qrImage);

          setConnectionStatus("qr");

          setAgentConnections((prev) => ({
            ...prev,
            [agentId]: {
              ...prev[agentId],
              status: "qr",
              connected: false,
              conectado: false,
              qr: qrImage,
              loading: false,
              attempts,
              error: null,
              sessionId,
              updatedAt: new Date().toISOString(),
            },
          }));
        }

        return;
      }

      /*
      ==================================================
      STATUS DESCONECTADO
      ==================================================
      */

      if (isDisconnected) {
        setConnectionStatus("desconectado");

        setAgentConnections((prev) => ({
          ...prev,
          [agentId]: {
            ...prev[agentId],
            status: "desconectado",
            connected: false,
            conectado: false,
            loading: false,
            attempts,
            qr: null,
            updatedAt: new Date().toISOString(),
          },
        }));
      }

      /*
      ==================================================
      TIMEOUT
      ==================================================
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
            conectado: false,
            loading: false,
            attempts,
            qr: null,
            error: "Timeout ao conectar WhatsApp",
            updatedAt: new Date().toISOString(),
          },
        }));

        toast.error("Falha na conexão do WhatsApp");
      }
    } catch (error: any) {
      console.error("POLL STATUS ERROR:", error);

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
          conectado: false,
          loading: false,
          qr: null,
          error: error?.message || "Erro ao consultar status do WhatsApp",
          updatedAt: new Date().toISOString(),
        },
      }));

      toast.error("Erro ao consultar status do WhatsApp");
    }
  }, 2000);
};
