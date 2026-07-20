import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export type Plano = {
  id: string;
  name: string;
  monthly_price: number;
  description: string | null;
  features: string[] | null;
};

interface SeletorPlanoProps {
  clienteId: string;
  planoAtualId?: string;
}

export function SeletorPlano({ clienteId, planoAtualId }: SeletorPlanoProps) {
  const queryClient = useQueryClient();

  const { data: planos = [], isLoading } = useQuery({
    queryKey: ["saas_plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saas_plans")
        .select("id, name, description, monthly_price, features, is_active")
        .eq("is_active", true)
        .order("monthly_price", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        id: p.id as string,
        name: p.name as string,
        monthly_price: Number(p.monthly_price),
        description: (p.description ?? null) as string | null,
        features: Array.isArray(p.features) ? (p.features as string[]) : [],
      })) as Plano[];
    },
  });

  const updatePlanoMutation = useMutation({
    mutationFn: async (planoId: string) => {
      const { error } = await supabase
        .from("clientes")
        .update({ plano_id: planoId })
        .eq("id", clienteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Plano atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar plano: " + error.message);
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="grid gap-4 mt-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Planos Disponíveis</h3>
      <div className="grid gap-3">
        {planos.map((plano) => {
          const isSelected = plano.id === planoAtualId;
          return (
            <Card
              key={plano.id}
              className={`relative overflow-hidden transition-all ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'}`}
            >
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{plano.name}</span>
                    {isSelected && <Badge className="bg-primary text-primary-foreground text-[10px]">Atual</Badge>}
                  </div>
                  {plano.description && <p className="text-xs text-muted-foreground">{plano.description}</p>}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                    {Array.isArray(plano.features) && plano.features.map((f, i) => (
                      <span key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Check className="h-3 w-3 text-emerald-500" /> {f}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right flex flex-col gap-2 min-w-[100px]">
                  <span className="text-xl font-bold">R$ {plano.monthly_price.toFixed(2).replace('.', ',')}</span>
                  <Button
                    size="sm"
                    variant={isSelected ? "secondary" : "default"}
                    disabled={isSelected || updatePlanoMutation.isPending}
                    onClick={() => updatePlanoMutation.mutate(plano.id)}
                  >
                    {updatePlanoMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : isSelected ? "Selecionado" : "Selecionar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${className}`}>{children}</span>;
}
