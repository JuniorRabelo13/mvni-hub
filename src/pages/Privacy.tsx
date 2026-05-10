import { AppLayout } from "@/components/AppLayout";

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Política de Privacidade</h1>
      <p className="text-muted-foreground">Última atualização: 10 de maio de 2026</p>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">1. Coleta de Dados</h2>
        <p>Coletamos dados necessários para a prestação do serviço, como nome, e-mail, telefone e informações financeiras para processamento de comissões.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">2. Uso das Informações</h2>
        <p>Seus dados são utilizados exclusivamente para o funcionamento do sistema e comunicações essenciais sobre sua conta.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">3. Segurança</h2>
        <p>Implementamos medidas de segurança técnicas e administrativas para proteger seus dados pessoais.</p>
      </section>
    </div>
  );
}
