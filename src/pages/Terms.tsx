import { AppLayout } from "@/components/AppLayout";

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Termos de Uso</h1>
      <p className="text-muted-foreground">Última atualização: 10 de maio de 2026</p>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">1. Aceitação dos Termos</h2>
        <p>Ao acessar e usar este SaaS, você concorda em cumprir e estar vinculado a estes Termos de Uso.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">2. Uso do Serviço</h2>
        <p>O usuário compromete-se a utilizar a plataforma de forma lícita, respeitando as leis vigentes e os direitos de terceiros.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">3. Responsabilidades</h2>
        <p>Não nos responsabilizamos por danos indiretos ou lucros cessantes decorrentes do uso inadequado da ferramenta.</p>
      </section>
    </div>
  );
}
