import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Phone, RefreshCw, QrCode, Power, PowerOff, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useRef, useMemo } from "react";
import { logger } from "./utils/observability";
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  BarChart3, 
  Activity, 
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Copy
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";

export default function AgenteAgentes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();
  const [connectingAgentId, setConnectingAgentId] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  
  // Isolated state per agent for concurrent or sequential connections
  const [agentConnections, setAgentConnections] = useState<Record<string, {
    sessionId?: string;
    requestId?: string;
    status: "iniciando" | "gerando_qr" | "qr_pronto" | "conectado" | "erro";
    qr?: string | null;
    startedAt?: number;
    error?: string;
    attempts?: number;
    lastPollStatus?: string;
  }>>({});

  const [, forceUpdate] = useState({});
  const qrTimeoutRef = useRef<Record<string, any>>({});

  const { data: agents, isLoading } = useQuery({
    queryKey: ["whatsapp-agents"],
    queryFn: async () => {
      const { data } = await supabase
        .from("whatsapp_agents")
        .select("*, whatsapp_number_stats(*)");
      return data || [];
    }
  });

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const { data: agent, error } = await supabase.from("whatsapp_agents").insert({
        ...values,
        user_id: user?.id,
        status: 'ativo',
        mensagens_enviadas_hoje: 0,
        nivel_aquecimento: 1,
        subscription_price: 49.90
      }).select().single();
      
      if (error) throw error;

      await supabase.from("whatsapp_number_stats").insert({
        agent_id: agent.id,
        warming_level: 1,
        daily_volume_limit: 42
      });

      return agent;
    },
    onSuccess: (agent) => {
      toast.success("Agente criado! Iniciando conexão...");
      queryClient.invalidateQueries({ queryKey: ["whatsapp-agents"] });
      reset();
      if (agent?.id) {
        connectMutation.mutate(agent.id);
      }
    },
    onError: (error) => {
      toast.error("Erro ao criar agente: " + error.message);
    }
  });

  const connectMutation = useMutation({
    mutationFn: async (agentId: string) => {
      setConnectingAgentId(agentId);
      setIsQrModalOpen(true);
      
      const sessionId = crypto.randomUUID();
      const requestId = crypto.randomUUID();
      const startTime = Date.now();
      
      logger.info({ 
        event: "connect_click", 
        agentId, 
        sessionId, 
        requestId 
      });

      setAgentConnections(prev => ({
        ...prev,
        [agentId]: {
          sessionId,
          requestId,
          status: "iniciando",
          startedAt: Date.now()
        }
      }));

      try {
        logger.info({ 
          event: "start_request_sent", 
          agentId, 
          sessionId, 
          requestId 
        });

        const response = await fetch("https://hmzqfcooxqucytxwljhg.supabase.co/functions/v1/whatsapp-api/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Request-Id": requestId
          },
          body: JSON.stringify({ sessionId, agentId }),
        });

        const durationMs = Date.now() - startTime;

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          logger.error({ 
            event: "start_response_error", 
            agentId, 
            sessionId, 
            requestId, 
            durationMs,
            errorCode: response.status.toString(),
            errorMessage: errorData.error || "Falha ao iniciar sessão",
            backendReason: response.status === 405 ? "405" : undefined
          });
          throw new Error("Falha ao iniciar sessão");
        }
        
        const data = await response.json();
        logger.info({ 
          event: "start_response_ok", 
          agentId, 
          sessionId, 
          requestId, 
          durationMs 
        });
        
        return data;
      } catch (error: any) {
        setAgentConnections(prev => ({
          ...prev,
          [agentId]: { ...prev[agentId], status: "erro", error: error.message || "Falha ao iniciar sessão" }
        }));
        throw error;
      }
    },
    onError: (error: any, agentId: string) => {
      // Use toast only if it's not a duplicate within 2 seconds
      toast.error("Erro ao iniciar conexão: " + error.message, {
        id: `start-error-${agentId}`
      });
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const { error } = await supabase.functions.invoke("whatsapp-connect", {
        body: { action: "disconnect", agentId }
      });
      if (error) throw error;
      
      await supabase.from("whatsapp_agents").update({
        conectado: false,
        status_conexao: 'desconectado',
        qr_code: null
      }).eq('id', agentId);
    },
    onSuccess: () => {
      toast.success("Desconectado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["whatsapp-agents"] });
    }
  });

  useEffect(() => {
    // Helper to calculate next polling interval based on attempts
    const getNextInterval = (attempts: number) => {
      if (attempts <= 10) return 2000;
      if (attempts <= 20) return 3000;
      return 5000;
    };

    const poll = async (agentId: string) => {
      const connection = agentConnections[agentId];
      if (!connection?.sessionId || !isQrModalOpen || connectingAgentId !== agentId) {
        if (connection?.sessionId) {
          logger.info({ 
            event: "polling_cancelled", 
            agentId, 
            sessionId: connection.sessionId, 
            requestId: connection.requestId 
          });
        }
        return;
      }

      const attempts = (connection.attempts || 0) + 1;
      const elapsedTime = (Date.now() - (connection.startedAt || Date.now())) / 1000;

      if (attempts === 1) {
        logger.info({ 
          event: "qr_poll_started", 
          agentId, 
          sessionId: connection.sessionId, 
          requestId: connection.requestId 
        });
      }

      if (elapsedTime > 60) {
        setAgentConnections(prev => ({
          ...prev,
          [agentId]: { ...prev[agentId], status: "erro" }
        }));
        logger.error({ 
          event: "qr_timeout", 
          agentId, 
          sessionId: connection.sessionId, 
          requestId: connection.requestId,
          durationMs: elapsedTime * 1000
        });
        toast.error("Tempo limite excedido. Não foi possível gerar QR. Tente novamente.", {
          id: `timeout-${agentId}`
        });
        return;
      }

      try {
        const pollStartTime = Date.now();
        const response = await fetch(`https://hmzqfcooxqucytxwljhg.supabase.co/functions/v1/whatsapp-api/qr/${connection.sessionId}`, {
          headers: { "X-Request-Id": connection.requestId || "" }
        });
        
        if (!isQrModalOpen || connectingAgentId !== agentId) return;

        const durationMs = Date.now() - pollStartTime;
        
        logger.info({ 
          event: "qr_poll_tick", 
          agentId, 
          sessionId: connection.sessionId, 
          requestId: connection.requestId,
          status: response.status.toString(),
          durationMs,
          metadata: { attempts }
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.qr) {
            setAgentConnections(prev => ({
              ...prev,
              [agentId]: { ...prev[agentId], status: "qr_pronto", qr: data.qr, lastPollStatus: "qr_recebido" }
            }));
            logger.info({ 
              event: "qr_received", 
              agentId, 
              sessionId: connection.sessionId, 
              requestId: connection.requestId,
              durationMs: Date.now() - (connection.startedAt || 0)
            });
            return;
          } else if (data.status === "conectado") {
            setAgentConnections(prev => ({
              ...prev,
              [agentId]: { ...prev[agentId], status: "conectado", qr: null, lastPollStatus: "conectado" }
            }));
            logger.info({ 
              event: "connection_open", 
              agentId, 
              sessionId: connection.sessionId, 
              requestId: connection.requestId 
            });
            toast.success("WhatsApp conectado com sucesso!");
            setTimeout(() => {
              setIsQrModalOpen(false);
              setConnectingAgentId(null);
              queryClient.invalidateQueries({ queryKey: ["whatsapp-agents"] });
            }, 2000);
            return;
          } else {
            setAgentConnections(prev => ({
              ...prev,
              [agentId]: { ...prev[agentId], status: "gerando_qr", attempts, lastPollStatus: data.status }
            }));
          }
        } else {
           setAgentConnections(prev => ({
            ...prev,
            [agentId]: { ...prev[agentId], attempts, lastPollStatus: `Error ${response.status}` }
          }));
        }
      } catch (error: any) {
        console.error("Erro ao buscar QR Code:", error);
        setAgentConnections(prev => ({
          ...prev,
          [agentId]: { ...prev[agentId], attempts, lastPollStatus: `Fetch Error: ${error.message}` }
        }));
      }

      const nextInterval = getNextInterval(attempts);
      qrTimeoutRef.current[agentId] = setTimeout(() => poll(agentId), nextInterval);
    };

    if (isQrModalOpen && connectingAgentId) {
      const agentId = connectingAgentId;
      
      // Update timer UI every second
      const timerInterval = setInterval(() => forceUpdate({}), 1000);

      // Initial poll
      if (!qrTimeoutRef.current[agentId]) {
        poll(agentId);
      }

      return () => {
        clearInterval(timerInterval);
        if (qrTimeoutRef.current[agentId]) {
          clearTimeout(qrTimeoutRef.current[agentId]);
          delete qrTimeoutRef.current[agentId];
        }
      };
    } else if (!isQrModalOpen && connectingAgentId) {
      const agentId = connectingAgentId;
      if (qrTimeoutRef.current[agentId]) {
        clearTimeout(qrTimeoutRef.current[agentId]);
        delete qrTimeoutRef.current[agentId];
      }
      setConnectingAgentId(null);
    }

    return () => {
      Object.values(qrTimeoutRef.current).forEach(timeout => clearTimeout(timeout));
    };
  }, [isQrModalOpen, connectingAgentId, queryClient, agentConnections]);

  useEffect(() => {
    let interval: any;
    if (isQrModalOpen && connectingAgentId) {
      interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ["whatsapp-agents"] });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isQrModalOpen, connectingAgentId, queryClient]);

  const activeAgent = agents?.find(a => a.id === connectingAgentId);
  
  useEffect(() => {
    if (activeAgent?.status_conexao === 'conectado' && isQrModalOpen) {
      setIsQrModalOpen(false);
      setConnectingAgentId(null);
      toast.success("WhatsApp conectado com sucesso!");
    }
  }, [activeAgent, isQrModalOpen]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Números Conectados</h1>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Novo Número
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conectar Novo WhatsApp</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="numero_whatsapp">Número do WhatsApp</Label>
                <Input id="numero_whatsapp" placeholder="Ex: 5511999999999" required {...register("numero_whatsapp")} />
              </div>
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                O limite de envios e o aquecimento do número são gerenciados automaticamente pela nossa IA para garantir a segurança da sua conta.
              </div>
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? "Conectando..." : "Conectar Agente"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Agentes Ativos</CardTitle>
            <CardDescription>Números que estão operando o Agente Vendedor.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Status Conexão</TableHead>
                  <TableHead>Segurança</TableHead>
                  <TableHead>Enviadas Hoje</TableHead>
                  <TableHead>Aquecimento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell>
                  </TableRow>
                ) : agents?.map((agent) => {
                  const stats = agent.whatsapp_number_stats?.[0];
                  return (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {agent.numero_whatsapp}
                      </TableCell>
                      <TableCell>
                        <Badge variant={agent.status === 'ativo' ? 'default' : 'destructive'}>
                          {agent.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${agent.conectado ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-xs font-medium uppercase">
                            {agent.status_conexao || 'desconectado'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={stats?.safety_status === 'safe' ? 'outline' : 'destructive'}>
                          {stats?.safety_status === 'safe' ? 'Seguro' : stats?.safety_status === 'warning' ? 'Atenção' : 'Pausado'}
                        </Badge>
                      </TableCell>
                      <TableCell>{agent.mensagens_enviadas_hoje} / {stats?.daily_volume_limit || '--'}</TableCell>
                      <TableCell className="text-xs">Automático (Nível {stats?.warming_level || 1})</TableCell>
                      <TableCell className="text-right">
                        {agent.conectado ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => disconnectMutation.mutate(agent.id)}
                            disabled={disconnectMutation.isPending}
                          >
                            <PowerOff className="h-4 w-4 mr-1" /> Desconectar
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => connectMutation.mutate(agent.id)}
                            disabled={connectMutation.isPending}
                          >
                            <QrCode className="h-4 w-4 mr-1" /> Conectar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {agents?.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum número conectado.
                    </TableCell>
                  </TableRow>
                ) as any}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Controle de Custos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="flex justify-between mb-2">
                <span>Números Conectados:</span>
                <span className="font-bold">{agents?.length || 0}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Custo Mensal Estimado:</span>
                <span className="font-bold text-green-600">
                  R$ {((agents?.length || 0) * 49.90).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground italic">
              * Cobrança de R$ 49,90 por número ativo. O sistema gerencia o aquecimento e limites automaticamente.
            </div>
            <Button variant="outline" className="w-full gap-2">
              <RefreshCw className="h-4 w-4" /> Resetar Contadores
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code abaixo com o seu WhatsApp para ativar o agente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <div id="qr-container" className="flex flex-col items-center justify-center min-h-[300px] w-full">
              {connectingAgentId && agentConnections[connectingAgentId]?.status === "conectado" ? (
                <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-300">
                  <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center">
                    <Power className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-green-500">Conectado com sucesso!</h3>
                  <p className="text-sm text-muted-foreground text-center">Seu WhatsApp está pronto para uso.</p>
                  <Button onClick={() => setIsQrModalOpen(false)} className="mt-4">Fechar</Button>
                </div>
              ) : connectingAgentId && agentConnections[connectingAgentId]?.status === "erro" ? (
                <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-300">
                  <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center">
                    <PowerOff className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-red-500">Falha na conexão</h3>
                  <p className="text-sm text-muted-foreground text-center">Não foi possível gerar o código. Verifique sua conexão.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => connectingAgentId && connectMutation.mutate(connectingAgentId)}
                    className="mt-4 gap-2"
                  >
                    <RefreshCw className="h-4 w-4" /> Repetir tentativa
                  </Button>
                </div>
              ) : connectingAgentId && agentConnections[connectingAgentId]?.status === "qr_pronto" && agentConnections[connectingAgentId]?.qr ? (
                <div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-300">
                  <div className="bg-white p-4 rounded-xl shadow-xl border-2 border-primary/20">
                    <img 
                      src={agentConnections[connectingAgentId].qr} 
                      alt="WhatsApp QR Code"
                      className="w-[250px] h-[250px]"
                      width="250"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Aguardando leitura...</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-6">
                  <div className="relative flex items-center justify-center">
                    <Loader2 className="h-16 w-16 animate-spin text-primary opacity-20" />
                    <Loader2 className="absolute h-10 w-10 animate-spin text-primary" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-medium animate-pulse">
                      {connectingAgentId && agentConnections[connectingAgentId]?.status === "gerando_qr" 
                        ? "Gerando QR Code..." 
                        : "Iniciando conexão..."}
                    </p>
                    {connectingAgentId && agentConnections[connectingAgentId]?.startedAt && (
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Tempo restante</span>
                        <span className="text-2xl font-mono font-bold text-primary">
                          {Math.max(0, 60 - Math.floor((Date.now() - agentConnections[connectingAgentId].startedAt!) / 1000))}s
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {(!connectingAgentId || (agentConnections[connectingAgentId]?.status !== "conectado" && agentConnections[connectingAgentId]?.status !== "erro")) && (
              <div className="text-center border-t border-border w-full pt-4">
                <p className="text-xs text-muted-foreground">
                  Vá em WhatsApp {'>'} Aparelhos Conectados {'>'} Conectar um Aparelho
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
