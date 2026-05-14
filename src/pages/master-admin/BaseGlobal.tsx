import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/QueryError";

export default function BaseGlobal() {
  const { data: clientes, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ["master-base-global"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select(`
          id,
          nome,
          telefone,
          ativo,
          created_at,
          linhas (
            msisdn,
            plano
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Base Global</h1>
        <p className="text-muted-foreground">Visão consolidada de todos os clientes da rede MVNI</p>
      </div>

      {queryError && <QueryError error={queryError} onRetry={() => refetch()} />}

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Linha / Plano</TableHead>
              <TableHead>Data de cadastro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}><Skeleton className="h-6 w-full" /></TableCell>
                </TableRow>
              ))
            ) : clientes?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              clientes?.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">{cliente.nome}</TableCell>
                  <TableCell>{cliente.telefone || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={cliente.ativo ? "default" : "secondary"}>
                      {cliente.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {cliente.linhas?.[0] ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{cliente.linhas[0].msisdn || "Sem número"}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{cliente.linhas[0].plano || "Sem plano"}</span>
                      </div>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    {new Date(cliente.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
