import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Fingerprint, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type SecurityLogRow = {
  id: string;
  user_id: string;
  campo_detectado: string;
  origem: string;
  hash_payload: string;
  created_at: string;
};

export default function SecurityLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<SecurityLogRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setIsAdmin(true);

      const { data } = await supabase
        .from("security_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      const rows = (data || []) as SecurityLogRow[];
      setLogs(rows);

      const ids = Array.from(new Set(rows.map(r => r.user_id)));
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
  }, [user]);

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  if (!isAdmin) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h1 className="text-2xl font-bold">Acesso Restrito</h1>
        <p className="text-muted-foreground">Apenas administradores podem visualizar os logs de segurança.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Segurança Jurídica</p>
        <h1 className="mt-1 text-3xl font-bold flex items-center gap-2">
          <Fingerprint className="h-7 w-7 text-primary" /> Logs de detecção de segredos
        </h1>
      </header>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lock className="h-4 w-4" /> Política de Privacidade dos Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Para garantir a segurança total, estes logs <strong>não armazenam os dados originais</strong>. 
            Em vez disso, salvamos apenas um <code>hash_payload</code> (SHA-256) que identifica se o mesmo dado 
            sensível está vazando repetidamente, sem expor o segredo em si.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Monitoramento em tempo real</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Campo Detectado</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Hash do Payload (Blindado)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma detecção suspeita encontrada.</TableCell></TableRow>
              ) : logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(log.created_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="font-medium">{profiles[log.user_id] || log.user_id.slice(0, 8)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px]">{log.campo_detectado}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{log.origem}</TableCell>
                  <TableCell className="max-w-[200px] truncate font-mono text-[10px] text-muted-foreground">
                    {log.hash_payload}
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