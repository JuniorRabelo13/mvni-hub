import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email) {
      setMessage({ text: "Digite seu e-mail", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/nova-senha`,
      });

      setLoading(false);
      
      if (error) {
        if (error.message.includes("network") || error.status === 0) {
          setMessage({ text: "Erro ao enviar. Tente novamente.", type: "error" });
        } else {
          // Por segurança, mostramos sucesso mesmo se houver erro (exceto rede), 
          // ou tratamos conforme solicitado (não revelar existência).
          setMessage({ 
            text: "Se este e-mail estiver cadastrado, você receberá o link em instantes. Verifique também sua caixa de spam.", 
            type: "success" 
          });
        }
        return;
      }

      setMessage({ 
        text: "Se este e-mail estiver cadastrado, você receberá o link em instantes. Verifique também sua caixa de spam.", 
        type: "success" 
      });
    } catch (err) {
      setLoading(false);
      setMessage({ text: "Erro ao enviar. Tente novamente.", type: "error" });
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-noir p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs text-primary">
            <Sparkles className="h-3 w-3" /> MVNI Hub PF
          </div>
          <h1 className="text-3xl font-bold text-gradient-gold">Sua operação. Sua renda.</h1>
        </div>

        <Card className="border-border/60 shadow-card">
          <CardHeader>
            <CardTitle>Recuperar senha</CardTitle>
            <CardDescription>
              Digite seu e-mail cadastrado. Enviaremos um link para você criar uma nova senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar link de recuperação"
                )}
              </Button>

              {message && (
                <p className={`text-sm font-medium ${message.type === "error" ? "text-destructive" : "text-emerald-500"} animate-in fade-in slide-in-from-top-1`}>
                  {message.text}
                </p>
              )}

              <div className="text-center pt-2">
                <Link
                  to="/auth"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Voltar ao login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">← voltar</Link>
        </p>
      </div>
    </main>
  );
}
