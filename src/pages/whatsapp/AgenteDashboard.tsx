import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Target, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AgenteDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["agente-stats"],
    queryFn: async () => {
      const { data: leads } = await supabase.from("leads").select("status");
      const { data: messages } = await supabase.from("whatsapp_messages").select("id", { count: "exact" });
      const { data: agents } = await supabase.from("whatsapp_agents").select("id");
      const { data: numberStats } = await supabase.from("whatsapp_number_stats").select("warming_level, daily_volume_limit, total_errors, total_sent");
      
      const totalLeads = leads?.length || 0;
      const respondidos = leads?.filter(l => l.status === 'respondeu').length || 0;
      const clientes = leads?.filter(l => l.status === 'cliente').length || 0;
      const totalMessages = messages?.length || 0;
      
      const avgWarming = numberStats?.length 
        ? Math.round(numberStats.reduce((acc, s) => acc + (s.warming_level || 1), 0) / numberStats.length)
        : 1;

      const totalErrors = numberStats?.reduce((acc, s) => acc + (s.total_errors || 0), 0) || 0;
      const totalSent = numberStats?.reduce((acc, s) => acc + (s.total_sent || 0), 0) || 1;
      const errorRate = (totalErrors / totalSent) * 100;

      return {
        totalLeads,
        taxaConversao: totalLeads > 0 ? ((clientes / totalLeads) * 100).toFixed(1) : 0,
        respondidos,
        totalMessages,
        avgWarming,
        errorRate: errorRate.toFixed(1),
        connectedNumbers: agents?.length || 0
      };
    }
  });

  const cards = [
    { title: "Números Conectados", value: stats?.connectedNumbers || 0, icon: Zap, color: "text-blue-500" },
    { title: "Nível Médio Aquecimento", value: `Nível ${stats?.avgWarming || 1}`, icon: Target, color: "text-orange-500" },
    { title: "Taxa de Resposta", value: stats?.totalLeads > 0 ? `${((stats.respondidos / stats.totalLeads) * 100).toFixed(1)}%` : "0%", icon: MessageSquare, color: "text-green-500" },
    { title: "Taxa de Erro", value: `${stats?.errorRate || 0}%`, icon: Users, color: Number(stats?.errorRate || 0) > 5 ? "text-red-500" : "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Agente Vendedor WhatsApp</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">O agente está operando normalmente.</p>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Status do Agente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium">Online (24h)</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground italic">
              "Focado em comportamento humano e conversão."
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
