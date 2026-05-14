import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import React, { Suspense, lazy } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";

// ✅ AppLayout NÃO é lazy — é o shell de todas as rotas protegidas
import AppLayout from "@/components/AppLayout";

// Auth Pages
const Auth = lazy(() => import("./pages/Auth"));
const Cadastro = lazy(() => import("./pages/Cadastro"));
const CadastroSucesso = lazy(() => import("./pages/CadastroSucesso"));
const RecuperarSenha = lazy(() => import("./pages/RecuperarSenha"));
const NovaSenha = lazy(() => import("./pages/NovaSenha"));

// Main Pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Estrutura = lazy(() => import("./pages/Estrutura"));
const Ganhos = lazy(() => import("./pages/Ganhos"));
const Pagamentos = lazy(() => import("./pages/Pagamentos"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Equipe = lazy(() => import("./pages/Equipe"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Termos = lazy(() => import("./pages/Termos"));
const Privacy = lazy(() => import("./pages/Privacy"));

// Finance Pages
const SaquePix = lazy(() => import("./pages/financeiro/SaquePix"));
const ExtratoFinanceiro = lazy(() => import("./pages/financeiro/Extrato"));

// Admin Pages
const Admin = lazy(() => import("./pages/Admin"));
const AdminLogs = lazy(() => import("./pages/AdminLogs"));
const SecurityLogs = lazy(() => import("./pages/SecurityLogs"));
const Importacoes = lazy(() => import("./pages/Importacoes"));

// SMS Module Pages
const SMSDashboard = lazy(() => import("./pages/sms/SMSDashboard"));
const SMSDisparo = lazy(() => import("./pages/sms/SMSDisparo"));
const SMSCampanhas = lazy(() => import("./pages/sms/SMSCampanhas"));
const SMSListas = lazy(() => import("./pages/sms/SMSListas"));
const SMSNovaLista = lazy(() => import("./pages/sms/SMSNovaLista"));
const SMSBlacklist = lazy(() => import("./pages/sms/SMSBlacklist"));
const SMSSaida = lazy(() => import("./pages/sms/SMSSaida"));
const SMSLogs = lazy(() => import("./pages/sms/SMSLogs"));
const SMSRelatorios = lazy(() => import("./pages/sms/SMSRelatorios"));
const SMSInbox = lazy(() => import("./pages/sms/SMSInbox"));
const SMSApi = lazy(() => import("./pages/sms/SMSApi"));
const SMSWebhooks = lazy(() => import("./pages/sms/SMSWebhooks"));
const SMSConfiguracoes = lazy(() => import("./pages/sms/SMSConfiguracoes"));

// WhatsApp Agent Module Pages
const AgenteDashboard = lazy(() => import("./pages/whatsapp/AgenteDashboard"));
const AgenteLeads = lazy(() => import("./pages/whatsapp/AgenteLeads"));
const AgenteConfig = lazy(() => import("./pages/whatsapp/AgenteConfig"));
const AgenteMensagens = lazy(() => import("./pages/whatsapp/AgenteMensagens"));
const AgenteAgentes = lazy(() => import("./pages/whatsapp/AgenteAgentes"));

// Master Admin Pages
const MasterDashboard = lazy(() => import("./pages/master-admin/Dashboard"));
const MasterFinanceiro = lazy(() => import("./pages/master-admin/Financeiro"));
const MasterAfiliados = lazy(() => import("./pages/master-admin/Afiliados"));
const MasterLinhas = lazy(() => import("./pages/master-admin/Linhas"));
const MasterWhatsApp = lazy(() => import("./pages/master-admin/WhatsApp"));
const MasterWorkers = lazy(() => import("./pages/master-admin/Workers"));
const MasterAuditoria = lazy(() => import("./pages/master-admin/Auditoria"));
const MasterAlertas = lazy(() => import("./pages/master-admin/Alertas"));
const MasterGateways = lazy(() => import("./pages/master-admin/Gateways"));
const MasterPlanos = lazy(() => import("./pages/master-admin/Planos"));
const MasterInfraestrutura = lazy(() => import("./pages/master-admin/Infraestrutura"));
const MasterUsuarios = lazy(() => import("./pages/master-admin/Usuarios"));
const MasterComissoes = lazy(() => import("./pages/master-admin/Comissoes"));
const MasterAntifraude = lazy(() => import("./pages/master-admin/Antifraude"));
const MasterProjecoes = lazy(() => import("./pages/master-admin/Projecoes"));
const MasterCentral = lazy(() => import("./pages/master-admin/Central"));
const NotificacoesVencimentoAudit = lazy(() => import("./pages/master-admin/NotificacoesVencimento"));

const queryClient = new QueryClient();

// ✅ Um único Suspense global envolve tudo — sem cascata
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner theme="dark" />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* ✅ Rotas públicas — sem AuthGuard */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/recuperar-senha" element={<RecuperarSenha />} />
              <Route path="/nova-senha" element={<NovaSenha />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/cadastro/sucesso" element={<CadastroSucesso />} />
              <Route path="/termos" element={<Termos />} />
              <Route path="/privacidade" element={<Privacy />} />

              {/* ✅ Rotas protegidas — AuthGuard único no topo, AppLayout eager */}
              <Route element={
                <AuthGuard loadingFallback={<LoadingScreen />}>
                  <AppLayout />
                </AuthGuard>
              }>
                <Route path="/" element={<Dashboard />} />
                <Route path="/painel" element={<Dashboard />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/estrutura" element={<Estrutura />} />
                <Route path="/ganhos" element={<Ganhos />} />
                <Route path="/pagamentos" element={<Pagamentos />} />
                <Route path="/financeiro/saque" element={<SaquePix />} />
                <Route path="/financeiro/extrato" element={<ExtratoFinanceiro />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
                <Route path="/equipe" element={<Equipe />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/logs" element={<AdminLogs />} />
                <Route path="/admin/security" element={<SecurityLogs />} />
                <Route path="/admin/importacoes" element={<Importacoes />} />

                {/* SMS */}
                <Route path="/sms/dashboard" element={<SMSDashboard />} />
                <Route path="/sms/disparo" element={<SMSDisparo />} />
                <Route path="/sms/campanhas" element={<SMSCampanhas />} />
                <Route path="/sms/listas" element={<SMSListas />} />
                <Route path="/sms/listas/nova" element={<SMSNovaLista />} />
                <Route path="/sms/blacklist" element={<SMSBlacklist />} />
                <Route path="/sms/saida" element={<SMSSaida />} />
                <Route path="/sms/logs" element={<SMSLogs />} />
                <Route path="/sms/relatorios" element={<SMSRelatorios />} />
                <Route path="/sms/inbox" element={<SMSInbox />} />
                <Route path="/sms/api" element={<SMSApi />} />
                <Route path="/sms/webhooks" element={<SMSWebhooks />} />
                <Route path="/sms/configuracoes" element={<SMSConfiguracoes />} />

                {/* WhatsApp */}
                <Route path="/agente" element={<AgenteDashboard />} />
                <Route path="/agente/leads" element={<AgenteLeads />} />
                <Route path="/agente/agentes" element={<AgenteAgentes />} />
                <Route path="/agente/mensagens" element={<AgenteMensagens />} />
                <Route path="/agente/configuracoes" element={<AgenteConfig />} />

                {/* Master Admin */}
                <Route path="/master/central" element={<MasterCentral />} />
                <Route path="/master/dashboard" element={<MasterDashboard />} />
                <Route path="/master/financeiro" element={<MasterFinanceiro />} />
                <Route path="/master/afiliados" element={<MasterAfiliados />} />
                <Route path="/master/linhas" element={<MasterLinhas />} />
                <Route path="/master/whatsapp" element={<MasterWhatsApp />} />
                <Route path="/master/clientes" element={<Dashboard />} />
                <Route path="/master/telecom" element={<Dashboard />} />
                <Route path="/master/workers" element={<MasterWorkers />} />
                <Route path="/master/auditoria" element={<MasterAuditoria />} />
                <Route path="/master/notificacoes" element={<NotificacoesVencimentoAudit />} />
                <Route path="/master/alertas" element={<MasterAlertas />} />
                <Route path="/master/gateways" element={<MasterGateways />} />
                <Route path="/master/planos" element={<MasterPlanos />} />
                <Route path="/master/infraestrutura" element={<MasterInfraestrutura />} />
                <Route path="/master/usuarios" element={<MasterUsuarios />} />
                <Route path="/master/comissoes" element={<MasterComissoes />} />
                <Route path="/master/antifraude" element={<MasterAntifraude />} />
                <Route path="/master/projecoes" element={<MasterProjecoes />} />
                <Route path="/master/config" element={<Dashboard />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;