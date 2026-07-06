import { useParams, Link } from "react-router-dom";
import { ArrowLeft, QrCode, Wifi, MessageSquare, Phone } from "lucide-react";
import { useLinha } from "@/hooks/mvno/useMinhasLinhas";
import { useHistoricoLinha } from "@/hooks/mvno/useConsumo";
import { useMinhasFaturas } from "@/hooks/mvno/useMinhasFaturas";
import { useConsumo } from "@/hooks/mvno/useConsumo";
import { StatusLinhaBadge, StatusFaturaBadge } from "@/components/mvno/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/mvno/EmptyState";
import { SEO } from "@/components/SEO";

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return "—"; }
}
function fmtBRL(n: number) { return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export default function LinhaDetalhes() {
  const { id } = useParams();
  const { data: linha, isLoading } = useLinha(id);
  const { data: hist } = useHistoricoLinha(id);
  const { data: faturas } = useMinhasFaturas(id);
  const { data: consumos } = useConsumo(id);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-80" /></div>;
  if (!linha) return <EmptyState title="Linha não encontrada" description="Você não tem acesso a esta linha." />;

  const ultimoConsumo: any = (consumos ?? [])[0];

  return (
    <div className="space-y-6">
      <SEO title={`Linha ${linha.numero} — MVNI`} description="Detalhes da linha telefônica." path={`/cliente/linhas/${linha.id}`} />

      <Button asChild variant="ghost" size="sm">
        <Link to="/cliente/linhas"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{linha.numero}</h1>
          <p className="text-sm text-muted-foreground">
            {linha.operadora?.nome ?? "—"} · {linha.plano?.nome ?? "—"}
          </p>
        </div>
        <StatusLinhaBadge status={linha.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-card/60 border-border/60">
          <CardHeader><CardTitle className="text-base">Informações</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <Info label="Número" value={linha.numero} />
            <Info label="ICCID" value={linha.iccid ?? "—"} />
            <Info label="IMSI" value={linha.imsi ?? "—"} />
            <Info label="Operadora" value={linha.operadora?.nome ?? "—"} />
            <Info label="Plano" value={linha.plano?.nome ?? "—"} />
            <Info label="Mensalidade" value={fmtBRL(Number(linha.valor_mensal))} />
            <Info label="Ativação" value={fmtDate(linha.ativada_em)} />
            <Info label="Próximo vencimento" value={fmtDate(linha.proximo_vencimento)} />
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border/60">
          <CardHeader><CardTitle className="text-base">eSIM</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-border/60 bg-background/40">
              <QrCode className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <p className="text-xs text-muted-foreground">QR Code eSIM disponível em breve</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/60 border-border/60">
        <CardHeader><CardTitle className="text-base">Consumo do mês</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-3">
          <ConsumoStat icon={<Wifi className="h-4 w-4" />} label="Dados" value={ultimoConsumo ? `${(Number(ultimoConsumo.dados_mb)/1024).toFixed(2)} GB` : "0 GB"} />
          <ConsumoStat icon={<MessageSquare className="h-4 w-4" />} label="SMS" value={ultimoConsumo ? String(ultimoConsumo.sms_qtd) : "0"} />
          <ConsumoStat icon={<Phone className="h-4 w-4" />} label="Minutos" value={ultimoConsumo ? String(ultimoConsumo.minutos_qtd) : "0"} />
        </CardContent>
      </Card>

      <Card className="bg-card/60 border-border/60">
        <CardHeader><CardTitle className="text-base">Últimas faturas</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(faturas ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sem faturas ainda.</p>
          ) : (faturas ?? []).slice(0, 6).map((f) => (
            <Link key={f.id} to={`/cliente/faturas/${f.id}`} className="flex items-center justify-between rounded-md border border-border/50 bg-background/40 p-3 hover:border-primary/40 transition-colors">
              <div>
                <p className="text-sm font-medium">{new Date(f.competencia).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</p>
                <p className="text-xs text-muted-foreground">Venc. {fmtDate(f.vencimento)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{fmtBRL(Number(f.valor))}</span>
                <StatusFaturaBadge status={f.status} />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-card/60 border-border/60">
        <CardHeader><CardTitle className="text-base">Histórico</CardTitle></CardHeader>
        <CardContent>
          {(hist ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum evento registrado.</p>
          ) : (
            <ol className="relative border-l border-border/60 ml-2 space-y-4">
              {(hist ?? []).map((h: any) => (
                <li key={h.id} className="ml-4">
                  <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-primary/60 border border-primary" />
                  <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString("pt-BR")}</p>
                  <p className="text-sm font-medium capitalize">{String(h.evento).replace(/_/g," ")}</p>
                  {h.descricao && <p className="text-xs text-muted-foreground">{h.descricao}</p>}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}

function ConsumoStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/50 bg-background/40 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">{icon}{label}</div>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  );
}
