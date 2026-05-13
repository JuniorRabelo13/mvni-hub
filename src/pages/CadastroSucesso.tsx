import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const CadastroSucesso = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        {/* Header */}
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <span className="text-primary-foreground font-bold text-xl">M</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">MVNI</span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-card/50 backdrop-blur-sm p-10 rounded-xl border border-white/10 shadow-xl space-y-6 flex flex-col items-center">
          <div className="bg-emerald-500/10 p-4 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">Conta criada com sucesso!</h1>
            <p className="text-muted-foreground">
              Seu cadastro foi realizado. Acesse o sistema com seu e-mail e senha para começar.
            </p>
          </div>

          <Button 
            className="w-full h-12 text-base font-semibold mt-4"
            onClick={() => navigate("/auth")}
          >
            Acessar minha conta
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CadastroSucesso;
