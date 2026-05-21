import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/QueryError";
import { 
  Package, 
  Plus, 
  Settings2, 
  CheckCircle2, 
  XCircle, 
  Smartphone, 
  MessageSquare, 
  Zap,
  TrendingUp,
  DollarSign,
  Edit,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function MasterPlanos() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState<string | null>(null);

  const { data: plans, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ["master-saas-plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from('saas_plans').select('*').order('monthly_price', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  if (queryError) {
    return (
      <div className="space-y-6">
        <QueryError error={queryError} onRetry={() => refetch()} />
      </div>
    );
  }

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: boolean }) => {
      const { error } = await supabase
        .from('saas_plans')
        .update({ is_active: status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-saas-plans"] });
      toast.success("Status do plano atualizado!");
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Comercial & Monetização</p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">
            Gestão de <span className="text-gradient-gold">Planos SaaS</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Configure mensalidades, comissões e limites técnicos por nível de conta.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold uppercase backdrop-blur-sm">
          Plano Único Ativado
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans?.map((plan) => (
          <Card key={plan.id} className={cn(
            "border-zinc-800 bg-zinc-950/50 backdrop-blur-sm overflow-hidden group hover:border-primary/40 transition-all flex flex-col",
            !plan.is_active && "opacity-60 grayscale-[0.5]"
          )}>
            <CardHeader className="pb-4 border-b border-zinc-900 bg-zinc-900/20">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[9px] uppercase font-bold cursor-pointer transition-colors",
                    plan.is_active ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20" : "text-zinc-500 bg-zinc-500/10 border-zinc-500/20 hover:bg-zinc-500/20"
                  )}
                  onClick={() => toggleStatusMutation.mutate({ id: plan.id, status: !plan.is_active })}
                >
                  {plan.is_active ? 'ATIVO' : 'DESATIVADO'}
                </Badge>
              </div>
              <CardTitle className="text-xl mt-3">{plan.name}</CardTitle>
              <CardDescription className="text-xs line-clamp-1">{plan.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6 flex-1">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">R$ {plan.monthly_price.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground">/mês</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50 space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Comissão
                  </p>
                  <p className="text-lg font-bold text-emerald-500">{plan.commission_rate}%</p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50 space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                    <Smartphone className="h-3 w-3" /> Linhas
                  </p>
                  <p className="text-lg font-bold">{plan.lines_limit}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </div>
                  <span className="font-bold">{plan.whatsapp_limit} Instância(s)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Zap className="h-3.5 w-3.5" />
                    <span>Automações</span>
                  </div>
                  <span className="font-bold">{plan.automation_limit.toLocaleString()} /mês</span>
                </div>
              </div>

              <div className="pt-4 mt-auto border-t border-zinc-900 flex gap-2">
                <Button disabled variant="outline" size="sm" className="flex-1 text-[10px] h-8 border-zinc-800 opacity-50 gap-1.5">
                  <Edit className="h-3 w-3" /> ESTRUTURA FIXA
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}