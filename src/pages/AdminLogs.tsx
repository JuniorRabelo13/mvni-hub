import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ScrollText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { sanitize } from "@/lib/sanitize";

type LogRow = {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  metadata: any;
  created_at: string;
};

const actionLabels: Record<string, string> = {
  ver_como_usuario: "Ver como usuário",
  criar_usuario: "Criar usuário",
  alterar_role: "Alterar cargo",
  alterar_config: "Alterar configuração",
};

export default function AdminLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setIsAdmin(true);

      const { data } = await supabase
        .from("admin_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      const rows = (data || []) as LogRow[];
      const sanitizedRows = sanitize(rows, "admin_logs", user.id);
      setLogs(sanitizedRows);

      const ids = Array.from(
        new Set(sanitizedRows.flatMap(r => [r.admin_id, r.target_user_id].filter(Boolean) as string[])),
      );
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, nome, email")
          .in("id", ids);
        const map: Record<string, string> = {};
        (profs || []).forEach((p: any) => { map[p.id] = p.nome || p.email || p.id.slice(0, 8); });
        setProfiles(map);
      }
      setLoading(false);
    }
    load();
  }, [user, role, isAuthReady]);

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  if (!isAdmin) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h1 className="text-2xl font-bold">Acesso Restrito</h1>
        <p className="text-muted-foreground">Apenas administradores podem visualizar os logs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Auditoria</p>
        <h1 className="mt-1 text-3xl font-bold flex items-center gap-2">
          <ScrollText className="h-7 w-7" /> Logs administrativos
        </h1>
      </header>

      <Card>
        <CardHeader><CardTitle>Últimas 200 ações</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Alvo</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum log registrado.</TableCell></TableRow>
              ) : logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(log.created_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>{profiles[log.admin_id] || log.admin_id.slice(0, 8)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{actionLabels[log.action] || log.action}</Badge>
                  </TableCell>
                  <TableCell>
                    {log.target_user_id ? (profiles[log.target_user_id] || log.target_user_id.slice(0, 8)) : "—"}
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate text-xs text-muted-foreground">
                    {log.metadata && Object.keys(log.metadata).length > 0
                      ? JSON.stringify(log.metadata)
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
