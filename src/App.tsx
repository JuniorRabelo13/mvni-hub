import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import React, { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Layouts
const AppLayout = lazy(() => import("@/components/AppLayout"));

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

const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground animate-pulse">Carregando módulo...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner theme="dark" />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Suspense fallback={<LoadingFallback />}><AuthGuard><Auth /></AuthGuard></Suspense>} />
            <Route path="/recuperar-senha" element={<Suspense fallback={<LoadingFallback />}><RecuperarSenha /></Suspense>} />
            <Route path="/nova-senha" element={<Suspense fallback={<LoadingFallback />}><NovaSenha /></Suspense>} />
            <Route path="/cadastro" element={<Suspense fallback={<LoadingFallback />}><Cadastro /></Suspense>} />
            <Route path="/cadastro/sucesso" element={<Suspense fallback={<LoadingFallback />}><CadastroSucesso /></Suspense>} />
            <Route element={<Suspense fallback={<LoadingFallback />}><AuthGuard><AppLayout /></AuthGuard></Suspense>}>
              <Route path="/" element={<Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>} />
              <Route path="/painel" element={<Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>} />
              <Route path="/clientes" element={<Suspense fallback={<LoadingFallback />}><Clientes /></Suspense>} />
              <Route path="/estrutura" element={<Suspense fallback={<LoadingFallback />}><Estrutura /></Suspense>} />
              <Route path="/ganhos" element={<Suspense fallback={<LoadingFallback />}><Ganhos /></Suspense>} />
              <Route path="/pagamentos" element={<Suspense fallback={<LoadingFallback />}><Pagamentos /></Suspense>} />
              <Route path="/financeiro/saque" element={<Suspense fallback={<LoadingFallback />}><SaquePix /></Suspense>} />
              <Route path="/financeiro/extrato" element={<Suspense fallback={<LoadingFallback />}><ExtratoFinanceiro /></Suspense>} />
              <Route path="/configuracoes" element={<Suspense fallback={<LoadingFallback />}><Configuracoes /></Suspense>} />
              <Route path="/equipe" element={<Suspense fallback={<LoadingFallback />}><Equipe /></Suspense>} />
              <Route path="/admin" element={<Suspense fallback={<LoadingFallback />}><Admin /></Suspense>} />
              <Route path="/admin/logs" element={<Suspense fallback={<LoadingFallback />}><AdminLogs /></Suspense>} />
              <Route path="/admin/security" element={<Suspense fallback={<LoadingFallback />}><SecurityLogs /></Suspense>} />
              <Route path="/admin/importacoes" element={<Suspense fallback={<LoadingFallback />}><Importacoes /></Suspense>} />

              {/* SMS Module Routes */}
              <Route path="/sms/dashboard" element={<Suspense fallback={<LoadingFallback />}><SMSDashboard /></Suspense>} />
              <Route path="/sms/disparo" element={<Suspense fallback={<LoadingFallback />}><SMSDisparo /></Suspense>} />
              <Route path="/sms/campanhas" element={<Suspense fallback={<LoadingFallback />}><SMSCampanhas /></Suspense>} />
              <Route path="/sms/listas" element={<Suspense fallback={<LoadingFallback />}><SMSListas /></Suspense>} />
              <Route path="/sms/listas/nova" element={<Suspense fallback={<LoadingFallback />}><SMSNovaLista /></Suspense>} />
              <Route path="/sms/blacklist" element={<Suspense fallback={<LoadingFallback />}><SMSBlacklist /></Suspense>} />
              <Route path="/sms/saida" element={<Suspense fallback={<LoadingFallback />}><SMSSaida /></Suspense>} />
              <Route path="/sms/logs" element={<Suspense fallback={<LoadingFallback />}><SMSLogs /></Suspense>} />
              <Route path="/sms/relatorios" element={<Suspense fallback={<LoadingFallback />}><SMSRelatorios /></Suspense>} />
              <Route path="/sms/inbox" element={<Suspense fallback={<LoadingFallback />}><SMSInbox /></Suspense>} />
              <Route path="/sms/api" element={<Suspense fallback={<LoadingFallback />}><SMSApi /></Suspense>} />
              <Route path="/sms/webhooks" element={<Suspense fallback={<LoadingFallback />}><SMSWebhooks /></Suspense>} />
              <Route path="/sms/configuracoes" element={<Suspense fallback={<LoadingFallback />}><SMSConfiguracoes /></Suspense>} />

              {/* WhatsApp Agent Module Routes */}
              <Route path="/agente" element={<Suspense fallback={<LoadingFallback />}><AgenteDashboard /></Suspense>} />
              <Route path="/agente/leads" element={<Suspense fallback={<LoadingFallback />}><AgenteLeads /></Suspense>} />
              <Route path="/agente/agentes" element={<Suspense fallback={<LoadingFallback />}><AgenteAgentes /></Suspense>} />
              <Route path="/agente/mensagens" element={<Suspense fallback={<LoadingFallback />}><AgenteMensagens /></Suspense>} />
              <Route path="/agente/configuracoes" element={<Suspense fallback={<LoadingFallback />}><AgenteConfig /></Suspense>} />

              {/* Master Admin Routes */}
              <Route path="/master/central" element={<Suspense fallback={<LoadingFallback />}><MasterCentral /></Suspense>} />
              <Route path="/master/dashboard" element={<Suspense fallback={<LoadingFallback />}><MasterDashboard /></Suspense>} />
              <Route path="/master/financeiro" element={<Suspense fallback={<LoadingFallback />}><MasterFinanceiro /></Suspense>} />
              <Route path="/master/afiliados" element={<Suspense fallback={<LoadingFallback />}><MasterAfiliados /></Suspense>} />
              <Route path="/master/linhas" element={<Suspense fallback={<LoadingFallback />}><MasterLinhas /></Suspense>} />
              <Route path="/master/whatsapp" element={<Suspense fallback={<LoadingFallback />}><MasterWhatsApp /></Suspense>} />
              <Route path="/master/clientes" element={<Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>} />
              <Route path="/master/telecom" element={<Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>} />
              <Route path="/master/workers" element={<Suspense fallback={<LoadingFallback />}><MasterWorkers /></Suspense>} />
              <Route path="/master/auditoria" element={<Suspense fallback={<LoadingFallback />}><MasterAuditoria /></Suspense>} />
              <Route path="/master/notificacoes" element={<Suspense fallback={<LoadingFallback />}><NotificacoesVencimentoAudit /></Suspense>} />
              <Route path="/master/alertas" element={<Suspense fallback={<LoadingFallback />}><MasterAlertas /></Suspense>} />
              <Route path="/master/gateways" element={<Suspense fallback={<LoadingFallback />}><MasterGateways /></Suspense>} />
              <Route path="/master/planos" element={<Suspense fallback={<LoadingFallback />}><MasterPlanos /></Suspense>} />
              <Route path="/master/infraestrutura" element={<Suspense fallback={<LoadingFallback />}><MasterInfraestrutura /></Suspense>} />
              <Route path="/master/usuarios" element={<Suspense fallback={<LoadingFallback />}><MasterUsuarios /></Suspense>} />
              <Route path="/master/comissoes" element={<Suspense fallback={<LoadingFallback />}><MasterComissoes /></Suspense>} />
              <Route path="/master/antifraude" element={<Suspense fallback={<LoadingFallback />}><MasterAntifraude /></Suspense>} />
              <Route path="/master/projecoes" element={<Suspense fallback={<LoadingFallback />}><MasterProjecoes /></Suspense>} />
              <Route path="/master/config" element={<Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>} />
            </Route>
            <Route path="/termos" element={<Suspense fallback={<LoadingFallback />}><Termos /></Suspense>} />
            <Route path="/privacidade" element={<Suspense fallback={<LoadingFallback />}><Privacy /></Suspense>} />
            <Route path="*" element={<Suspense fallback={<LoadingFallback />}><NotFound /></Suspense>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;