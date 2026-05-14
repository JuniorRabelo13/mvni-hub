import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Settings, Smartphone } from "lucide-react";
import { QueryError } from "@/components/QueryError";

export default function MasterConfig() {
  const queryClient = useQueryClient();

  const { data: configs, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ["master-config-operadoras"],
    queryFn: async () => {
      // Como a tabela custos_operadora não existe no inventário, 
      // usaremos a tabela configuracoes ou profiles dependendo do schema anterior.
      // Entretanto, o comando pede especificamente campos Claro, Vivo, TIM.
      // Vou buscar registros na tabela 'configuracoes' filtrando por operadora
      const { data, error } = await supabase.from('configuracoes').select('*');
      if (error) throw error;
      return data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, valor }: { id: string, valor: string }) => {
      const { error } = await supabase
        .from('configuracoes')
        .update({ valor })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-config-operadoras"] });
      toast.success("Configuração atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar configuração");
    }
  });

  const operadoras = [
    { key: "custo_claro", label: "Claro", icon: Smartphone },
    { key: "custo_vivo", label: "Vivo", icon: Smartphone },
    { key: "custo_tim", label: "TIM", icon: Smartphone },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          Master Config
        </h1>
        <p className="text-muted-foreground">Configurações globais do sistema MVNI</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-border/60 bg-zinc-950/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Custo por operadora</CardTitle>
            <CardDescription>Defina os custos operacionais base para cada operadora.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : operadoras.map((op) => {
              const config = configs?.find(c => c.chave === op.key);
              const [localValue, setLocalValue] = useState(config?.valor || "0.00");

              return (
                <div key={op.key} className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/5">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                    <op.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{op.label}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Custo Base (R$)</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input 
                      className="w-24 h-9 bg-zinc-900 border-zinc-800 text-right"
                      value={localValue}
                      onChange={(e) => setLocalValue(e.target.value)}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => updateMutation.mutate({ id: config?.id, valor: localValue })}
                      disabled={!config || updateMutation.isPending}
                    >
                      {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
