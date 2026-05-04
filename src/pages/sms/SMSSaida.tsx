import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LogOut, Plus, Trash2, Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function SMSSaida() {
  const { toast } = useToast();
  const [keywords, setKeywords] = useState(["SAIR", "STOP", "CANCELAR", "PARA"]);

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter(k => k !== kw));
    toast({ title: "Palavra removida", description: `"${kw}" não será mais monitorada.` });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Regras de Saída (Opt-out)</h1>
        <p className="text-muted-foreground">Configure palavras-chave que inserem automaticamente o número na blacklist.</p>
      </div>

      <div className="grid gap-6 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5" /> Monitoramento Automático
            </CardTitle>
            <CardDescription>
              Respostas recebidas contendo estas palavras serão processadas pelo sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base">Ativar Auto-Blacklist</Label>
                <p className="text-xs text-muted-foreground">Bloqueia envios para quem responder com as palavras abaixo.</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="space-y-4">
              <Label>Palavras-chave Monitoradas</Label>
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw) => (
                  <div key={kw} className="flex items-center gap-1 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-medium group">
                    {kw}
                    <button onClick={() => removeKeyword(kw)} className="hover:text-red-500 ml-1">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="rounded-full border-dashed h-8">
                  <Plus className="h-3 w-3 mr-1" /> Adicionar
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-yellow-500 shrink-0" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-yellow-500">Importante:</p>
                  <p className="text-muted-foreground">O monitoramento automático exige que as credenciais MO (Mensagens Recebidas) estejam configuradas no LabsMobile apontando para o nosso Webhook.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
