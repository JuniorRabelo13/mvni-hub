import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ShieldAlert, 
  ShieldCheck, 
  UserX, 
  Fingerprint, 
  Globe, 
  Activity, 
  Search, 
  AlertTriangle,
  Lock,
  MoreVertical,
  CheckCircle2,
  Ban
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

const MasterAntifraude = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const stats = [
    { title: "Acessos Suspeitos", value: "24", icon: Globe, color: "text-amber-400" },
    { title: "Múltiplos Logins", value: "08", icon: Fingerprint, color: "text-orange-400" },
    { title: "Anomalias Financeiras", value: "03", icon: AlertTriangle, color: "text-red-400" },
    { title: "Usuários Bloqueados", value: "12", icon: UserX, color: "text-red-500" },
  ];

  const recentIncidents = [
    { id: 1, user: "admin_test@hub.com", type: "Múltiplos IPs", risk: 85, severity: "Crítica", time: "15 mins atrás", ip: "187.32.11.90" },
    { id: 2, user: "vendedor_32@parceiro.com", type: "Tentativas Inválidas", risk: 45, severity: "Média", time: "1 hora atrás", ip: "177.45.22.10" },
    { id: 3, user: "user_99@cliente.com", type: "Saque Atípico", risk: 92, severity: "Crítica", time: "3 horas atrás", ip: "201.10.55.4" },
    { id: 4, user: "externo_api@dev.com", type: "Manipulação de Headers", risk: 68, severity: "Alta", time: "5 horas atrás", ip: "45.12.8.200" },
  ];

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-red-500";
    if (score >= 50) return "text-orange-500";
    return "text-emerald-500";
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Crítica": return <Badge variant="destructive" className="animate-pulse">Crítica</Badge>;
      case "Alta": return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">Alta</Badge>;
      case "Média": return <Badge variant="outline" className="text-amber-400 border-amber-400/50">Média</Badge>;
      default: return <Badge variant="outline">{severity}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-primary" />
            Central Antifraude
          </h1>
          <p className="text-muted-foreground mt-1">Monitoramento de anomalias, segurança de login e score de risco global.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 border-white/10 hover:bg-white/5">
            <Lock className="w-4 h-4" />
            Políticas de Bloqueio
          </Button>
          <Button className="bg-primary hover:bg-primary/90 gap-2 font-bold">
            <ShieldCheck className="w-4 h-4" />
            Hardening Geral
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-card/50 border-white/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h2 className="text-3xl font-bold text-white mt-1">{stat.value}</h2>
                </div>
                <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card/50 border-white/10 backdrop-blur-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle>Log de Incidentes</CardTitle>
              <CardDescription>Detecção em tempo real de comportamentos anômalos</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por IP ou Usuário..."
                className="pl-9 bg-background/50 border-white/10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-white/10 overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white">Usuário / IP</TableHead>
                    <TableHead className="text-white">Tipo de Alerta</TableHead>
                    <TableHead className="text-white">Severidade</TableHead>
                    <TableHead className="text-white">Risco</TableHead>
                    <TableHead className="text-white">Horário</TableHead>
                    <TableHead className="text-white text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentIncidents.map((incident) => (
                    <TableRow key={incident.id} className="border-white/10 hover:bg-white/5 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-white text-sm">{incident.user}</span>
                          <span className="text-[10px] text-muted-foreground">{incident.ip}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-semibold">{incident.type}</span>
                      </TableCell>
                      <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 w-20">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className={getRiskColor(incident.risk)}>{incident.risk}%</span>
                          </div>
                          <Progress value={incident.risk} className="h-1" />
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{incident.time}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-white/10">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-popover/95 border-white/10 backdrop-blur-md">
                            <DropdownMenuItem className="gap-2 cursor-pointer">
                              <Activity className="w-4 h-4" /> Investigar Sessão
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer">
                              <CheckCircle2 className="w-4 h-4" /> Marcar como Seguro
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem className="gap-2 text-red-400 cursor-pointer">
                              <Ban className="w-4 h-4" /> Banir IP / Usuário
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card/50 border-white/10 backdrop-blur-sm border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Score de Risco Global
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center py-4">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-white/5"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray="364.4"
                      strokeDashoffset="310"
                      className="text-emerald-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">15</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Nível de Risco</span>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 mb-2">Seguro</Badge>
                  <p className="text-xs text-muted-foreground px-4 italic">
                    "O sistema apresenta estabilidade normal. Nenhuma tentativa de ataque em larga escala detectada nas últimas 24h."
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Atalhos de Defesa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-between text-xs border-white/10 hover:bg-red-500/10 hover:text-red-400 transition-all">
                Deslogar todos os usuários
                <Lock className="w-3 h-3" />
              </Button>
              <Button variant="outline" className="w-full justify-between text-xs border-white/10 hover:bg-amber-500/10 hover:text-amber-400 transition-all">
                Forçar MFA Global (Temp)
                <Fingerprint className="w-3 h-3" />
              </Button>
              <Button variant="outline" className="w-full justify-between text-xs border-white/10 hover:bg-primary/10 transition-all">
                Limpar Cache de Auditoria
                <Activity className="w-3 h-3" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MasterAntifraude;
