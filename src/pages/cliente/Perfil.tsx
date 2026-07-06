import { useEffect, useState } from "react";
import { UserCircle, ShieldCheck, KeyRound, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";

export default function Perfil() {
  const { user } = useAuth();
  const [cliente, setCliente] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("clientes")
        .select("id, nome, cpf, email, telefone")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      setCliente(data);
      setLoading(false);
    })();
  }, [user]);

  const enviarResetSenha = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/nova-senha`,
    });
    if (error) toast.error("Erro ao enviar email"); else toast.success("Link enviado para seu email.");
  };

  return (
    <div className="space-y-6">
      <SEO title="Perfil — MVNI" description="Meus dados e preferências." path="/cliente/perfil" />
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
        <p className="text-sm text-muted-foreground">Dados pessoais, segurança e LGPD.</p>
      </header>

      <Card className="bg-card/60 border-border/60">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserCircle className="h-4 w-4" /> Dados pessoais</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Nome" value={loading ? "..." : (cliente?.nome ?? "—")} />
          <Field label="CPF" value={loading ? "..." : (cliente?.cpf ?? "—")} />
          <Field label="Email" value={user?.email ?? "—"} />
          <Field label="Telefone" value={loading ? "..." : (cliente?.telefone ?? "—")} />
        </CardContent>
      </Card>

      <Card className="bg-card/60 border-border/60">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><KeyRound className="h-4 w-4" /> Segurança</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Redefina sua senha por email.</p>
          <Button variant="outline" size="sm" onClick={enviarResetSenha}>Enviar link de redefinição</Button>
        </CardContent>
      </Card>

      <Card className="bg-card/60 border-border/60">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4" /> LGPD</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Tratamos seus dados conforme a Lei Geral de Proteção de Dados.</p>
          <p>Para solicitar exportação ou correção, entre em contato com o suporte.</p>
        </CardContent>
      </Card>

      <Card className="border-red-500/40 bg-red-500/5">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base text-red-400"><Trash2 className="h-4 w-4" /> Excluir conta</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">A exclusão é irreversível e cancela suas linhas.</p>
          <Button variant="destructive" size="sm" onClick={() => toast.info("Solicite ao suporte para excluir sua conta.")}>Solicitar exclusão</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value} readOnly className="mt-1 bg-background/40" />
    </div>
  );
}
