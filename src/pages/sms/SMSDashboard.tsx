import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Send, CheckCircle, AlertCircle, TrendingUp, Users } from "lucide-react";

export default function SMSDashboard() {
  const stats = [
    { title: "Total Enviados", value: "0", icon: Send, color: "text-blue-500" },
    { title: "Taxa de Entrega", value: "0%", icon: CheckCircle, color: "text-green-500" },
    { title: "Aguardando", value: "0", icon: MessageSquare, color: "text-yellow-500" },
    { title: "Falhas", value: "0", icon: AlertCircle, color: "text-red-500" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard SMS</h1>
        <p className="text-muted-foreground">Visão geral do consumo e performance de disparos.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Consumo por Período</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
            <div className="text-muted-foreground">Gráfico de consumo (em breve)</div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Últimas Campanhas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma campanha recente encontrada.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
