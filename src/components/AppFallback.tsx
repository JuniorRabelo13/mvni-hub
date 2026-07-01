import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface AppFallbackProps {
  message?: string;
  timeoutMs?: number;
}

/**
 * Global loading fallback for the MVNI HUB app.
 * Shows a premium loading state; after `timeoutMs` (default 8s) offers recovery actions.
 */
export function AppFallback({ message = "Carregando sua central...", timeoutMs = 8000 }: AppFallbackProps) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setSlow(true), timeoutMs);
    return () => window.clearTimeout(id);
  }, [timeoutMs]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0B0F1A] px-6 text-foreground">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl font-semibold tracking-tight text-white">MVNI HUB</span>
          <span className="text-xs uppercase tracking-[0.2em] text-[#9b87f5]">Central do Representante</span>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#9b87f5]" />
          <p className="text-sm text-zinc-400">{message}</p>
        </div>

        {slow && (
          <div className="mt-4 flex w-full flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 text-left">
            <p className="text-sm text-zinc-200">
              O carregamento demorou mais que o esperado.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => window.location.reload()}
                className="rounded-md bg-[#9b87f5] px-3 py-2 text-xs font-medium text-white hover:opacity-90"
              >
                Recarregar
              </button>
              <button
                onClick={() => { window.location.href = "/auth"; }}
                className="rounded-md border border-zinc-700 bg-transparent px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
              >
                Ir para login
              </button>
              <button
                onClick={() => { window.location.href = "/painel"; }}
                className="rounded-md border border-zinc-700 bg-transparent px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
              >
                Ir para painel
              </button>
              <button
                onClick={() => { window.location.href = "/diagnostico"; }}
                className="rounded-md border border-zinc-700 bg-transparent px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
              >
                Diagnóstico
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AppFallback;
