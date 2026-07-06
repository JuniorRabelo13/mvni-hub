import { LifeBuoy, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";

const categorias = [
  { k: "financeiro", label: "Financeiro", desc: "Faturas, pagamentos, reembolsos" },
  { k: "tecnico", label: "Técnico", desc: "Sinal, dados, SMS, configuração" },
  { k: "portabilidade", label: "Portabilidade", desc: "Trazer seu número" },
  { k: "cancelamento", label: "Cancelamento", desc: "Encerrar linha" },
  { k: "duvidas", label: "Dúvidas", desc: "Ajuda geral e informações" },
];

export default function Suporte() {
  return (
    <div className="space-y-6">
      <SEO title="Suporte — MVNI" description="Abra um chamado com nosso time." path="/cliente/suporte" />
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Suporte</h1>
        <p className="text-sm text-muted-foreground">Escolha o tipo de atendimento.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categorias.map((c) => (
          <Card key={c.k} className="bg-card/60 border-border/60 hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <LifeBuoy className="h-4 w-4 text-primary" /> {c.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{c.desc}</p>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => toast.info("Central de atendimento em preparação.")}
              >
                <MessageCircle className="h-4 w-4" /> Abrir chamado
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
