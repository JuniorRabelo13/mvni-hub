import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function MvnoUploads() {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [operadoraId, setOperadoraId] = useState("");
  const [competencia, setCompetencia] = useState("");

  const { data: operadoras } = useQuery({
    queryKey: ["mvno-op-uploads"],
    queryFn: async () => (await supabase.from("operadoras").select("id, nome").eq("ativa", true).order("nome")).data ?? [],
  });

  const { data: uploads, isLoading, refetch } = useQuery({
    queryKey: ["mvno-uploads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mvno_uploads_faturas")
        .select("*, operadoras(nome), mvno_parser_jobs(id, status, resultado)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as any[];
    },
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!file || !operadoraId || !competencia) throw new Error("Preencha todos os campos");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("operadora_id", operadoraId);
      fd.append("competencia", competencia);
      const { data, error } = await supabase.functions.invoke("mvno-fatura-upload", { body: fd });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mvno-uploads"] });
      setFile(null);
      toast.success("Upload realizado. Job criado.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const parse = useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase.functions.invoke("mvno-fatura-parser", { body: { job_id: jobId } });
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["mvno-uploads"] });
      toast.success(`Processado: ${JSON.stringify(d)}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Uploads de Faturas</h1>
        <p className="text-sm text-muted-foreground">Envie faturas de operadoras (CSV/XLSX) e processe</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Novo Upload</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Operadora</Label>
              <Select value={operadoraId} onValueChange={setOperadoraId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{operadoras?.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Competência</Label><Input type="date" value={competencia} onChange={(e) => setCompetencia(e.target.value)} /></div>
            <div><Label>Arquivo (CSV/XLSX/PDF)</Label><Input type="file" accept=".csv,.xlsx,.xls,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
          </div>
          <Button onClick={() => upload.mutate()} disabled={upload.isPending}>
            <Upload className="h-4 w-4 mr-2" />Enviar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Uploads recentes</CardTitle>
          <Button size="sm" variant="ghost" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent>
          {isLoading ? <p>Carregando...</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Operadora</TableHead><TableHead>Competência</TableHead><TableHead>Status</TableHead><TableHead>Total/Proc/Erros</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {uploads?.map((u) => {
                  const job = u.mvno_parser_jobs?.[0];
                  return (
                    <TableRow key={u.id}>
                      <TableCell>{u.operadoras?.nome ?? "-"}</TableCell>
                      <TableCell>{u.competencia}</TableCell>
                      <TableCell><Badge variant="outline">{u.status}</Badge>{job && <Badge variant="secondary" className="ml-2">job: {job.status}</Badge>}</TableCell>
                      <TableCell className="text-xs">{u.total_linhas ?? 0} / {u.processadas ?? 0} / {u.erros_count ?? 0}</TableCell>
                      <TableCell className="text-right">
                        {job && (
                          <Button size="sm" variant="outline" onClick={() => parse.mutate(job.id)} disabled={parse.isPending}>
                            <Play className="h-3 w-3 mr-1" />Processar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!uploads?.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum upload</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
