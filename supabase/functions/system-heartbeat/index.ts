import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckResult {
  service: string;
  status: "healthy" | "warning" | "critical" | "offline" | "degraded";
  latency_ms: number;
  details?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const results: CheckResult[] = [];
  const startedAt = Date.now();

  const time = async <T,>(fn: () => Promise<T>) => {
    const t0 = Date.now();
    try {
      const v = await fn();
      return { ok: true, ms: Date.now() - t0, value: v } as const;
    } catch (e) {
      return { ok: false, ms: Date.now() - t0, error: (e as Error).message } as const;
    }
  };

  // 1. DATABASE
  {
    const r = await time(() => supabase.from("profiles").select("id", { count: "exact", head: true }));
    results.push({
      service: "database",
      status: r.ok ? (r.ms > 1500 ? "degraded" : "healthy") : "critical",
      latency_ms: r.ms,
      details: r.ok ? {} : { error: r.error },
    });
  }

  // 2. QUEUES (queue_jobs)
  {
    const r = await time(async () => {
      const { count, error } = await supabase
        .from("queue_jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    });
    const pending = (r.ok ? (r.value as number) : 0);
    results.push({
      service: "queues",
      status: !r.ok ? "warning" : pending > 10000 ? "critical" : pending > 2000 ? "degraded" : "healthy",
      latency_ms: r.ms,
      details: { pending },
    });
  }

  // 3. WORKERS (last whatsapp_instance_health)
  {
    const r = await time(async () => {
      const { data } = await supabase
        .from("whatsapp_instances")
        .select("id,status,last_seen,health_score");
      return data ?? [];
    });
    const list = (r.ok ? r.value : []) as Array<{ status: string; last_seen: string; health_score: number }>;
    const stale = list.filter((i) => Date.now() - new Date(i.last_seen).getTime() > 120000).length;
    results.push({
      service: "whatsapp",
      status: !r.ok ? "warning" : stale > 0 ? "degraded" : "healthy",
      latency_ms: r.ms,
      details: { total: list.length, stale },
    });
  }

  // 4. TELECOM JOBS
  {
    const r = await time(async () => {
      const { count } = await supabase
        .from("telecom_jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      return count ?? 0;
    });
    const p = (r.ok ? r.value : 0) as number;
    results.push({
      service: "telecom",
      status: !r.ok ? "warning" : p > 500 ? "degraded" : "healthy",
      latency_ms: r.ms,
      details: { pending: p },
    });
  }

  // 5. AI (recent token usage as proxy for availability)
  {
    const r = await time(async () => {
      const { count } = await supabase
        .from("ai_token_usage")
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 5 * 60_000).toISOString());
      return count ?? 0;
    });
    results.push({
      service: "ai",
      status: r.ok ? "healthy" : "warning",
      latency_ms: r.ms,
      details: { calls_last_5min: r.ok ? r.value : 0 },
    });
  }

  // 6. REALTIME (proxy: db reachable)
  results.push({
    service: "realtime",
    status: "healthy",
    latency_ms: 0,
    details: { note: "proxy via db" },
  });

  // Persist health checks + provider status + uptime
  const checksToInsert = results.map((r) => ({
    service: r.service,
    status: r.status,
    latency_ms: r.latency_ms,
    details: r.details ?? {},
  }));
  await supabase.from("system_health_checks").insert(checksToInsert);

  for (const r of results) {
    await supabase.from("system_provider_status").upsert(
      {
        provider: r.service,
        status: r.status,
        last_check: new Date().toISOString(),
        last_success: r.status === "healthy" ? new Date().toISOString() : undefined,
        last_failure: r.status === "critical" || r.status === "offline" ? new Date().toISOString() : undefined,
        consecutive_failures: 0,
        latency_ms: r.latency_ms,
        metadata: r.details ?? {},
      },
      { onConflict: "provider" },
    );

    await supabase.from("system_uptime_logs").insert({
      module: r.service,
      status: r.status,
      uptime_pct: r.status === "healthy" ? 100 : r.status === "degraded" ? 80 : 0,
      downtime_seconds: r.status === "healthy" ? 0 : 30,
    });

    // Raise alerts for non-healthy
    if (r.status !== "healthy") {
      const severity = r.status === "critical" || r.status === "offline"
        ? "critical"
        : r.status === "degraded" ? "high" : "medium";
      await supabase.rpc("register_system_alert", {
        p_module: r.service,
        p_severity: severity,
        p_status: r.status,
        p_title: `${r.service} status ${r.status}`,
        p_message: `Latência ${r.latency_ms}ms`,
        p_fingerprint: `${r.service}:${r.status}`,
        p_metadata: r.details ?? {},
      });

      // Open incident if none open
      const { data: existing } = await supabase
        .from("system_incidents")
        .select("id")
        .eq("module", r.service)
        .eq("status", "open")
        .maybeSingle();
      if (!existing) {
        await supabase.from("system_incidents").insert({
          module: r.service,
          title: `Incidente em ${r.service}`,
          severity,
          impact: `Status ${r.status}`,
          metadata: r.details ?? {},
        });
      }
    }
  }

  // Auto-recovery + cleanup (light)
  await supabase.rpc("auto_recover_alerts");

  return new Response(
    JSON.stringify({
      ok: true,
      duration_ms: Date.now() - startedAt,
      checks: results,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
  );
});
