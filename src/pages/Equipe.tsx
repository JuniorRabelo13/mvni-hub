import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, DollarSign, ListChecks, Eye } from "lucide-react";
import { toast } from "sonner";
import { logAdminAction } from "@/lib/adminLog";
import { sanitize } from "@/lib/sanitize";

export default function Equipe() {
  const { user, viewAs } = useAuth();
  const navigate = useNavigate();
  const [equipe, setEquipe] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      // 1. Pegar perfil do usuário atual
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      setUserProfile(profile);

      // 2. Buscar equipe baseado na role
      let query = supabase.from("profiles").select("*");

      if (profile?.role === "admin") {
        // Admin vê todos menos ele mesmo
        query = query.neq("id", user.id);
      } else if (profile?.role === "gerente" || profile?.role === "supervisor") {
        // Vê subordinados diretos
        query = query.eq("gestor_id", user.id);
      } else {
        // Vendedor vê nada na aba equipe
        setLoading(false);
        return;
      }

      const { data: members, error } = await query;
      
      if (error) {
        toast.error("Erro ao carregar equipe");
        console.error(error);
      } else {
        // 3. Buscar métricas para cada membro
        const membersWithMetrics = await Promise.all(
          (members || []).map(async (member) => {
            const { data: sales } = await supabase
              .from("cobrancas")
              .select("valor, status")
              .eq("user_id", member.id);
            
            const totalVendas = sales?.length || 0;
            const ganhos = sales
              ?.filter(s => s.status === 'pago')
              .reduce((acc, s) => acc + Number(s.valor), 0) || 0;

            return { ...member, totalVendas, ganhos };
          })
        );
        setEquipe(sanitize(membersWithMetrics, "equipe_list", user.id));
      }
      setLoading(false);
    }

    fetchData();
  }, [user]);

  const handleVerComo = (memberId: string) => {
    viewAs(memberId);
    logAdminAction("ver_como_usuario", memberId);
    toast.success("Modo visualização ativado.");
    navigate("/");
  };

  if (userProfile?.role === "vendedor") {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <Users className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Acesso Restrito</h2>
        <p className="text-muted-foreground">Apenas gestores podem visualizar dados da equipe.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipe</h1>
          <p className="text-muted-foreground">Gerencie sua hierarquia e acompanhe o desempenho.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membros Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipe.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas Equipe</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {equipe.reduce((acc, m) => acc + m.totalVendas, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Equipe</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                equipe.reduce((acc, m) => acc + m.ganhos, 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Vendas</TableHead>
                <TableHead>Faturamento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Carregando...</TableCell>
                </TableRow>
              ) : equipe.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Nenhum membro encontrado.</TableCell>
                </TableRow>
              ) : (
                equipe.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.nome || member.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{member.totalVendas}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(member.ganhos)}
                    </TableCell>
                    <TableCell className="text-right">
                      {userProfile?.role === "admin" && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleVerComo(member.id)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Ver como
                        </Button>
                      )}
                    </TableCell>
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
