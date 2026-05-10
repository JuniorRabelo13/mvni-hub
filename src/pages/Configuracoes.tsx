import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, ShieldAlert } from "lucide-react";
import { logAdminAction } from "@/lib/adminLog";
import { sanitizeConfiguracoes } from "@/lib/sanitize";

type Config = {
  chave: string;
  valor: string;
  descricao: string;
};

export default function Configuracoes() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<Config[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAdminAndLoad();
  }, [user]);

  const checkAdminAndLoad = async () => {
    if (!user) return;
    
    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    const isUserAdmin = !!roleData;
    setIsAdmin(isUserAdmin);

    // Load configs via safe RPC function
    const { data: configData, error } = await supabase.rpc('get_configuracoes_safe');

    if (error) {
      console.error("Error loading configs:", error);
      toast.error("Erro ao carregar configurações");
    } else if (configData) {
      // Defesa em profundidade: oculta chaves sensíveis se o usuário não for admin
      setConfigs(isUserAdmin ? (configData as any) : sanitizeConfiguracoes(configData as any, user.id));
    }
    setLoading(false);
  };

  const handleUpdate = (chave: string, novoValor: string) => {
    setConfigs(prev => prev.map(c => c.chave === chave ? { ...c, valor: novoValor } : c));
  };

  const saveConfigs = async () => {
    if (!isAdmin) {
      toast.error("Apenas administradores podem alterar configurações");
      return;
    }

    // Validação básica de valores numéricos para chaves de comissão/valor
    const invalidConfigs = configs.filter(c => 
      c.chave !== 'asaas_api_key' && (isNaN(Number(c.valor)) || Number(c.valor) < 0)
    );

    if (invalidConfigs.length > 0) {
      toast.error(`Valores inválidos detectados em: ${invalidConfigs.map(c => c.descricao).join(", ")}`);
      return;
    }

    setSaving(true);
    try {
      // Usar Promise.all para maior performance (embora no Supabase isso não seja uma transação atômica)
      // Idealmente usaríamos uma RPC para atualização em lote atômica
      const updates = configs.map(config => 
        supabase
          .from("configuracoes")
          .update({ valor: config.valor })
          .eq("chave", config.chave)
      );
      
      const results = await Promise.all(updates);
      const firstError = results.find(r => r.error);
      if (firstError) throw firstError.error;

      await logAdminAction("alterar_config", null, {
        chaves: configs.map(c => c.chave),
      });
      toast.success("Configurações salvas com sucesso!");
      await checkAdminAndLoad(); // Recarregar para garantir sincronia
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h1 className="text-2xl font-bold">Acesso Restrito</h1>
        <p className="max-w-md text-muted-foreground">
          Você não tem permissão para acessar esta página. Apenas administradores podem visualizar e editar as configurações do sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Sistema</p>
          <h1 className="mt-1 text-3xl font-bold">Configurações</h1>
        </div>
        <Button onClick={saveConfigs} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Alterações
        </Button>
      </header>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Valores e Comissões</CardTitle>
            <CardDescription>Defina os valores padrão para o plano e cálculos de rendimentos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {configs.filter(c => c.chave !== 'asaas_api_key').map((config) => (
              <div key={config.chave} className="grid grid-cols-1 gap-1.5 md:grid-cols-2 md:items-center">
                <div>
                  <Label htmlFor={config.chave} className="text-sm font-semibold">
                    {config.descricao}
                  </Label>
                  <p className="text-xs text-muted-foreground">{config.chave}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-mono">R$</span>
                  <Input 
                    id={config.chave}
                    value={config.valor}
                    onChange={(e) => handleUpdate(config.chave, e.target.value)}
                    className="max-w-[200px]"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrações</CardTitle>
            <CardDescription>Configurações de APIs e serviços externos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {configs.filter(c => ['asaas_api_key', 'whatsapp_api_url', 'whatsapp_api_token'].includes(c.chave)).map((config) => (
              <div key={config.chave} className="space-y-1.5">
                <Label htmlFor={config.chave}>{config.descricao}</Label>
                <Input 
                  id={config.chave}
                  type={config.chave.includes('key') || config.chave.includes('token') ? "password" : "text"}
                  value={config.valor}
                  onChange={(e) => handleUpdate(config.chave, e.target.value)}
                  placeholder="Insira a chave da API..."
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
