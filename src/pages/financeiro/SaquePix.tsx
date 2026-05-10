import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Wallet, ArrowUpRight, CheckCircle2, Clock, AlertTriangle, Landmark, Receipt, Loader2, FileDown, Download } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function SaquePix() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [valorSaque, setValorSaque] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  // 1. Buscar Dados Bancários
  const { data: dadosBancarios, isLoading: loadingBank } = useQuery({
    queryKey: ["dados-bancarios", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dados_bancarios")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // 2. Buscar Wallet
  const { data: wallet, isLoading: loadingWallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // 3. Buscar Histórico de Saques
  const { data: saques = [], isLoading: loadingSaques } = useQuery({
    queryKey: ["historico-saques", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_saque")
        .select("*")
        .eq("user_id", user?.id)
        .order("solicitado_em", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // 4. Mutation para Salvar Chave Pix
  const savePixMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase
        .from("dados_bancarios")
        .upsert({
          user_id: user?.id,
          ...values,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dados-bancarios"] });
      toast.success("Chave Pix salva com sucesso!");
    },
    onError: (err: any) => toast.error("Erro ao salvar: " + err.message),
  });

  // 5. Mutation para Solicitar Saque
  const requestWithdrawalMutation = useMutation({
    mutationFn: async (valor: number) => {
      if (!dadosBancarios) throw new Error("Cadastre sua chave Pix antes de solicitar saque.");
      const { error } = await supabase
        .from("solicitacoes_saque")
        .insert({
          user_id: user?.id,
          wallet_id: wallet?.id,
          dados_bancarios_id: dadosBancarios.id,
          valor,
          status: 'pendente',
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["historico-saques", "wallet"] });
      toast.success("Solicitação de saque enviada!");
      setValorSaque("");
      setShowConfirm(false);
    },
    onError: (err: any) => toast.error("Erro no saque: " + err.message),
  });

  // 6. Mutation para Gerar Informe de Rendimentos
  const generateReportMutation = useMutation({
    mutationFn: async (ano: number) => {
      const { data, error } = await supabase.functions.invoke('gerar-informe-rendimentos', {
        body: { user_id: user?.id, ano }
      });
      if (error) throw error;
      return data.url;
    },
    onSuccess: (url) => {
      window.open(url, '_blank');
      toast.success("Informe de rendimentos gerado com sucesso!");
    },
    onError: (err: any) => toast.error("Erro ao gerar informe: " + err.message)
  });

  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(valorSaque);
    if (val < 50) return toast.error("O valor mínimo para saque é R$ 50,00");
    if (val > (wallet?.saldo_disponivel || 0)) return toast.error("Saldo insuficiente.");
    setShowConfirm(true);
  };

  const getStatusBadge = (status: string) => {
    const configs: any = {
      pendente: { color: "bg-amber-500/10 text-amber-600", icon: Clock, label: "Pendente" },
      aprovado: { color: "bg-blue-500/10 text-blue-600", icon: CheckCircle2, label: "Aprovado" },
      pago: { color: "bg-emerald-500/10 text-emerald-600", icon: CheckCircle2, label: "Pago" },
      rejeitado: { color: "bg-red-500/10 text-red-600", icon: AlertTriangle, label: "Rejeitado" },
      processando: { color: "bg-primary/10 text-primary", icon: Loader2, label: "Processando" },
    };
    const config = configs[status] || configs.pendente;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.color} border-none flex items-center gap-1`}>
        <Icon className={`h-3 w-3 ${status === 'processando' ? 'animate-spin' : ''}`} /> {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Saque via Pix</h1>
          <p className="text-muted-foreground text-sm">Gerencie seu saldo e realize transferências</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Saldo Disponível</p>
          <p className="text-3xl font-bold text-emerald-500">{fmt(wallet?.saldo_disponivel || 0)}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><Landmark className="h-5 w-5 text-primary" /> Dados para Recebimento</CardTitle>
            </CardHeader>
            <CardContent>
              <form 
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  savePixMutation.mutate({
                    tipo_chave: fd.get("tipo_chave"),
                    chave_pix: fd.get("chave_pix"),
                    titular_nome: fd.get("titular_nome"),
                    titular_cpf: fd.get("titular_cpf"),
                  });
                }}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="tipo_chave">Tipo de Chave</Label>
                    <Select name="tipo_chave" defaultValue={dadosBancarios?.tipo_chave || "cpf"}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="telefone">Telefone</SelectItem>
                        <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="chave_pix">Chave Pix</Label>
                    <Input name="chave_pix" defaultValue={dadosBancarios?.chave_pix} placeholder="Sua chave aqui" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="titular_nome">Nome Completo do Titular</Label>
                  <Input name="titular_nome" defaultValue={dadosBancarios?.titular_nome} placeholder="Como no banco" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="titular_cpf">CPF do Titular</Label>
                  <Input name="titular_cpf" defaultValue={dadosBancarios?.titular_cpf} placeholder="000.000.000-00" required />
                </div>
                <Button type="submit" variant="outline" className="w-full" disabled={savePixMutation.isPending}>
                  {savePixMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Salvar Dados Bancários
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className={!dadosBancarios ? "opacity-50 pointer-events-none" : ""}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><ArrowUpRight className="h-5 w-5 text-emerald-500" /> Solicitar Saque</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="valor">Valor do Saque (Mínimo R$ 50,00)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span>
                    <Input id="valor" type="number" step="0.01" className="pl-9 text-2xl font-bold" value={valorSaque} onChange={(e) => setValorSaque(e.target.value)} placeholder="0,00" required />
                  </div>
                </div>
                {!showConfirm ? (
                  <Button type="submit" className="w-full h-12 text-lg" disabled={Number(valorSaque) < 50}>Solicitar Saque via Pix</Button>
                ) : (
                  <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-primary/20">
                    <p className="text-sm text-center">Confirmar saque de <span className="font-bold">{fmt(Number(valorSaque))}</span> para o Pix <span className="font-bold">{dadosBancarios?.chave_pix}</span>?</p>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>Cancelar</Button>
                      <Button type="button" className="flex-1" onClick={() => requestWithdrawalMutation.mutate(Number(valorSaque))} disabled={requestWithdrawalMutation.isPending}>Confirmar</Button>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><FileDown className="h-5 w-5 text-blue-500" /> Documentos Fiscais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                <div>
                  <p className="text-sm font-bold">Informe de Rendimentos {new Date().getFullYear() - 1}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Para declaração de IRPF</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => generateReportMutation.mutate(new Date().getFullYear() - 1)} disabled={generateReportMutation.isPending}>
                  {generateReportMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Download className="h-3 w-3 mr-2" />} Gerar PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2"><Receipt className="h-5 w-5 text-muted-foreground" /> Últimos Saques</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {saques.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">Nenhum saque solicitado ainda.</div>
              ) : (
                <div className="divide-y divide-border">
                  {saques.map((saque: any) => (
                    <div key={saque.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2"><span className="font-bold text-lg">{fmt(Number(saque.valor))}</span>{getStatusBadge(saque.status)}</div>
                        <p className="text-[10px] text-muted-foreground uppercase">Solicitado em: {new Date(saque.solicitado_em).toLocaleDateString("pt-BR")}</p>
                      </div>
                      {saque.comprovante_url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={saque.comprovante_url} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1">Comprovante <ArrowUpRight className="h-3 w-3" /></a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
