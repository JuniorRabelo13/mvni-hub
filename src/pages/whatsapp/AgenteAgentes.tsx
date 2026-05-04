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
      const { data } = await supabase
        .from("whatsapp_agents")
        .select("*, whatsapp_number_stats(*)");
      return data || [];
    }
  });

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const { data: agent, error } = await supabase.from("whatsapp_agents").insert({
        ...values,
        user_id: user?.id,
        status: 'ativo',
        mensagens_enviadas_hoje: 0,
        nivel_aquecimento: 1,
        subscription_price: 49.90
      }).select().single();
      
      if (error) throw error;

      // Criar estatísticas iniciais de aquecimento
      await supabase.from("whatsapp_number_stats").insert({
        agent_id: agent.id,
        warming_level: 1,
        daily_volume_limit: 42 // Volume inicial automático do Dia 1
      });
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
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                O limite de envios e o aquecimento do número são gerenciados automaticamente pela nossa IA para garantir a segurança da sua conta.
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
                  <TableHead>Status Segurança</TableHead>
                  <TableHead>Enviadas Hoje</TableHead>
                  <TableHead>Aquecimento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell>
                  </TableRow>
                ) : agents?.map((agent) => {
                  const stats = agent.whatsapp_number_stats?.[0];
                  return (
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
                      <TableCell>
                        <Badge variant={stats?.safety_status === 'safe' ? 'outline' : 'destructive'}>
                          {stats?.safety_status === 'safe' ? 'Seguro' : stats?.safety_status === 'warning' ? 'Atenção' : 'Pausado'}
                        </Badge>
                      </TableCell>
                      <TableCell>{agent.mensagens_enviadas_hoje} / {stats?.daily_volume_limit || '--'}</TableCell>
                      <TableCell>Automático (Nível {stats?.warming_level || 1})</TableCell>
                    </TableRow>
                  );
                })}
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
            <CardTitle>Controle de Custos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="flex justify-between mb-2">
                <span>Números Conectados:</span>
                <span className="font-bold">{agents?.length || 0}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Custo Mensal Estimado:</span>
                <span className="font-bold text-green-600">
                  R$ {((agents?.length || 0) * 49.90).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground italic">
              * Cobrança de R$ 49,90 por número ativo. O sistema gerencia o aquecimento e limites automaticamente.
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
