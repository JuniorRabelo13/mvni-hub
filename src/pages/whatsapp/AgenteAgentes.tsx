import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function AgenteAgentes() {
  const pollingRef = useRef<any>(null);

  const [connectionStatus, setConnectionStatus] = useState("desconectado");

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  return (
    <div className="p-10 text-white">
      <h1 className="text-5xl font-bold mb-10">Números Conectados</h1>

      <div className="bg-zinc-950 border border-yellow-500/20 rounded-3xl p-10">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${connectionStatus === "conectado" ? "bg-green-500" : "bg-red-500"}`} />

          <span className="font-bold text-xl">{connectionStatus.toUpperCase()}</span>
        </div>

        <button
          onClick={() => {
            setConnectionStatus("conectado");

            toast.success("Status atualizado");
          }}
          className="mt-10 bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold"
        >
          Testar Status
        </button>
      </div>
    </div>
  );
}
