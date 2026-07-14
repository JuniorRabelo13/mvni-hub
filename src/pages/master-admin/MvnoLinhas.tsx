import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const STATUS = ["ativa", "suspensa", "cancelada", "bloqueada", "portabilidade", "pre_ativacao"];

export default function MvnoLinhas() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: operadoras } = useQuery({
    queryKey: ["mvno-op-sel"],
    queryFn: async () => (await supabase.from("operadoras").select("id, nome").order("nome")).data ?? [],
  });
  const { data: planos } = useQuery({
    queryKey: ["mvno-plano-sel"],
    queryFn: async () => (await supabase.from("planos_mvno").select("id, nome, operadora_id").order("nome")).data ?? [],
  });
  const { data: clientes } = useQuery({
    queryKey: ["mvno-cli-sel"],
    queryFn: async () => (await supabase.from("clientes").select("id, nome").order("nome").limit(500)).data ?? [],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["mvno-linhas", filterStatus],
    queryFn: async () => {
      let q = supabase
        .from("mvno_linhas")
        .select("*, operadoras(nome), planos_mvno(nome), clientes(nome)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (filterStatus !== "all") q = q.eq("status", filterStatus as any);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

  const save = useMutation({
    mutationFn: async (l: any) => {
      const payload = {
        numero: l.numero,
        iccid: l.iccid || null,
        imsi: l.imsi || null,
        operadora_id: l.operadora_id,
        plano_id: l.plano_id || null,
        cliente_id: l.cliente_id || null,
        status: l.status || "pre_ativacao",
        valor_mensal: Number(l.valor_mensal) || 0,
      };
      if (l.id) {
        const { error } = await supabase.from("mvno_linhas").update(payload).eq("id", l.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("mvno_linhas").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mvno-linhas"] }); setOpen(false); setEdit(null); toast.success("Linha salva"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mvno_linhas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mvno-linhas"] }); toast.success("Removida"); },
    onError: (e: any) => toast.error(e.message),
  });

  const exportCSV = () => {
    if (!data?.length) return;
    const header = "numero;iccid;operadora;plano;cliente;status;valor_mensal";
    const lines = data.map((l) => [l.numero, l.iccid ?? "", l.operadoras?.nome ?? "", l.planos_mvno?.nome ?? "", l.clientes?.nome ?? "", l.status, l.valor_mensal].join(";"));
    const blob = new Blob(["\uFEFF" + header + "\n" + lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "mvno_linhas.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Linhas MVNO</h1>
          <p className="text-sm text-muted-foreground">Gestão completa das linhas ativas</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCSV}>Exportar CSV</Button>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEdit(null); }}>
            <DialogTrigger asChild><Button onClick={() => setEdit({ status: "pre_ativacao" })}><Plus className="h-4 w-4 mr-2" />Nova</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{edit?.id ? "Editar" : "Nova"} Linha</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Número</Label><Input value={edit?.numero ?? ""} onChange={(e) => setEdit({ ...edit, numero: e.target.value })} /></div>
                  <div><Label>ICCID</Label><Input value={edit?.iccid ?? ""} onChange={(e) => setEdit({ ...edit, iccid: e.target.value })} /></div>
                </div>
                <div><Label>IMSI</Label><Input value={edit?.imsi ?? ""} onChange={(e) => setEdit({ ...edit, imsi: e.target.value })} /></div>
                <div>
                  <Label>Operadora</Label>
                  <Select value={edit?.operadora_id ?? ""} onValueChange={(v) => setEdit({ ...edit, operadora_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{operadoras?.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Plano</Label>
                  <Select value={edit?.plano_id ?? ""} onValueChange={(v) => setEdit({ ...edit, plano_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{planos?.filter((p) => !edit?.operadora_id || p.operadora_id === edit.operadora_id).map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cliente</Label>
                  <Select value={edit?.cliente_id ?? ""} onValueChange={(v) => setEdit({ ...edit, cliente_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{clientes?.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Status</Label>
                    <Select value={edit?.status ?? "pre_ativacao"} onValueChange={(v) => setEdit({ ...edit, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Valor mensal</Label><Input type="number" step="0.01" value={edit?.valor_mensal ?? ""} onChange={(e) => setEdit({ ...edit, valor_mensal: Number(e.target.value) })} /></div>
                </div>
              </div>
              <DialogFooter><Button onClick={() => save.mutate(edit)} disabled={save.isPending}>Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Linhas ({data?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p>Carregando...</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Número</TableHead><TableHead>Operadora</TableHead><TableHead>Plano</TableHead><TableHead>Cliente</TableHead><TableHead>Status</TableHead><TableHead>Valor</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {data?.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono">{l.numero}</TableCell>
                    <TableCell>{l.operadoras?.nome ?? "-"}</TableCell>
                    <TableCell>{l.planos_mvno?.nome ?? "-"}</TableCell>
                    <TableCell>{l.clientes?.nome ?? "-"}</TableCell>
                    <TableCell><Badge variant="outline">{l.status}</Badge></TableCell>
                    <TableCell>R$ {Number(l.valor_mensal ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => { setEdit(l); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => confirm("Remover linha?") && del.mutate(l.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.length && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhuma linha</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
