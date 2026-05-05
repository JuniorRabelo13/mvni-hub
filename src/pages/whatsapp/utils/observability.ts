import { supabase } from "@/integrations/supabase/client";

export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  event: string;
  sessionId?: string;
  agentId?: string;
  requestId?: string;
  status?: string;
  durationMs?: number;
  errorCode?: string;
  errorMessage?: string;
  backendReason?: string;
  metadata?: any;
}

const environment = import.meta.env.MODE;

export const logger = {
  async log(level: LogLevel, entry: LogEntry) {
    const timestamp = new Date().toISOString();
    
    // Console logging
    const consoleMethod = level === "error" ? "error" : level === "warn" ? "warn" : "log";
    console[consoleMethod](`[${timestamp}] [${level.toUpperCase()}] [${entry.event}]`, entry);

    try {
      // Persistence to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from("whatsapp_audit_logs").insert({
        level,
        event: entry.event,
        session_id: entry.sessionId,
        agent_id: entry.agentId,
        user_id: user?.id,
        request_id: entry.requestId,
        status: entry.status,
        duration_ms: entry.durationMs,
        error_code: entry.errorCode,
        error_message: entry.errorMessage,
        backend_reason: entry.backendReason,
        environment,
        metadata: entry.metadata || {}
      });
      
      // Track metrics for specific events
      if (entry.event.endsWith("_success") || entry.event.endsWith("_error") || entry.event.endsWith("_total")) {
        await this.trackMetric(entry.event, 1, { 
          agentId: entry.agentId, 
          status: entry.status,
          errorCode: entry.errorCode 
        });
      }
      
      if (entry.durationMs) {
        await this.trackMetric(`${entry.event}_latency`, entry.durationMs, { agentId: entry.agentId });
      }

    } catch (e) {
      console.error("Failed to persist log/metric:", e);
    }
  },

  async trackMetric(name: string, value: number, dimensions: any = {}) {
    try {
      await supabase.from("whatsapp_metrics").insert({
        metric_name: name,
        metric_value: value,
        dimensions: { ...dimensions, environment }
      });
    } catch (e) {
      console.error("Failed to track metric:", e);
    }
  },

  info(entry: LogEntry) { return this.log("info", entry); },
  warn(entry: LogEntry) { return this.log("warn", entry); },
  error(entry: LogEntry) { return this.log("error", entry); }
};
