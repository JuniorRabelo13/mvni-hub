import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Plano = {
  id: string;
  operadora_id: string;
  nome: string;
  franquia_dados_mb: number;
  sms_incluidos: number;
  minutos_incluidos: number;
  valor_mensal: number;
  ativo: boolean;
};

export default function MvnoPlanos() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Partial<Plano> | null>(null);

  const { data: operadoras } = useQuery({
    queryKey: ["mvno-operadoras-select"],
    queryFn: async () => {
      const { data } = await supabase.from("operadoras").select("id, nome").eq("ativo", true).order("nome");
      return data ?? [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["mvno-planos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planos_mvno")
        .select("*, operadoras(nome)")
        .order("valor_mensal");
      if (error) throw error;
      return data as any[];
    },
  });

  const save = useMutation({
    mutationFn: async (p: Partial<Plano>) => {
      const payload = {
        operadora_id: p.operadora_id!,
        nome: p.nome!,
        franquia_dados_mb: Number(p.franquia_dados_mb) || 0,
        sms_incluidos: Number(p.sms_incluidos) || 0,
        minutos_incluidos: Number(p.minutos_incluidos) || 0,
        valor_mensal: Number(p.valor_mensal) || 0,
        ativo: p.ativo ?? true,
      };
      if (p.id) {
        const { error } = await supabase.from("planos_mvno").update(payload).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("planos_mvno").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mvno-planos"] });
      setOpen(false); setEdit(null);
      toast.success("Plano salvo");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("planos_mvno").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mvno-planos"] }); toast.success("Removido"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planos MVNO</h1>
          <p className="text-sm text-muted-foreground">Catálogo de planos por operadora</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEdit(null); }}>
          <DialogTrigger asChild><Button onClick={() => setEdit({ ativo: true })}><Plus className="h-4 w-4 mr-2" />Novo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{edit?.id ? "Editar" : "Novo"} Plano</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Operadora</Label>
                <Select value={edit?.operadora_id ?? ""} onValueChange={(v) => setEdit({ ...edit, operadora_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{operadoras?.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Nome</Label><Input value={edit?.nome ?? ""} onChange={(e) => setEdit({ ...edit, nome: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Dados (MB)</Label><Input type="number" value={edit?.franquia_dados_mb ?? ""} onChange={(e) => setEdit({ ...edit, franquia_dados_mb: Number(e.target.value) })} /></div>
                <div><Label>Valor mensal (R$)</Label><Input type="number" step="0.01" value={edit?.valor_mensal ?? ""} onChange={(e) => setEdit({ ...edit, valor_mensal: Number(e.target.value) })} /></div>
                <div><Label>SMS</Label><Input type="number" value={edit?.sms_incluidos ?? ""} onChange={(e) => setEdit({ ...edit, sms_incluidos: Number(e.target.value) })} /></div>
                <div><Label>Minutos</Label><Input type="number" value={edit?.minutos_incluidos ?? ""} onChange={(e) => setEdit({ ...edit, minutos_incluidos: Number(e.target.value) })} /></div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={edit?.ativo ?? true} onCheckedChange={(v) => setEdit({ ...edit, ativo: v })} /><Label>Ativo</Label></div>
            </div>
            <DialogFooter><Button onClick={() => save.mutate(edit!)} disabled={save.isPending}>Salvar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Planos</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p>Carregando...</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Operadora</TableHead><TableHead>Nome</TableHead><TableHead>Dados</TableHead><TableHead>SMS</TableHead><TableHead>Min</TableHead><TableHead>Valor</TableHead><TableHead>Ativo</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {data?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.operadoras?.nome ?? "-"}</TableCell>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell>{p.franquia_dados_mb} MB</TableCell>
                    <TableCell>{p.sms_incluidos}</TableCell>
                    <TableCell>{p.minutos_incluidos}</TableCell>
                    <TableCell>R$ {Number(p.valor_mensal).toFixed(2)}</TableCell>
                    <TableCell>{p.ativo ? "Sim" : "Não"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => { setEdit(p); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => confirm("Remover?") && del.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.length && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Nenhum plano</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
