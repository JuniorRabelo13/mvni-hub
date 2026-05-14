import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function RecuperarSenha() {
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
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <Button type="button" className="w-full">
                Enviar link de recuperação
              </Button>
              <div className="text-center">
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
