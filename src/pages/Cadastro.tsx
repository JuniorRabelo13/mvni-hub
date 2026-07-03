import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/posthog";
import { SEO } from "@/components/SEO";


const Cadastro = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref");

  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    email: "",
    telefone: "",
    senha: "",
    confirmarSenha: "",
    aceitoTermos: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatTelefone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "cpf") formattedValue = formatCPF(value);
    if (name === "telefone") formattedValue = formatTelefone(value);

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    
    if (name === "confirmarSenha" || name === "senha") {
      setPasswordError(null);
    }
    setError(null);
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, aceitoTermos: checked }));
  };

  const handleSubmit = async () => {
    setError(null);
    setPasswordError(null);

    if (formData.senha !== formData.confirmarSenha) {
      setPasswordError("As senhas não coincidem");
      return;
    }

    setLoading(true);

    try {
      const { data, error: funcError } = await supabase.functions.invoke("cadastrar-representante", {
        body: {
          nome: formData.nome,
          cpf: formData.cpf.replace(/\D/g, ""),
          email: formData.email,
          telefone: formData.telefone.replace(/\D/g, ""),
          senha: formData.senha,
          codigo_indicador: referralCode || null,
        },
      });

      if (funcError) throw funcError;

      if (data.sucesso) {
        trackEvent('cadastro_cliente', {
          email: formData.email,
          indicado: !!referralCode
        });
        navigate("/cadastro/sucesso");
      } else {
        setError(data.mensagem);
      }
    } catch (err: any) {
      console.error("Erro ao cadastrar:", err);
      setError(err.message || "Erro ao processar cadastro");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = 
    formData.nome && 
    formData.cpf.length === 14 && 
    formData.email && 
    formData.telefone.length === 15 && 
    formData.senha.length >= 8 && 
    formData.confirmarSenha &&
    formData.aceitoTermos &&
    !loading;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
      <SEO
        title="Cadastro de Representante MVNI Hub"
        description="Crie sua conta MVNI Hub em minutos e comece a indicar clientes, gerenciar comissões e ativar chips."
        path="/cadastro"
      />
      <div className="max-w-md w-full space-y-8">

        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <span className="text-primary-foreground font-bold text-xl">M</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">MVNI</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Seja um Representante MVNI</h1>
            <p className="text-muted-foreground">Preencha os dados abaixo para criar sua conta</p>
            {referralCode && (
              <p className="text-emerald-400 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                Você foi indicado por um representante MVNI ✓
              </p>
            )}
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-sm p-8 rounded-xl border border-white/10 shadow-xl space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                name="nome"
                placeholder="Ex: João Silva"
                className="bg-background/50 border-white/10"
                value={formData.nome}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                name="cpf"
                placeholder="000.000.000-00"
                className="bg-background/50 border-white/10"
                value={formData.cpf}
                onChange={handleChange}
                maxLength={14}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                className="bg-background/50 border-white/10"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                name="telefone"
                placeholder="(00) 00000-0000"
                className="bg-background/50 border-white/10"
                value={formData.telefone}
                onChange={handleChange}
                maxLength={15}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha (mínimo 8 caracteres)</Label>
              <Input
                id="senha"
                name="senha"
                type="password"
                placeholder="••••••••"
                className="bg-background/50 border-white/10"
                value={formData.senha}
                onChange={handleChange}
                minLength={8}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar senha</Label>
              <Input
                id="confirmarSenha"
                name="confirmarSenha"
                type="password"
                placeholder="••••••••"
                className="bg-background/50 border-white/10"
                value={formData.confirmarSenha}
                onChange={handleChange}
                required
              />
              {passwordError && (
                <p className="text-red-400 text-xs mt-1">{passwordError}</p>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-2 pt-2">
            <Checkbox 
              id="termos" 
              checked={formData.aceitoTermos}
              onCheckedChange={handleCheckboxChange}
              className="mt-1 border-white/20"
            />
            <Label htmlFor="termos" className="text-sm text-muted-foreground leading-tight cursor-pointer">
              Li e aceito os{" "}
              <a 
                href="/termos" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Termos do Representante MVNI
              </a>
            </Label>
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full h-12 text-base font-semibold"
              disabled={!isFormValid}
              onClick={handleSubmit}
            >
              {loading ? "Criando conta..." : "Criar minha conta"}
            </Button>
            {error && (
              <p className="text-red-400 text-sm text-center font-medium">{error}</p>
            )}
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <button 
            onClick={() => navigate("/auth")}
            className="text-primary hover:underline font-medium"
          >
            Fazer login
          </button>
        </div>
      </div>
    </main>
  );

};

export default Cadastro;
