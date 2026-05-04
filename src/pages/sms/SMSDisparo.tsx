import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Send, Trash2, UserPlus, Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function SMSDisparo() {
  const [message, setMessage] = useState("");
  const [numbers, setNumbers] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [smsCount, setSmsCount] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    setCharCount(message.length);
    setSmsCount(Math.ceil(message.length / 160) || 1);
  }, [message]);

  const handleSend = () => {
    if (!message || !numbers) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a mensagem e os números de destino.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Envio solicitado",
      description: "Suas mensagens foram adicionadas à fila de envio.",
    });
  };

  const generateAI = () => {
    toast({
      title: "IA em ação",
      description: "Gerando sugestão de mensagem otimizada...",
    });
    // Placeholder para integração com IA
    setTimeout(() => {
      setMessage("Olá! Temos uma oferta especial para você hoje. Confira em nosso site e aproveite descontos exclusivos!");
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Novo Disparo</h1>
        <p className="text-muted-foreground">Envie mensagens SMS individuais ou para pequenos grupos.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" /> Compor Mensagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="message">Texto do SMS</Label>
                <Button variant="ghost" size="sm" onClick={generateAI} className="h-8 gap-1 text-xs text-primary hover:text-primary/80">
                  <Sparkles className="h-3 w-3" /> Gerar com IA
                </Button>
              </div>
              <Textarea
                id="message"
                placeholder="Digite sua mensagem aqui..."
                className="min-h-[150px] resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                <span>{charCount} caracteres</span>
                <span>{smsCount} SMS (aprox.)</span>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 text-blue-500" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold">Dica de IA:</p>
                  <p>Mensagens curtas e diretas têm 40% mais taxa de conversão.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> Destinatários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="numbers">Números (um por linha)</Label>
              <Textarea
                id="numbers"
                placeholder="Ex: 5511999999999"
                className="min-h-[150px] font-mono text-sm"
                value={numbers}
                onChange={(e) => setNumbers(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">Insira o código do país + DDD + número.</p>
            </div>

            <div className="pt-4 flex gap-3">
              <Button className="flex-1 gap-2" onClick={handleSend}>
                <Send className="h-4 w-4" /> Enviar Agora
              </Button>
              <Button variant="outline" onClick={() => { setMessage(""); setNumbers(""); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
