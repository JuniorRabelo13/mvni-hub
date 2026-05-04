import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SMSLogs() {
  const [logs] = useState([
    { id: 1, telefone: "+5511999999999", mensagem: "Olá, seu código é 1234", status: "delivered", data: "2024-05-24 14:30:05" },
    { id: 2, telefone: "+5521988888888", mensagem: "Sua fatura vence amanhã.", status: "sent", data: "2024-05-24 14:35:12" },
    { id: 3, telefone: "+5531977777777", mensagem: "Promoção exclusiva! Confira.", status: "failed", data: "2024-05-24 14:40:45" },
    { id: 4, telefone: "+5541966666666", mensagem: "Bem-vindo ao MVNI Hub.", status: "blacklist", data: "2024-05-24 14:45:00" },
  ]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline" }> = {
      delivered: { label: "Entregue", variant: "default" },
      sent: { label: "Enviado", variant: "secondary" },
      failed: { label: "Falha", variant: "destructive" },
      blacklist: { label: "Blacklist", variant: "outline" },
    };
    const s = variants[status] || { label: status, variant: "outline" };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logs de Envio</h1>
          <p className="text-muted-foreground">Histórico detalhado de todas as mensagens processadas.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por telefone ou mensagem..." className="pl-9" />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" /> Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Telefone</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data/Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">{log.telefone}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs" title={log.mensagem}>{log.mensagem}</TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.data}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
