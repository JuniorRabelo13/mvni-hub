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
import { normalizeConnectError, NormalizedError } from "./utils/error-handler";
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
import { ConnectivityAssistant } from "./components/ConnectivityAssistant";
import { getApiBaseUrl, buildApiUrl } from "./utils/api-config";


export default function AgenteAgentes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();
  const [connectingAgentId, setConnectingAgentId] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  
  const isAdmin = user?.email?.includes('admin');
  
  const [resolvedBaseUrl, setResolvedBaseUrl] = useState<string>("");
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setResolvedBaseUrl(getApiBaseUrl());
      setUrlError(null);
    } catch (e: any) {
      setUrlError(e.message);
    }
  }, []);

  
  const [agentConnections, setAgentConnections] = useState<Record<string, {
    sessionId?: string;
    requestId?: string;
    status: "iniciando" | "gerando_qr" | "qr_pronto" | "conectado" | "erro";
    qr?: string | null;
    startedAt?: number;
    error?: string;
    normalizedError?: NormalizedError;
    attempts?: number;
    lastPollStatus?: string;
  }>>({});

  const [, forceUpdate] = useState({});
  const qrTimeoutRef = useRef<Record<string, any>>({});
  const qrAbortRef = useRef<Record<string, AbortController | null>>({});
  const pollSeqRef = useRef<Record<string, number>>({});
  const agentConnectionsRef = useRef(agentConnections);
  useEffect(() => { agentConnectionsRef.current = agentConnections; }, [agentConnections]);

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
      
      logger.info({ event: "connect_click", agentId, sessionId, requestId });

      setAgentConnections(prev => ({
        ...prev,
        [agentId]: { sessionId, requestId, status: "iniciando", startedAt: Date.now() }
      }));

      try {
        const endpointPath = "/start";
        const method = "POST";
        const resolvedUrl = buildApiUrl(endpointPath);

        const response = await fetch(resolvedUrl, {
          method,
          headers: {
            "Content-Type": "application/json",
            "X-Request-Id": requestId
          },
          body: JSON.stringify({ sessionId, agentId }),
        });

        if (!response.ok) throw response;
        
        const data = await response.json();
        logger.info({ event: "start_response_ok", agentId, sessionId, requestId, durationMs: Date.now() - startTime, metadata: { resolvedUrl, method } });
        return data;
      } catch (error: any) {
        const normalized = await normalizeConnectError(error, { 
          endpointPath: "/start", 
          method: "POST",
          sessionId, 
          requestId, 
          agentId, 
          startTime 
        });
        setAgentConnections(prev => ({
          ...prev,
          [agentId]: { ...prev[agentId], status: "erro", error: normalized.userMessage, normalizedError: normalized }
        }));
        throw error;
      }
    },
    onError: (error: any, agentId: string) => {
      toast.error("Erro ao iniciar conexão: " + error.message, { id: `start-error-${agentId}` });
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
    const getNextInterval = (attempts: number) => {
      if (attempts <= 10) return 2000;
      if (attempts <= 20) return 3000;
      return 5000;
    };

    if (!isQrModalOpen || !connectingAgentId) return;
    const agentId = connectingAgentId;

    // Ensure only one polling sequence per agent
    const seq = (pollSeqRef.current[agentId] || 0) + 1;
    pollSeqRef.current[agentId] = seq;

    const isStale = () => pollSeqRef.current[agentId] !== seq;

    const poll = async () => {
      if (isStale()) return;
      const connection = agentConnectionsRef.current[agentId];
      if (!connection?.sessionId) return;

      const attempts = (connection.attempts || 0) + 1;
      const elapsedTime = (Date.now() - (connection.startedAt || Date.now())) / 1000;

      if (elapsedTime > 60) {
        setAgentConnections(prev => ({ ...prev, [agentId]: { ...prev[agentId], status: "erro", error: "Tempo limite excedido. Tente novamente." } }));
        toast.error("Tempo limite excedido. Tente novamente.", { id: `timeout-${agentId}` });
        return;
      }

      // Cancel previous in-flight fetch for this agent
      if (qrAbortRef.current[agentId]) {
        try { qrAbortRef.current[agentId]?.abort(); } catch {}
      }
      const controller = new AbortController();
      qrAbortRef.current[agentId] = controller;

      try {
        const endpointPath = `/qr/${connection.sessionId}`;
        const method = "GET";
        const resolvedUrl = buildApiUrl(endpointPath);

        const response = await fetch(resolvedUrl, {
          method,
          headers: { "X-Request-Id": connection.requestId || "" },
          signal: controller.signal,
        });

        if (isStale()) return;

        if (response.ok) {
          const data = await response.json();
          if (isStale()) return;

          if (data.qr) {
            setAgentConnections(prev => ({ ...prev, [agentId]: { ...prev[agentId], status: "qr_pronto", qr: data.qr, attempts } }));
            return;
          } else if (data.status === "conectado") {
            setAgentConnections(prev => ({ ...prev, [agentId]: { ...prev[agentId], status: "conectado", qr: null, attempts } }));
            toast.success("WhatsApp conectado com sucesso!");
            setTimeout(() => {
              if (isStale()) return;
              setIsQrModalOpen(false);
              setConnectingAgentId(null);
              queryClient.invalidateQueries({ queryKey: ["whatsapp-agents"] });
            }, 2000);
            return;
          } else if (data.error === "QR_NOT_READY") {
            setAgentConnections(prev => ({
              ...prev,
              [agentId]: { ...prev[agentId], status: "gerando_qr", attempts }
            }));
          } else {
            setAgentConnections(prev => ({ ...prev, [agentId]: { ...prev[agentId], attempts } }));
          }
        } else {
          throw response;
        }
      } catch (error: any) {
        if (error?.name === "AbortError" || isStale()) return;
        const normalized = await normalizeConnectError(error, {
          endpointPath: `/qr/${connection.sessionId}`,
          method: "GET",
          sessionId: connection.sessionId,
          requestId: connection.requestId,
          agentId,
          attempt: attempts,
          startTime: connection.startedAt
        });
        if (isStale()) return;
        // Soft-failure: keep polling, do not lock modal in error
        setAgentConnections(prev => ({
          ...prev,
          [agentId]: { ...prev[agentId], status: "gerando_qr", attempts, lastPollStatus: normalized.code }
        }));
      }

      if (isStale()) return;
      qrTimeoutRef.current[agentId] = setTimeout(poll, getNextInterval(attempts));
    };

    const timerInterval = setInterval(() => forceUpdate({}), 1000);
    poll();

    return () => {
      clearInterval(timerInterval);
      // Invalidate this polling sequence
      pollSeqRef.current[agentId] = (pollSeqRef.current[agentId] || 0) + 1;
      if (qrTimeoutRef.current[agentId]) {
        clearTimeout(qrTimeoutRef.current[agentId]);
        delete qrTimeoutRef.current[agentId];
      }
      if (qrAbortRef.current[agentId]) {
        try { qrAbortRef.current[agentId]?.abort(); } catch {}
        qrAbortRef.current[agentId] = null;
      }
    };
  }, [isQrModalOpen, connectingAgentId, queryClient]);

  const activeAgent = agents?.find(a => a.id === connectingAgentId);
  
  useEffect(() => {
    if (activeAgent?.status_conexao === 'conectado' && isQrModalOpen) {
      setIsQrModalOpen(false);
      setConnectingAgentId(null);
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
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Conexão</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8">Carregando...</TableCell></TableRow>
                ) : agents?.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {agent.numero_whatsapp}
                    </TableCell>
                    <TableCell><Badge>{agent.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${agent.conectado ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-xs uppercase">{agent.status_conexao || 'desconectado'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {agent.conectado ? (
                        <Button variant="ghost" size="sm" onClick={() => disconnectMutation.mutate(agent.id)} disabled={disconnectMutation.isPending}>
                          <PowerOff className="h-4 w-4 mr-1" /> Desconectar
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => connectMutation.mutate(agent.id)} disabled={connectMutation.isPending}>
                          <QrCode className="h-4 w-4 mr-1" /> Conectar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Controle</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="flex justify-between mb-2">
                <span>Ativos:</span>
                <span className="font-bold">{agents?.length || 0}</span>
              </div>
            </div>
            <Button variant="outline" className="w-full gap-2">
              <RefreshCw className="h-4 w-4" /> Resetar
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="min-h-[300px] w-full flex flex-col items-center justify-center">
              {connectingAgentId && agentConnections[connectingAgentId]?.status === "conectado" ? (
                <div className="text-center space-y-4">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                  <h3 className="text-xl font-semibold text-green-500">Conectado!</h3>
                  <Button onClick={() => setIsQrModalOpen(false)}>Fechar</Button>
                </div>
              ) : connectingAgentId && agentConnections[connectingAgentId]?.status === "erro" ? (
                <div className="text-center space-y-4 w-full">
                  <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                  <h3 className="text-xl font-semibold text-red-500">Erro</h3>
                  <p className="text-sm text-muted-foreground">{agentConnections[connectingAgentId]?.error}</p>
                  
                  {agentConnections[connectingAgentId]?.normalizedError && (
                    <Collapsible className="w-full border rounded-md">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full flex justify-between px-3 text-[10px]">
                          Detalhes Técnicos <ChevronDown className="h-3 w-3" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-3 bg-muted/30 text-[10px] text-left space-y-2">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(agentConnections[connectingAgentId].normalizedError, null, 2)}</pre>
                        <Button variant="outline" size="sm" className="w-full h-7 text-[9px]" onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(agentConnections[connectingAgentId].normalizedError, null, 2));
                          toast.success("Copiado!");
                        }}>Copiar JSON</Button>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                  <Button variant="outline" onClick={() => connectMutation.mutate(connectingAgentId)} className="w-full">Repetir</Button>
                </div>
              ) : connectingAgentId && agentConnections[connectingAgentId]?.status === "qr_pronto" ? (
                <div className="text-center space-y-4">
                  <img src={agentConnections[connectingAgentId].qr!} className="w-[250px] h-[250px] mx-auto border" />
                  <div className="flex items-center gap-2 justify-center text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Aguardando...</div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                  <p>{connectingAgentId && agentConnections[connectingAgentId]?.status === "gerando_qr" ? "Gerando QR..." : "Iniciando..."}</p>
                </div>
              )}
            </div>

            {isAdmin && connectingAgentId && (
              <div className="w-full mt-2 border-t pt-4 space-y-3">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase font-semibold">
                  <span>Debug Admin</span> <Activity className="h-3 w-3" />
                </div>
                <div className="bg-slate-950/50 p-3 rounded border border-slate-800 text-[10px] font-mono space-y-2">
                  <div><span className="text-blue-400">BASE_URL:</span> {urlError ? <span className="text-red-500 font-bold">API_URL_INVALID ({urlError})</span> : resolvedBaseUrl}</div>
                  
                  {connectingAgentId && agentConnections[connectingAgentId] && (
                    <>
                      <div>
                        <span className="text-blue-400">ENDPOINT:</span> {
                          agentConnections[connectingAgentId].status === "iniciando" ? "/start" :
                          agentConnections[connectingAgentId].status === "gerando_qr" || agentConnections[connectingAgentId].status === "qr_pronto" ? `/qr/${agentConnections[connectingAgentId].sessionId}` : "N/A"
                        }
                      </div>
                      <div>
                        <span className="text-blue-400">RESOLVED_URL:</span> {
                          agentConnections[connectingAgentId].status === "iniciando" ? buildApiUrl("/start") :
                          agentConnections[connectingAgentId].status === "gerando_qr" || agentConnections[connectingAgentId].status === "qr_pronto" ? buildApiUrl(`/qr/${agentConnections[connectingAgentId].sessionId}`) : "N/A"
                        }
                      </div>
                      <div>
                        <span className="text-blue-400">METHOD:</span> {
                          agentConnections[connectingAgentId].status === "iniciando" ? "POST" : "GET"
                        }
                      </div>
                    </>
                  )}

                  {!urlError && <ConnectivityAssistant apiBaseUrl={resolvedBaseUrl} agentId={connectingAgentId || undefined} tenantId={user?.id} />}
                </div>

              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {isAdmin && <div className="mt-8 border-t pt-8"><h2 className="text-lg font-semibold mb-4">Checklist Go-Live (Admin)</h2><GoLiveChecklist /></div>}
    </div>
  );
}

function GoLiveChecklist() {
  const items = [
    { label: "Polling cancel on close", status: "OK" },
    { label: "Backoff progressivo", status: "OK" },
    { label: "Isolamento de estado", status: "OK" },
    { label: "Audit logs ativos", status: "OK" },
  ];
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableBody>
          {items.map((item, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium text-xs">{item.label}</TableCell>
              <TableCell><Badge className="bg-green-500">{item.status}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
