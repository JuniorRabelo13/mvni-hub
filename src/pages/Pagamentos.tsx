import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

type Pagamento = {
  id: string;
  valor: number;
  status: string;
  data_pagamento: string | null;
  data_vencimento: string;
  clientes: {
    nome: string;
  };
};

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dt = (d: string | null) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";

export default function Pagamentos() {
  const { user } = useAuth();
  const [items, setItems] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from("pagamentos")
      .select("id, valor, status, data_pagamento, data_vencimento, clientes(nome)")
      .order("data_vencimento", { ascending: false });

    if (error) {
      console.error("Erro ao carregar pagamentos:", error);
    } else {
      setItems((data as any) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Financeiro</p>
        <h1 className="mt-1 text-3xl font-bold">Pagamentos</h1>
      </header>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pagamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">Carregando...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nenhum pagamento encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.clientes?.nome || "—"}</TableCell>
                    <TableCell>{fmt(Number(p.valor))}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={
                          p.status === "pago" ? "bg-emerald-500 hover:bg-emerald-600 text-white border-none" :
                          p.status === "falhou" ? "bg-red-500 hover:bg-red-600 text-white border-none" :
                          ""
                        }
                      >
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{dt(p.data_vencimento)}</TableCell>
                    <TableCell>{dt(p.data_pagamento)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
