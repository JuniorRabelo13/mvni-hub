import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";


export default function NovaSenha() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const newFieldErrors: { [key: string]: string } = {};
    if (!password) newFieldErrors.password = "Campo obrigatório";
    if (!confirmPassword) newFieldErrors.confirmPassword = "Campo obrigatório";

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: "As senhas não coincidem" });
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setLoading(false);
        const msg = updateError.message.toLowerCase();
        if (msg.includes("token") || msg.includes("expired")) {
          setError("link_expired");
        } else {
          setError("Erro ao salvar. Tente novamente.");
        }
        return;
      }

      toast.success("Senha atualizada com sucesso. Faça login com sua nova senha.");
      navigate("/auth");
    } catch (err) {
      setLoading(false);
      setError("Erro ao salvar. Tente novamente.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-noir p-4">
      <SEO
        title="Criar nova senha — MVNI Hub"
        description="Defina uma nova senha segura para sua conta MVNI Hub e retome o acesso ao painel de gestão."
        path="/nova-senha"
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
            <CardTitle>Criar nova senha</CardTitle>
            <CardDescription>
              Digite e confirme sua nova senha abaixo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="********"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {fieldErrors.password && (
                  <p className="text-xs text-destructive">{fieldErrors.password}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="********"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {error === "link_expired" ? (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-center space-y-2">
                  <p className="text-sm font-medium text-destructive">Link expirado ou inválido.</p>
                  <Link to="/recuperar-senha" className="text-sm text-primary hover:underline block font-semibold">
                    Solicitar novo link de recuperação
                  </Link>
                </div>
              ) : (
                error && (
                  <p className="text-sm font-medium text-destructive animate-in fade-in slide-in-from-top-1 text-center">
                    {error}
                  </p>
                )
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar nova senha"
                )}
              </Button>
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
