import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Shield, UserPlus, MoreVertical, Ban, CheckCircle2, History, Settings2, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const MasterUsuarios = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [representantes, setRepresentantes] = useState<any[]>([]);
  const [loadingRep, setLoadingRep] = useState(true);

  useEffect(() => {
    const fetchRepresentantes = async () => {
      setLoadingRep(true);
      const { data, error } = await supabase
        .from("usuarios")
        .select(`
          nome,
          email,
          telefone,
          created_at,
          status,
          indicado_por (
            nome
          )
        `)
        .eq("role", "representante")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar representantes:", error);
      } else {
        setRepresentantes(data || []);
      }
      setLoadingRep(false);
    };

    fetchRepresentantes();
  }, []);

  const mockUsers = [
    {
      id: "1",
      nome: "Admin Master",
      email: "master@empresa.com",
      role: "master",
      status: "Ativo",
      last_active: "2 mins atrás",
      is_blocked: false,
      permissions: ["Acesso Total", "Financeiro", "Infraestrutura"],
    },
    {
      id: "2",
      nome: "João Silva",
      email: "joao@parceiro.com",
      role: "admin",
      status: "Ativo",
      last_active: "1 hora atrás",
      is_blocked: false,
      permissions: ["Gestão de Clientes", "Financeiro"],
    },
    {
      id: "3",
      nome: "Maria Oliveira",
      email: "maria@afiliado.com",
      role: "afiliado",
      status: "Inativo",
      last_active: "2 dias atrás",
      is_blocked: false,
      permissions: ["Visualizar Ganhos"],
    },
    {
      id: "4",
      nome: "Ricardo Santos",
      email: "ricardo@vendedor.com",
      role: "vendedor",
      status: "Suspenso",
      last_active: "5 dias atrás",
      is_blocked: true,
      permissions: ["Vendas"],
    },
  ];

  const mockActivity = [
    { id: 1, user: "Admin Master", action: "Alterou limites do plano VIP", time: "10 mins atrás" },
    { id: 2, user: "João Silva", action: "Aprovou saque de R$ 1.500,00", time: "45 mins atrás" },
    { id: 3, user: "Ricardo Santos", action: "Tentativa de login bloqueada", time: "1 hora atrás" },
    { id: 4, user: "Admin Master", action: "Criou novo gateway de pagamento", time: "3 horas atrás" },
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "master": return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">Master</Badge>;
      case "admin": return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Admin</Badge>;
      case "afiliado": return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Afiliado</Badge>;
      case "vendedor": return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">Vendedor</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string, is_blocked: boolean) => {
    if (is_blocked) return <Badge variant="destructive">Bloqueado</Badge>;
    switch (status) {
      case "Ativo": return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">Ativo</Badge>;
      case "Inativo": return <Badge variant="secondary">Inativo</Badge>;
      case "Suspenso": return <Badge variant="outline" className="text-yellow-500 border-yellow-500/50">Suspenso</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Gestão de Usuários Master</h1>
          <p className="text-muted-foreground mt-1">Controle de permissões, acessos e auditoria de equipe.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Shield className="w-4 h-4" />
            Permissões Globais
          </Button>
          <Button className="bg-primary hover:bg-primary/90 gap-2">
            <UserPlus className="w-4 h-4" />
            Novo Usuário
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <CardTitle>Representantes cadastrados</CardTitle>
              </div>
              <CardDescription>Visualização detalhada dos representantes independentes na rede.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-white/10 overflow-hidden">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-white">Nome</TableHead>
                      <TableHead className="text-white">Contato</TableHead>
                      <TableHead className="text-white">Indicado por</TableHead>
                      <TableHead className="text-white">Cadastro</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingRep ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Carregando representantes...
                        </TableCell>
                      </TableRow>
                    ) : representantes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhum representante cadastrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      representantes.map((rep, index) => (
                        <TableRow key={index} className="border-white/10 hover:bg-white/5 transition-colors">
                          <TableCell className="font-medium text-white">{rep.nome}</TableCell>
                          <TableCell>
                            <div className="flex flex-col text-xs">
                              <span>{rep.email}</span>
                              <span className="text-muted-foreground">{rep.telefone}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {rep.indicado_por?.nome || "Cadastro direto"}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(rep.created_at), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "capitalize",
                              rep.status === "ativo" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : 
                              rep.status === "suspenso" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" : ""
                            )}>
                              {rep.status || "Ativo"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Listagem de Equipe</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  className="pl-9 bg-background/50 border-white/10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="todos" className="w-full">
              <TabsList className="bg-background/50 border-white/10 mb-4">
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="master">Master</TabsTrigger>
                <TabsTrigger value="admin">Admins</TabsTrigger>
                <TabsTrigger value="afiliado">Afiliados</TabsTrigger>
                <TabsTrigger value="vendedor">Vendedores</TabsTrigger>
              </TabsList>
              
              <TabsContent value="todos" className="mt-0">
                <div className="rounded-md border border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-white">Usuário</TableHead>
                        <TableHead className="text-white">Nível</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white">Atividade</TableHead>
                        <TableHead className="text-white text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockUsers.map((user) => (
                        <TableRow key={user.id} className="border-white/10 hover:bg-white/5 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8 border border-white/10">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                  {user.nome.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-medium text-white">{user.nome}</span>
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>{getStatusBadge(user.status, user.is_blocked)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{user.last_active}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="hover:bg-white/10">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 bg-popover/95 border-white/10 backdrop-blur-md">
                                <DropdownMenuLabel>Ações de Usuário</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem className="gap-2 cursor-pointer">
                                  <Settings2 className="w-4 h-4" /> Editar Perfil
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer">
                                  <Shield className="w-4 h-4" /> Permissões
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer">
                                  <History className="w-4 h-4" /> Logs de Acesso
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/10" />
                                {user.is_blocked ? (
                                  <DropdownMenuItem className="gap-2 text-emerald-400 cursor-pointer">
                                    <CheckCircle2 className="w-4 h-4" /> Desbloquear
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem className="gap-2 text-red-400 cursor-pointer">
                                    <Ban className="w-4 h-4" /> Bloquear Acesso
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                <CardTitle className="text-lg">Atividade Recente</CardTitle>
              </div>
              <CardDescription>Últimas ações executadas</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {mockActivity.map((log) => (
                    <div key={log.id} className="relative pl-4 pb-4 border-l border-white/10 last:pb-0">
                      <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-primary" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{log.user}</span>
                        <span className="text-xs text-muted-foreground">{log.action}</span>
                        <span className="text-[10px] text-muted-foreground/60 mt-1">{log.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-background/40 border border-white/5 space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">MFA Ativo</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white">Uso de 2FA Equipe</span>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20">85%</Badge>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-background/40 border border-white/5 space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Sessões Ativas</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white">Total Global</span>
                  <span className="text-lg font-bold text-primary">12</span>
                </div>
              </div>
              <Button variant="ghost" className="w-full text-xs hover:bg-primary/5 text-primary">
                Ver Relatório de Segurança Completo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MasterUsuarios;
