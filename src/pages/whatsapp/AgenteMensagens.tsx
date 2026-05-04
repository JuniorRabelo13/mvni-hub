import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AgenteMensagens() {
  const { data: messages } = useQuery({
    queryKey: ["whatsapp-messages"],
    queryFn: async () => {
      const { data } = await supabase
        .from("whatsapp_messages")
        .select(`
          *,
          leads (
            nome,
            telefone
          )
        `)
        .order("created_at", { ascending: false });
      return data || [];
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Histórico de Mensagens</h1>
      <Card>
        <CardHeader>
          <CardTitle>Logs de Conversa</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Direção</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>IA?</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages?.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell className="font-medium">
                    {msg.leads?.nome} <br />
                    <span className="text-xs text-muted-foreground">{msg.leads?.telefone}</span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{msg.mensagem}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{msg.direcao}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{msg.status}</Badge>
                  </TableCell>
                  <TableCell>{msg.ia_resposta ? "✅" : "❌"}</TableCell>
                  <TableCell>{new Date(msg.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {messages?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma mensagem registrada.
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
