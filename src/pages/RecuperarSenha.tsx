import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";


export default function RecuperarSenha() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Digite seu e-mail");
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/nova-senha",
      });

      setLoading(false);

      if (resetError) {
        if (resetError.message.includes("network") || resetError.status === 0) {
          setError("Erro ao enviar. Tente novamente.");
          return;
        }
        // Even for other errors, we show the success message to not reveal user existence
      }

      setSubmitted(true);
    } catch (err) {
      setLoading(false);
      setError("Erro ao enviar. Tente novamente.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-noir p-4">
      <SEO
        title="Recuperar senha — MVNI Hub"
        description="Recupere o acesso à sua conta MVNI Hub. Enviaremos um link seguro para redefinir sua senha por e-mail."
        path="/recuperar-senha"
      />
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
              {submitted 
                ? "Confira seu e-mail" 
                : "Digite seu e-mail cadastrado. Enviaremos um link para você criar uma nova senha."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Se este e-mail estiver cadastrado, você receberá o link em instantes. Verifique também sua caixa de spam.
                </p>
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => navigate("/auth")}
                    className="text-sm text-primary hover:underline transition-colors"
                  >
                    Voltar ao login
                  </button>
                </div>
              </div>
            ) : (
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
                  {error && (
                    <p className="text-xs font-medium text-destructive animate-in fade-in slide-in-from-top-1">
                      {error}
                    </p>
                  )}
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

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => navigate("/auth")}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Voltar ao login
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">← voltar</Link>
        </p>
      </div>
    </main>
  );
}
