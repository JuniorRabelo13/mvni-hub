import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, Key, Copy, Terminal, ExternalLink, ShieldCheck } from "lucide-react";

export default function SMSApi() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API de Integração</h1>
        <p className="text-muted-foreground">Utilize nossa API para automatizar envios a partir de seus sistemas externos.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" /> API Key do Projeto
            </CardTitle>
            <CardDescription>Use esta chave para autenticar suas requisições.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted rounded-lg font-mono text-xs break-all relative group">
              sk_sms_live_8f3d2e1a9b5c4d6e7f8g9h0i1j2k3l4m
              <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-[10px] text-red-500 font-medium uppercase">Nunca compartilhe sua Secret Key!</p>
            <Button variant="outline" className="w-full gap-2">Regerar Chave</Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" /> Exemplo de Uso (cURL)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-slate-950 text-slate-50 rounded-lg font-mono text-xs overflow-x-auto">
              <pre>
{`curl -X POST https://api.mvnPF.com/v1/sms/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "5511999999999",
    "message": "Olá! Teste de API do MVNI Hub."
  }'`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" /> Documentação Técnica
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
              <p className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                Envio Único <ExternalLink className="h-3 w-3" />
              </p>
              <p className="text-xs text-muted-foreground mt-1">Endpoint para disparos individuais imediatos.</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
              <p className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                Envio em Lote <ExternalLink className="h-3 w-3" />
              </p>
              <p className="text-xs text-muted-foreground mt-1">Envie para até 500 números em uma única chamada.</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
              <p className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                Consulta de Saldo <ExternalLink className="h-3 w-3" />
              </p>
              <p className="text-xs text-muted-foreground mt-1">Verifique seus créditos via API.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
