import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  Search, 
  Calendar, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function NotificacoesVencimentoAudit() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ["notifications-vencimento", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('notificacoes_vencimento')
        .select(`
          *,
          pagamentos (
            mes_referencia,
            cliente_id,
            clientes (nome)
          )
        `)
        .order('data_envio', { ascending: false })
        .limit(200);

      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const filteredNotifications = notifications?.filter(notif => 
    notif.numero_whatsapp?.includes(searchTerm) ||
    notif.mensagem_enviada?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (notif.pagamentos?.clientes?.nome && notif.pagamentos.clientes.nome.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Auditoria de Comunicação</p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">
            Histórico <span className="text-gradient-gold">Notificações Vencimento</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Auditagem de todas as mensagens de cobrança enviadas via WhatsApp.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 border-zinc-800">
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar
        </Button>
      </header>

      <Card className="border-primary/20 bg-zinc-950/50 backdrop-blur-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-xl font-bold">Logs de Envio</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar número, mensagem ou cliente..."
                  className="pl-9 h-9 bg-zinc-900/50 border-zinc-800 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="h-9 bg-zinc-900/50 border border-zinc-800 rounded-md px-3 text-xs text-muted-foreground focus:ring-1 focus:ring-primary outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos Status</option>
                <option value="Enviada">Enviadas</option>
                <option value="Falha">Falhas</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-800/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-900/30">
                <TableRow className="hover:bg-transparent border-zinc-800">
                  <TableHead className="text-[11px] uppercase tracking-wider w-[180px]">Data/Hora</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider">Cliente / WhatsApp</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider">Mensagem</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-right">Fatura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications?.map((notif) => (
                  <TableRow key={notif.id} className="border-zinc-800/50 hover:bg-zinc-900/20 group">
                    <TableCell className="font-mono text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {new Date(notif.data_envio).toLocaleString("pt-BR")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{notif.pagamentos?.clientes?.nome || "Desconhecido"}</span>
                        <span className="text-[10px] text-muted-foreground">{notif.numero_whatsapp}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[9px] uppercase font-bold flex w-fit gap-1 items-center",
                          notif.status === "Enviada" 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        )}
                      >
                        {notif.status === "Enviada" ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                        {notif.status}
                      </Badge>
                      {notif.erro && (
                        <p className="text-[9px] text-red-400 mt-1 max-w-[120px] truncate">{notif.erro}</p>
                      )}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-[11px] line-clamp-2 text-zinc-300 italic">"{notif.mensagem_enviada}"</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-mono text-primary">{notif.fatura_id?.slice(0, 8)}</span>
                        {notif.pagamentos?.mes_referencia && (
                          <span className="text-[9px] text-muted-foreground">Ref: {new Date(notif.pagamentos.mes_referencia).toLocaleDateString("pt-BR", { month: 'short', year: 'numeric' })}</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!filteredNotifications || filteredNotifications.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Bell className="h-8 w-8 opacity-20" />
                        <p className="text-xs">Nenhuma notificação registrada.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
