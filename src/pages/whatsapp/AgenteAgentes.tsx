<tbody>
  {agents.map((agent) => {
    const connection = agentConnections?.[agent.id] || {};

    const isConnected =
      connection?.connected === true ||
      connection?.conectado === true ||
      connection?.status === "conectado" ||
      connection?.status === "connected";

    const isQr = connection?.status === "qr";

    const isStarting = connection?.status === "iniciando";

    const isDisconnected =
      connection?.status === "desconectado" || connection?.status === "erro" || !connection?.status;

    return (
      <tr key={agent.id} className="border-b border-yellow-500/10">
        {/* NÚMERO */}

        <td className="py-6 text-white font-medium">
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-zinc-400" />

            {agent.numero || agent.phone || "Sem número"}
          </div>
        </td>

        {/* STATUS */}

        <td className="py-6">
          <span className="bg-yellow-500 text-black text-sm px-4 py-1 rounded-full font-semibold">ativo</span>
        </td>

        {/* CONEXÃO */}

        <td className="py-6">
          {isConnected ? (
            <div className="flex items-center gap-2 text-green-400 font-semibold">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              CONECTADO
            </div>
          ) : isQr ? (
            <div className="flex items-center gap-2 text-yellow-400 font-semibold">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              QR CODE
            </div>
          ) : isStarting ? (
            <div className="flex items-center gap-2 text-blue-400 font-semibold">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              INICIANDO
            </div>
          ) : isDisconnected ? (
            <div className="flex items-center gap-2 text-red-400 font-semibold">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              DESCONECTADO
            </div>
          ) : (
            <div className="flex items-center gap-2 text-zinc-400 font-semibold">
              <div className="w-2 h-2 rounded-full bg-zinc-400" />
              DESCONHECIDO
            </div>
          )}
        </td>

        {/* AÇÕES */}

        <td className="py-6">
          {isConnected ? (
            <button disabled className="text-green-400 font-semibold cursor-default">
              Conectado
            </button>
          ) : (
            <button
              onClick={() => connectWhatsApp(agent)}
              className="text-yellow-400 hover:text-yellow-300 font-semibold transition-all"
            >
              Conectar
            </button>
          )}
        </td>
      </tr>
    );
  })}
</tbody>;
