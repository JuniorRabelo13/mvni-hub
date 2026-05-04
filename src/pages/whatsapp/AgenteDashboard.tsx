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
      
      const totalLeads = leads?.length || 0;
      const respondidos = leads?.filter(l => l.status === 'respondeu').length || 0;
      const clientes = leads?.filter(l => l.status === 'cliente').length || 0;
      const totalMessages = messages?.length || 0;
      
      return {
        totalLeads,
        taxaConversao: totalLeads > 0 ? ((clientes / totalLeads) * 100).toFixed(1) : 0,
        respondidos,
        totalMessages
      };
    }
  });

  const cards = [
    { title: "Leads Abordados", value: stats?.totalLeads || 0, icon: Users, color: "text-blue-500" },
    { title: "Respostas Recebidas", value: stats?.respondidos || 0, icon: MessageSquare, color: "text-green-500" },
    { title: "Taxa de Conversão", value: `${stats?.taxaConversao || 0}%`, icon: Target, color: "text-purple-500" },
    { title: "Mensagens Enviadas", value: stats?.totalMessages || 0, icon: Zap, color: "text-yellow-500" },
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
