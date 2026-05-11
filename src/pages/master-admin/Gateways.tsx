import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CreditCard, 
  QrCode, 
  Repeat, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight, 
  RefreshCw,
  Zap,
  ShieldCheck,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MasterGateways() {
  const { data: gateways, isLoading, refetch } = useQuery({
    queryKey: ["master-gateways-report"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_master_gateways_report');
      if (error) throw error;
      return data as any[];
    },
    refetchInterval: 60000
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      </div>
    );
  }

  const totals = gateways?.reduce((acc, curr) => ({
    volume: acc.volume + Number(curr.volume_total),
    pix: acc.pix + Number(curr.volume_pix),
    card: acc.card + Number(curr.volume_card),
    subs: acc.subs + Number(curr.active_subscriptions)
  }), { volume: 0, pix: 0, card: 0, subs: 0 });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Infraestrutura Financeira</p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">
            Gateways <span className="text-gradient-gold">Ativos</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Gerenciamento completo de processamento, saúde de webhooks e volumes.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 border-zinc-800">
          <RefreshCw className="h-3.5 w-3.5" /> Sincronizar
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-zinc-950/50 border-zinc-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold tracking-tighter">Volume Total</CardDescription>
            <CardTitle className="text-2xl font-bold text-primary">{formatCurrency(totals?.volume || 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-zinc-950/50 border-zinc-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold tracking-tighter">Volume PIX</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-500">{formatCurrency(totals?.pix || 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-zinc-950/50 border-zinc-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold tracking-tighter">Volume Cartão</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-500">{formatCurrency(totals?.card || 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-zinc-950/50 border-zinc-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold tracking-tighter">Recorrências Ativas</CardDescription>
            <CardTitle className="text-2xl font-bold text-purple-500">{totals?.subs || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {gateways?.map((gw) => (
          <Card key={gw.gateway_id} className="border-zinc-800 bg-zinc-950/50 backdrop-blur-sm overflow-hidden group hover:border-primary/20 transition-all">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{gw.gateway_name}</CardTitle>
                    <CardDescription className="text-[10px] uppercase">{gw.gateway_id}</CardDescription>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[9px] uppercase font-bold",
                    gw.status === 'online' ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : "text-amber-500 bg-amber-500/10 border-amber-500/20"
                  )}
                >
                  {gw.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Taxa de Sucesso</p>
                  <p className="text-lg font-bold">{gw.success_rate}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Webhook Health</p>
                  <p className="text-lg font-bold">{gw.webhook_health}%</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-medium">PIX</span>
                  </div>
                  <span className="text-xs font-bold">{formatCurrency(gw.volume_pix)}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-medium">Cartão</span>
                  </div>
                  <span className="text-xs font-bold">{formatCurrency(gw.volume_card)}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-purple-500" />
                    <span className="text-xs font-medium">Assinaturas</span>
                  </div>
                  <span className="text-xs font-bold">{gw.active_subscriptions}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-900 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-[10px] h-8 border-zinc-800 hover:bg-zinc-900">
                  CONFIGURAÇÕES
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-[10px] h-8 border-zinc-800 hover:bg-zinc-900">
                  LOGS WEBHOOK
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}