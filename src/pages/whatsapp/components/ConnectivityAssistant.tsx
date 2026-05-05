import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, AlertCircle, Copy, Activity } from "lucide-react";
import { logger } from "../utils/observability";
import { toast } from "sonner";

interface Step {
  id: string;
  label: string;
  status: "idle" | "loading" | "ok" | "warn" | "fail";
  message?: string;
}

interface ConnectivityAssistantProps {
  apiBaseUrl: string;
  agentId?: string;
  tenantId?: string;
}

export function ConnectivityAssistant({ apiBaseUrl, agentId, tenantId }: ConnectivityAssistantProps) {
  const [steps, setSteps] = useState<Step[]>([
    { id: "dns", label: "Resolvendo DNS da API", status: "idle" },
    { id: "health", label: "Testando /health", status: "idle" },
    { id: "preflight", label: "Testando Preflight OPTIONS /start", status: "idle" },
    { id: "start", label: "Testando POST /start (Payload Mínimo)", status: "idle" },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [diagnosis, setDiagnosis] = useState<{ cause: string; action: string; raw: any } | null>(null);

  const updateStep = (id: string, updates: Partial<Step>) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const runDiagnosis = async () => {
    setIsRunning(true);
    setDiagnosis(null);
    const results: any = {};
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    // Reset steps
    setSteps(prev => prev.map(s => ({ ...s, status: "idle", message: "" })));

    try {
      // 1. DNS / Network check
      updateStep("dns", { status: "loading" });
      try {
        const url = new URL(apiBaseUrl);
        // Using a tiny image or just a fetch to root with no-cors to check reachability
        await fetch(`https://${url.hostname}`, { mode: 'no-cors' });
        updateStep("dns", { status: "ok" });
        results.dns = "OK";
      } catch (e: any) {
        updateStep("dns", { status: "fail", message: "Domínio inacessível ou DNS não resolve" });
        results.dns = "FAIL";
        throw { cause: "DNS_UNREACHABLE", error: e };
      }

      // 2. Health check
      updateStep("health", { status: "loading" });
      try {
        const res = await fetch(`${apiBaseUrl}/health`).catch(err => {
          if (err.message.includes("SSL") || err.message.includes("cert")) {
             throw { cause: "SSL_INVALID", error: err };
          }
          throw err;
        });

        if (res.ok) {
          updateStep("health", { status: "ok" });
          results.health = "OK";
        } else {
          updateStep("health", { status: "warn", message: `HTTP ${res.status}` });
          results.health = `WARN_${res.status}`;
        }
      } catch (e: any) {
        if (e.cause) throw e;
        updateStep("health", { status: "fail", message: e.message });
        results.health = "FAIL";
        throw { cause: "API_URL_INVALID", error: e };
      }

      // 3. Preflight OPTIONS
      updateStep("preflight", { status: "loading" });
      try {
        const res = await fetch(`${apiBaseUrl}/start`, {
          method: "OPTIONS",
        });
        if (res.ok) {
          updateStep("preflight", { status: "ok" });
          results.preflight = "OK";
        } else {
          updateStep("preflight", { status: "warn", message: `HTTP ${res.status}` });
          results.preflight = `WARN_${res.status}`;
          if (res.status === 0 || res.status === 405) {
             throw { cause: "CORS_PRELIGHT_BLOCKED", error: { status: res.status } };
          }
        }
      } catch (e: any) {
        if (e.cause) throw e;
        updateStep("preflight", { status: "fail", message: "CORS ou SSL bloqueou preflight" });
        results.preflight = "FAIL";
        throw { cause: "CORS_PRELIGHT_BLOCKED", error: e };
      }

      // 4. POST /start minimal
      updateStep("start", { status: "loading" });
      try {
        const res = await fetch(`${apiBaseUrl}/start`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Request-Id": requestId 
          },
          body: JSON.stringify({ agentId: "test-diag", sessionId: "diag-" + Date.now() })
        });
        
        if (res.ok || res.status === 401 || res.status === 403) {
           if (res.status === 401 || res.status === 403) {
             updateStep("start", { status: "warn", message: "Acesso negado (Auth)" });
             results.start = "AUTH_HEADER_MISSING";
             throw { cause: "AUTH_HEADER_MISSING", error: { status: res.status } };
           } else {
             updateStep("start", { status: "ok" });
             results.start = "OK";
           }
        } else {
          updateStep("start", { status: "fail", message: `HTTP ${res.status}` });
          results.start = `FAIL_${res.status}`;
          throw { cause: "START_ENDPOINT_FAIL", error: { status: res.status } };
        }
      } catch (e: any) {
        if (e.cause) throw e;
        updateStep("start", { status: "fail", message: e.message });
        results.start = "FAIL";
        throw { cause: "START_ENDPOINT_FAIL", error: e };
      }

      setDiagnosis({
        cause: "NONE",
        action: "Conectividade normal. Se o erro persiste, verifique logs do WhatsApp.",
        raw: results
      });

    } catch (e: any) {
      const cause = e.cause || "UNKNOWN";
      let action = "Tente recarregar ou verificar o servidor.";
      
      if (cause === "API_URL_INVALID") action = "Verifique se a URL da API está correta e ativa.";
      if (cause === "DNS_UNREACHABLE") action = "Servidor inacessível. Verifique rede/DNS.";
      if (cause === "SSL_INVALID") action = "Certificado SSL inválido ou expirado.";
      if (cause === "CORS_PRELIGHT_BLOCKED") action = "Backend deve permitir OPTIONS e headers customizados.";
      if (cause === "START_ENDPOINT_FAIL") action = "Endpoint /start falhou. Verifique logs do backend.";
      if (cause === "AUTH_HEADER_MISSING") action = "API exige autenticação não fornecida no teste.";
      
      setDiagnosis({ cause, action, raw: { ...results, error: e.error?.message || e.error } });
    } finally {
      setIsRunning(false);
      
      logger.info({
        event: "connectivity_diagnosis_run",
        agentId,
        requestId,
        metadata: {
          tenantId,
          apiBaseUrl,
          durationMs: Date.now() - startTime,
          results,
          finalCause: diagnosis?.cause
        }
      });
    }
  };

  return (
    <div className="space-y-4 bg-slate-950/50 p-4 rounded-lg border border-slate-800">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-400 flex items-center gap-2">
          <Activity className="h-3 w-3" /> Assistente de Correção
        </h4>
        <Button 
          size="sm" 
          variant="secondary" 
          className="h-7 text-[9px] px-3"
          onClick={runDiagnosis}
          disabled={isRunning}
        >
          {isRunning ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          {isRunning ? "Diagnosticando..." : "Iniciar Diagnóstico"}
        </Button>
      </div>

      <div className="space-y-2">
        {steps.map(step => (
          <div key={step.id} className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400">{step.label}</span>
            <div className="flex items-center gap-2">
              {step.status === "loading" && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
              {step.status === "ok" && <CheckCircle2 className="h-3 w-3 text-green-500" />}
              {step.status === "warn" && <AlertCircle className="h-3 w-3 text-yellow-500" />}
              {step.status === "fail" && <XCircle className="h-3 w-3 text-red-500" />}
              {step.status === "idle" && <div className="h-3 w-3 rounded-full border border-slate-700" />}
              {step.message && <span className="text-[8px] text-slate-500 max-w-[100px] truncate">{step.message}</span>}
            </div>
          </div>
        ))}
      </div>

      {diagnosis && (
        <div className="mt-4 p-3 rounded bg-blue-500/10 border border-blue-500/20 space-y-2 animate-in fade-in slide-in-from-top-1">
          <div className="flex flex-col">
            <span className="text-[9px] text-blue-400 uppercase font-bold">Causa provável:</span>
            <span className="text-[11px] font-mono text-white">{diagnosis.cause}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-blue-400 uppercase font-bold">Ação recomendada:</span>
            <span className="text-[10px] text-slate-300">{diagnosis.action}</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-[8px] w-full gap-1 mt-1 text-slate-400 hover:text-white"
            onClick={() => {
              const report = {
                diagnosis,
                steps,
                apiBaseUrl,
                agentId,
                timestamp: new Date().toISOString()
              };
              navigator.clipboard.writeText(JSON.stringify(report, null, 2));
              toast.success("Relatório copiado!");
            }}
          >
            <Copy className="h-3 w-3" /> Copiar relatório JSON
          </Button>
        </div>
      )}
    </div>
  );
}
