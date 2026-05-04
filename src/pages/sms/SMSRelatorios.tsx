import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, TrendingUp, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SMSRelatorios() {
  const metrics = [
    { label: "Taxa de Entrega", value: 94, color: "bg-green-500" },
    { label: "Taxa de Resposta", value: 8, color: "bg-blue-500" },
    { label: "Taxa de Falha", value: 3, color: "bg-red-500" },
    { label: "Opt-out (Blacklist)", value: 1.5, color: "bg-yellow-500" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios Performance</h1>
          <p className="text-muted-foreground">Análise detalhada de suas campanhas e entregabilidade.</p>
        </div>
        <div className="flex gap-3">
          <Select defaultValue="30d">
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Exportar PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardHeader className="pb-2">
              <CardDescription>{m.label}</CardDescription>
              <CardTitle className="text-2xl font-bold">{m.value}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={m.value} className="h-2" indicatorClassName={m.color} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" /> Volume de Envios Diários
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
            <div className="text-muted-foreground">Gráfico de barras (em breve)</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Insights de IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
              <p className="text-xs font-semibold text-primary">Melhor Horário</p>
              <p className="text-sm">Terças-feiras às 14:00 apresentam 25% mais cliques.</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
              <p className="text-xs font-semibold text-primary">Palavras-chave</p>
              <p className="text-sm">O uso de "Exclusivo" aumentou a taxa de entrega em 12%.</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
              <p className="text-xs font-semibold text-primary">Tamanho Ideal</p>
              <p className="text-sm">Suas mensagens de 120 caracteres performam melhor que as de 155.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
