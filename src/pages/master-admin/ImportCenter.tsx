import { useEffect, useState } from "react";
import { FileUp, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/mvno/EmptyState";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Upload = {
  id: string;
  competencia: string;
  arquivo_path: string;
  status: string;
  total_linhas: number;
  processadas: number;
  erros_count: number;
  created_at: string;
  operadora_id: string | null;
};

const STATUS_COLOR: Record<string, string> = {
  pendente: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  processando: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  concluido: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  erro: "bg-red-500/15 text-red-400 border-red-500/30",
  pending_ai: "bg-violet-500/15 text-violet-400 border-violet-500/30",
};

export default function ImportCenter() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [operadoras, setOperadoras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [competencia, setCompetencia] = useState<string>(
    new Date().toISOString().slice(0, 7) + "-01",
  );
  const [operadoraId, setOperadoraId] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: ups }, { data: ops }] = await Promise.all([
      supabase.from("mvno_uploads_faturas").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("operadoras").select("id, nome").eq("ativo", true).order("nome"),
    ]);
    setUploads((ups ?? []) as Upload[]);
    setOperadoras(ops ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const enviar = async () => {
    if (!file || !operadoraId) { toast.error("Selecione operadora e arquivo."); return; }
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const ext = file.name.split(".").pop();
      const path = `${operadoraId}/${competencia}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("mvno-faturas-operadora")
        .upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("mvno_uploads_faturas").insert({
        uploader_id: user.id,
        operadora_id: operadoraId,
        competencia,
        arquivo_path: path,
        mime: file.type,
        size_bytes: file.size,
        status: "pendente",
      });
      if (insErr) throw insErr;

      toast.success("Upload registrado. O parser processará em breve.");
      setFile(null);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Falha no upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="Import Center — MVNI" description="Central de importação de faturas de operadoras." path="/master/import-center" />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Import Center</h1>
          <p className="text-sm text-muted-foreground">Upload de faturas de operadoras (PDF/CSV/XLSX).</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Atualizar</Button>
      </header>

      <Card className="bg-card/60 border-border/60">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileUp className="h-4 w-4" /> Novo upload</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-1">
            <Label className="text-xs">Operadora</Label>
            <Select value={operadoraId} onValueChange={setOperadoraId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {operadoras.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-1">
            <Label className="text-xs">Competência</Label>
            <Input type="date" value={competencia} onChange={(e) => setCompetencia(e.target.value)} className="mt-1" />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Arquivo</Label>
            <Input type="file" accept=".pdf,.csv,.xlsx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1" />
          </div>
          <div className="md:col-span-4 flex justify-end">
            <Button onClick={enviar} disabled={uploading || !file || !operadoraId}>
              {uploading ? "Enviando..." : "Enviar para processamento"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/60 border-border/60">
        <CardHeader><CardTitle className="text-base">Arquivos enviados</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : uploads.length === 0 ? (
            <EmptyState title="Nenhum upload" description="Envie sua primeira fatura acima." />
          ) : (
            <div className="divide-y divide-border/60">
              {uploads.map((u) => (
                <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.arquivo_path}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(u.competencia).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })} · {new Date(u.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {u.processadas}/{u.total_linhas} · erros {u.erros_count}
                    </span>
                    <Badge variant="outline" className={STATUS_COLOR[u.status] ?? ""}>{u.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
