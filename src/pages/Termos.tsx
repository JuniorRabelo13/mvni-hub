import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SEO } from "@/components/SEO";

const Termos = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center p-6 md:p-12">
      <SEO
        title="Termos do Representante MVNI Hub"
        description="Leia os termos e condições da parceria MVNI Hub: comissionamento, regras de conduta e encerramento."
        path="/termos"
      />
      <div className="max-w-3xl w-full space-y-8">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <span className="text-primary-foreground font-bold text-xl">M</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">MVNI</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Termos do Representante MVNI</h1>
        </div>

        <div className="space-y-8 bg-card p-6 md:p-10 rounded-xl border border-border shadow-sm">
          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2">Seção 1 — O que é ser um Representante MVNI</h2>
            <p className="text-muted-foreground leading-relaxed">
              O representante MVNI é um parceiro independente autorizado a indicar clientes e expandir a rede MVNI. Não há vínculo empregatício.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2">Seção 2 — Comissionamento</h2>
            <p className="text-muted-foreground leading-relaxed">
              O representante recebe: R$5,00 por ativação direta, R$20,00/mês por cliente ativo direto, R$5,00/mês por associado indireto ativo (até 40 diretos) ou R$10,00/mês (acima de 40 diretos).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2">Seção 3 — Regras de conduta</h2>
            <p className="text-muted-foreground leading-relaxed">
              É proibido realizar promessas de ganhos garantidos. O representante é responsável pelas informações que fornece aos seus indicados.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2">Seção 4 — Encerramento</h2>
            <p className="text-muted-foreground leading-relaxed">
              A parceria pode ser encerrada por qualquer parte. Comissões de clientes ativos são pagas até o mês do encerramento.
            </p>
          </section>
        </div>

        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Termos;
