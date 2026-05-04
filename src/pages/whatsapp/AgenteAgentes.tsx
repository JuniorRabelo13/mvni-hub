import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Phone, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function AgenteAgentes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();

  const { data: agents, isLoading } = useQuery({
    queryKey: ["whatsapp-agents"],
    queryFn: async () => {
      const { data } = await supabase.from("whatsapp_agents").select("*");
      return data || [];
    }
  });

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("whatsapp_agents").insert({
        ...values,
        user_id: user?.id,
        status: 'ativo',
        mensagens_enviadas_hoje: 0,
        nivel_aquecimento: 1
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agente conectado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["whatsapp-agents"] });
      reset();
    },
    onError: (error) => {
      toast.error("Erro ao conectar: " + error.message);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Números Conectados</h1>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Novo Número
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conectar Novo WhatsApp</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="numero_whatsapp">Número do WhatsApp</Label>
                <Input id="numero_whatsapp" placeholder="Ex: 5511999999999" required {...register("numero_whatsapp")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limite_diario">Limite Diário Inicial</Label>
                <Input id="limite_diario" type="number" defaultValue={20} {...register("limite_diario")} />
              </div>
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? "Conectando..." : "Conectar Agente"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Agentes Ativos</CardTitle>
            <CardDescription>Números que estão operando o Agente Vendedor.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Limite Diário</TableHead>
                  <TableHead>Enviadas Hoje</TableHead>
                  <TableHead>Aquecimento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell>
                  </TableRow>
                ) : agents?.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {agent.numero_whatsapp}
                    </TableCell>
                    <TableCell>
                      <Badge variant={agent.status === 'ativo' ? 'default' : 'destructive'}>
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{agent.limite_diario}</TableCell>
                    <TableCell>{agent.mensagens_enviadas_hoje}</TableCell>
                    <TableCell>Nível {agent.nivel_aquecimento}</TableCell>
                  </TableRow>
                ))}
                {agents?.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum número conectado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regras de Aquecimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-semibold mb-1">Crescimento Progressivo:</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                <li>Dia 1: 20 envios</li>
                <li>Dia 2: 40 envios</li>
                <li>Dia 3: 80 envios</li>
                <li>Limite máx sugerido: 200/dia</li>
              </ul>
            </div>
            <Button variant="outline" className="w-full gap-2">
              <RefreshCw className="h-4 w-4" /> Resetar Contadores
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
