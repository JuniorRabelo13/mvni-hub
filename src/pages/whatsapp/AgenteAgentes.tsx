import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AgenteAgentes() {
  const { data: agents } = useQuery({
    queryKey: ["whatsapp-agents"],
    queryFn: async () => {
      const { data } = await supabase.from("whatsapp_agents").select("*");
      return data || [];
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Números Conectados</h1>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Novo Número
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Agentes Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Limite Diário</TableHead>
                <TableHead>Enviadas Hoje</TableHead>
                <TableHead>Nível Aquecimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents?.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.numero_whatsapp}</TableCell>
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
              {agents?.length === 0 && (
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
    </div>
  );
}
