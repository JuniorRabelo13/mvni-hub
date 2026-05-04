import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Settings, Shield, Globe, Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function SMSConfiguracoes() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Configurações salvas", description: "Suas credenciais foram atualizadas com sucesso." });
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações SMS</h1>
        <p className="text-muted-foreground">Gerencie seus créditos e integração com LabsMobile.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Wallet className="h-5 w-5" /> Saldo de Créditos
            </CardTitle>
            <CardDescription>Consulte seu saldo atual e adicione mais envios.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Atual</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <Button size="lg" className="bg-gradient-gold">Comprar Créditos</Button>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 text-blue-500" />
              <p>Cada SMS (até 160 caracteres) consome 1 crédito. Mensagens internacionais podem variar.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> Credenciais LabsMobile
            </CardTitle>
            <CardDescription>Essencial para realizar os disparos reais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário (E-mail)</Label>
              <Input id="username" placeholder="seu@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">Token API</Label>
              <Input id="token" type="password" placeholder="••••••••••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sender">Remetente (Opcional)</Label>
              <Input id="sender" placeholder="MVNI_HUB" maxLength={11} />
            </div>
            <Button className="w-full" onClick={handleSave} disabled={loading}>
              {loading ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" /> Webhooks & Integração
            </CardTitle>
            <CardDescription>URLs de retorno para status de entrega e mensagens recebidas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>URL de Entrega (DLR)</Label>
                <div className="flex gap-2">
                  <Input readOnly value="https://api.mvnPF.com/sms/webhook/dlr" className="bg-muted" />
                  <Button variant="outline">Copiar</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>URL de Mensagens Recebidas (MO)</Label>
                <div className="flex gap-2">
                  <Input readOnly value="https://api.mvnPF.com/sms/webhook/mo" className="bg-muted" />
                  <Button variant="outline">Copiar</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
