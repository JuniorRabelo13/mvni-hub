import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function NovaSenha() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || !confirmPassword) {
      setError("Preencha todos os campos");
      return;
    }

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      setLoading(false);

      if (updateError) {
        if (updateError.message.includes("expired") || updateError.message.includes("invalid")) {
          setError("link_expired");
        } else {
          setError(updateError.message);
        }
        return;
      }

      toast.success("Senha atualizada com sucesso. Faça login com sua nova senha.");
      navigate("/auth", { replace: true });
    } catch (err) {
      setLoading(false);
      setError("Erro ao atualizar senha. Tente novamente.");
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
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
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
              </div>
              
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

              {error === "link_expired" ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">
                    Link expirado ou inválido. Solicite um novo link de recuperação.
                  </p>
                  <Link
                    to="/recuperar-senha"
                    className="block text-sm text-center text-primary hover:underline"
                  >
                    Solicitar novo link
                  </Link>
                </div>
              ) : (
                error && (
                  <p className="text-sm font-medium text-destructive animate-in fade-in slide-in-from-top-1">
                    {error}
                  </p>
                )
              )}
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
