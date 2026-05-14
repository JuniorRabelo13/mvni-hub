import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  Ban,
  Loader2,
  Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const MasterAntifraude = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: profiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ["master-antifraude-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, email, status, risk_score, is_blocked, updated_at")
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    }
  });

  const { data: processedEvents, isLoading: loadingEvents } = useQuery({
    queryKey: ["master-antifraude-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processed_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    }
  });

  const { data: whatsappAlerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ["master-antifraude-wa-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_alerts")
        .select("*")
        .is("resolved_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const stats = useMemo(() => {
    const suspended = profiles?.filter(p => p.status === "suspenso")?.length || 0;
    const blocked = profiles?.filter(p => p.is_blocked)?.length || 0;
    const highRisk = profiles?.filter(p => (p.risk_score || 0) >= 80)?.length || 0;
    const activeAlerts = whatsappAlerts?.length || 0;

    return [
      { title: "Usuários Suspensos", value: suspended.toString(), icon: UserX, color: "text-amber-400" },
      { title: "Contas Bloqueadas", value: blocked.toString(), icon: Lock, color: "text-red-500" },
      { title: "Risco Crítico", value: highRisk.toString(), icon: AlertTriangle, color: "text-red-400" },
      { title: "Alertas Ativos", value: activeAlerts.toString(), icon: ShieldAlert, color: "text-orange-400" },
    ];
  }, [profiles, whatsappAlerts]);

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-red-500";
    if (score >= 50) return "text-orange-500";
    return "text-emerald-500";
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critica":
      case "critical": return <Badge variant="destructive" className="animate-pulse">Crítica</Badge>;
      case "alta":
      case "high": return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">Alta</Badge>;
      case "media":
      case "medium": return <Badge variant="outline" className="text-amber-400 border-amber-400/50">Média</Badge>;
      default: return <Badge variant="outline">{severity || "N/A"}</Badge>;
    }
  };

  const filteredIncidents = useMemo(() => {
    if (!profiles) return [];
    return profiles.filter(p => 
      !searchTerm || 
      p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [profiles, searchTerm]);

  const globalRiskScore = useMemo(() => {
    if (!profiles || profiles.length === 0) return 0;
    const avg = profiles.reduce((acc, curr) => acc + (curr.risk_score || 0), 0) / profiles.length;
    return Math.round(avg);
  }, [profiles]);

  if (loadingProfiles || loadingEvents || loadingAlerts) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
              <CardTitle>Risco por Usuário</CardTitle>
              <CardDescription>Análise de score e integridade das contas</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por Usuário..."
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
                    <TableHead className="text-white">Usuário</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white">Risco</TableHead>
                    <TableHead className="text-white">Última Ativ.</TableHead>
                    <TableHead className="text-white text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncidents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">Sem dados disponíveis</TableCell>
                    </TableRow>
                  ) : filteredIncidents.map((profile) => (
                    <TableRow key={profile.id} className="border-white/10 hover:bg-white/5 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-white text-sm">{profile.nome || "Usuário sem nome"}</span>
                          <span className="text-[10px] text-muted-foreground">{profile.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={profile.is_blocked ? "destructive" : profile.status === "ativo" ? "default" : "outline"} className="capitalize">
                          {profile.is_blocked ? "Bloqueado" : profile.status || "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 w-20">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className={getRiskColor(profile.risk_score || 0)}>{profile.risk_score || 0}%</span>
                          </div>
                          <Progress value={profile.risk_score || 0} className="h-1" />
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {profile.updated_at ? formatDistanceToNow(new Date(profile.updated_at), { addSuffix: true, locale: ptBR }) : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-white/10">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-popover/95 border-white/10 backdrop-blur-md">
                            <DropdownMenuItem className="gap-2 cursor-pointer">
                              <Activity className="w-4 h-4" /> Investigar Perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer">
                              <CheckCircle2 className="w-4 h-4" /> Zerar Risco
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem className="gap-2 text-red-400 cursor-pointer">
                              <Ban className="w-4 h-4" /> Bloquear Acesso
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
          <Card className="bg-card/50 border-white/10 backdrop-blur-sm border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
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
                      strokeDashoffset={364.4 - (364.4 * globalRiskScore / 100)}
                      className={getRiskColor(globalRiskScore)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">{globalRiskScore}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Score Médio</span>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <Badge className={getRiskColor(globalRiskScore).replace('text', 'bg') + "/20 " + getRiskColor(globalRiskScore) + " border-none mb-2"}>
                    {globalRiskScore >= 80 ? "Perigo" : globalRiskScore >= 50 ? "Alerta" : "Seguro"}
                  </Badge>
                  <p className="text-xs text-muted-foreground px-4 italic">
                    {globalRiskScore < 50 ? "\"O sistema apresenta estabilidade normal. Nenhuma anomalia crítica detectada.\"" : "\"Atenção: Nível de risco médio detectado em múltiplas contas.\""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
               <CardTitle className="text-sm font-bold flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Eventos Processados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {processedEvents && processedEvents.length > 0 ? processedEvents.map(event => (
                <div key={event.id} className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">{event.source || "System"}</span>
                    <span className="text-[9px] text-muted-foreground">{formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: ptBR })}</span>
                  </div>
                  <p className="text-[11px] text-white font-medium truncate">Event: {event.event_id?.slice(0, 16)}...</p>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${event.status === 'processed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="text-[9px] text-muted-foreground uppercase font-bold">{event.status || "registered"}</span>
                  </div>
                </div>
              )) : (
                <div className="py-4 text-center text-[10px] text-muted-foreground italic">Sem dados disponíveis</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MasterAntifraude;
