import React from "react";

interface State { hasError: boolean; error: Error | null; showDetails: boolean }

/**
 * Global error boundary — always renders something visible so the user never
 * sees a black/white screen without explanation.
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null, showDetails: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  reset = () => this.setState({ hasError: false, error: null, showDetails: false });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    const message = this.state.error?.message ?? "Erro inesperado ao carregar esta página.";
    const stack = this.state.error?.stack ?? "";

    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#0B0F1A] px-6 py-10 text-foreground">
        <div className="flex w-full max-w-lg flex-col gap-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-2xl">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.2em] text-[#9b87f5]">MVNI HUB</span>
            <h1 className="text-xl font-semibold text-white">
              Não foi possível carregar o MVNI HUB
            </h1>
            <p className="text-sm text-zinc-400">
              Ocorreu um erro durante a inicialização da plataforma.
            </p>
          </div>

          <div className="rounded-md border border-zinc-800 bg-black/40 p-3">
            <p className="break-words text-sm text-zinc-200">{message}</p>
            {stack && (
              <>
                <button
                  onClick={() => this.setState((s) => ({ showDetails: !s.showDetails }))}
                  className="mt-2 text-xs text-[#9b87f5] hover:underline"
                >
                  {this.state.showDetails ? "Ocultar detalhes técnicos" : "Ver detalhes técnicos"}
                </button>
                {this.state.showDetails && (
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-relaxed text-zinc-500">
                    {stack}
                  </pre>
                )}
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { this.reset(); window.location.reload(); }}
              className="rounded-md bg-[#9b87f5] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Tentar novamente
            </button>
            <button
              onClick={() => { window.location.href = "/"; }}
              className="rounded-md border border-zinc-700 bg-transparent px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            >
              Voltar para o início
            </button>
            <button
              onClick={() => { window.location.href = "/diagnostico"; }}
              className="rounded-md border border-zinc-700 bg-transparent px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            >
              Diagnóstico
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
