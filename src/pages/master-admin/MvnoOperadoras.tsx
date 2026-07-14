import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Operadora = {
  id: string;
  nome: string;
  slug: string;
  cor: string | null;
  logo_url: string | null;
  ativo: boolean;
};

export default function MvnoOperadoras() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Partial<Operadora> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["mvno-operadoras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operadoras")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data as Operadora[];
    },
  });

  const save = useMutation({
    mutationFn: async (o: Partial<Operadora>) => {
      if (o.id) {
        const { error } = await supabase.from("operadoras").update(o).eq("id", o.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("operadoras").insert({
          nome: o.nome!,
          slug: o.slug!,
          cor: o.cor ?? null,
          logo_url: o.logo_url ?? null,
          ativo: o.ativo ?? true,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mvno-operadoras"] });
      setOpen(false);
      setEdit(null);
      toast.success("Operadora salva");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("operadoras").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mvno-operadoras"] });
      toast.success("Removida");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Operadoras MVNO</h1>
          <p className="text-sm text-muted-foreground">Gerencie as operadoras parceiras</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEdit(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEdit({ ativo: true })}><Plus className="h-4 w-4 mr-2" />Nova</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{edit?.id ? "Editar" : "Nova"} Operadora</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={edit?.nome ?? ""} onChange={(e) => setEdit({ ...edit, nome: e.target.value })} /></div>
              <div><Label>Slug</Label><Input value={edit?.slug ?? ""} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} /></div>
              <div><Label>Cor (hex)</Label><Input value={edit?.cor ?? ""} onChange={(e) => setEdit({ ...edit, cor: e.target.value })} placeholder="#000000" /></div>
              <div><Label>Logo URL</Label><Input value={edit?.logo_url ?? ""} onChange={(e) => setEdit({ ...edit, logo_url: e.target.value })} /></div>
              <div className="flex items-center gap-2"><Switch checked={edit?.ativo ?? true} onCheckedChange={(v) => setEdit({ ...edit, ativo: v })} /><Label>Ativa</Label></div>
            </div>
            <DialogFooter>
              <Button onClick={() => save.mutate(edit!)} disabled={save.isPending}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Lista</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p>Carregando...</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Slug</TableHead><TableHead>Cor</TableHead><TableHead>Ativa</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {data?.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.nome}</TableCell>
                    <TableCell>{o.slug}</TableCell>
                    <TableCell>{o.cor && <span className="inline-block w-4 h-4 rounded" style={{ background: o.cor }} />}</TableCell>
                    <TableCell>{o.ativo ? "Sim" : "Não"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => { setEdit(o); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => confirm("Remover?") && del.mutate(o.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma operadora</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
