import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function AgenteConfig() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: config, isLoading } = useQuery({
    queryKey: ["whatsapp-config"],
    queryFn: async () => {
      const { data } = await supabase.from("whatsapp_config").select("*").maybeSingle();
      return data;
    }
  });

  const { register, handleSubmit } = useForm({
    values: config || {
      horario_inicio: "08:30",
      horario_fim: "20:00",
      delay_min: 20,
      delay_max: 90,
      prompt_ia: ""
    }
  });

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase
        .from("whatsapp_config")
        .upsert({ ...values, user_id: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["whatsapp-config"] });
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + error.message);
    }
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Configurações do Agente</h1>
      
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Horário de Funcionamento</CardTitle>
              <CardDescription>Defina quando o agente deve iniciar conversas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horario_inicio">Início</Label>
                  <Input id="horario_inicio" type="time" {...register("horario_inicio")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horario_fim">Fim</Label>
                  <Input id="horario_fim" type="time" {...register("horario_fim")} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delays Humanos</CardTitle>
              <CardDescription>Tempo de espera entre mensagens (em segundos).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delay_min">Mínimo</Label>
                  <Input id="delay_min" type="number" {...register("delay_min")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delay_max">Máximo</Label>
                  <Input id="delay_max" type="number" {...register("delay_max")} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cérebro da IA (System Prompt)</CardTitle>
            <CardDescription>Instruções de comportamento para o agente vendedor.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt_ia">Instruções</Label>
              <Textarea 
                id="prompt_ia" 
                placeholder="Você é um vendedor atencioso que foca em conversão..." 
                className="min-h-[200px]"
                {...register("prompt_ia")}
              />
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
