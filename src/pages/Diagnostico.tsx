import { Link } from "react-router-dom";

const EXPECTED_PROJECT_ID = "hmzqfcooxqucytxwljhg";

function detectEnvironment(): "local" | "preview" | "production" {
  if (typeof window === "undefined") return "production";
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) return "local";
  if (
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host.endsWith(".lovableproject.com") ||
    host.endsWith(".lovableproject-dev.com") ||
    host.endsWith(".lovable.app")
  ) return "preview";
  return "production";
}

function present(v: string | undefined): "sim" | "não" {
  return v && v.length > 0 ? "sim" : "não";
}

export default function Diagnostico() {
  const env = detectEnvironment();
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
  const timestamp = new Date().toLocaleString("pt-BR");

  const rows: Array<[string, string]> = [
    ["App carregou", "sim"],
    ["Ambiente", env],
    ["VITE_SUPABASE_URL presente", present(url)],
    ["VITE_SUPABASE_PUBLISHABLE_KEY presente", present(key)],
    ["Project ID detectado", projectId ?? "(não informado)"],
    ["Project ID esperado", EXPECTED_PROJECT_ID],
    ["Project ID confere", projectId === EXPECTED_PROJECT_ID ? "sim" : "não"],
    ["Data/hora do teste", timestamp],
  ];

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0B0F1A] px-6 py-10 text-foreground">
      <div className="flex w-full max-w-2xl flex-col gap-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-2xl">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.2em] text-[#9b87f5]">MVNI HUB</span>
          <h1 className="text-xl font-semibold text-white">Diagnóstico</h1>
          <p className="text-sm text-zinc-400">
            Verificação rápida de renderização e configuração do ambiente. Nenhum valor sensível é exibido.
          </p>
        </div>

        <div className="overflow-hidden rounded-md border border-zinc-800">
          <table className="w-full text-sm">
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label} className="border-b border-zinc-800 last:border-0">
                  <td className="px-4 py-2 text-zinc-400">{label}</td>
                  <td className="px-4 py-2 font-mono text-zinc-100">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/auth"
            className="rounded-md bg-[#9b87f5] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Ir para login
          </Link>
          <Link
            to="/painel"
            className="rounded-md border border-zinc-700 bg-transparent px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
          >
            Ir para painel
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md border border-zinc-700 bg-transparent px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
          >
            Recarregar
          </button>
        </div>
      </div>
    </div>
  );
}
