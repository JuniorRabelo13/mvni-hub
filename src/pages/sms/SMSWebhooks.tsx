import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link, Webhook, RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SMSWebhooks() {
  const webhooks = [
    { id: 1, url: "https://meusite.com/api/sms/callback", events: ["delivered", "failed"], status: "active" },
    { id: 2, url: "https://meusite.com/api/sms/inbound", events: ["received"], status: "active" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhooks Externos</h1>
          <p className="text-muted-foreground">Receba notificações de eventos em seu próprio servidor.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Novo Webhook
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL de Destino</TableHead>
                <TableHead>Eventos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((wh) => (
                <TableRow key={wh.id}>
                  <TableCell className="font-mono text-xs">{wh.url}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {wh.events.map(ev => (
                        <Badge key={ev} variant="secondary" className="text-[10px]">{ev}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Ativo</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon"><RefreshCw className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" /> Estrutura do Payload (POST)
            </CardTitle>
            <CardDescription>O que seu servidor receberá.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-slate-950 text-slate-50 rounded-lg font-mono text-xs overflow-x-auto">
              <pre>
{`{
  "event": "sms.delivered",
  "id": "uuid-da-mensagem",
  "to": "5511999999999",
  "timestamp": "2024-05-24T14:30:00Z",
  "provider_id": "subid-labsmobile"
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" /> Segurança (Secret)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>Todas as requisições de Webhook enviadas pelo nosso sistema contêm o cabeçalho <strong>X-Hub-Signature</strong>.</p>
            <div className="p-3 bg-muted rounded-lg font-mono text-xs">
              wh_sec_a7b8c9d0e1f2g3h4i5j6k7l8m9n0
            </div>
            <p className="text-muted-foreground text-xs italic">Use este segredo para validar que a requisição partiu realmente do MVNI Hub.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
