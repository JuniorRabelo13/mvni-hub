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

const LoadingScreen = () => (
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
            <Route path="/auth" element={<Suspense fallback={<LoadingScreen />}><AuthGuard><Auth /></AuthGuard></Suspense>} />
            <Route path="/recuperar-senha" element={<Suspense fallback={<LoadingScreen />}><RecuperarSenha /></Suspense>} />
            <Route path="/nova-senha" element={<Suspense fallback={<LoadingScreen />}><NovaSenha /></Suspense>} />
            <Route path="/cadastro" element={<Suspense fallback={<LoadingScreen />}><Cadastro /></Suspense>} />
            <Route path="/cadastro/sucesso" element={<Suspense fallback={<LoadingScreen />}><CadastroSucesso /></Suspense>} />
            <Route element={<Suspense fallback={<LoadingScreen />}><AuthGuard><AppLayout /></AuthGuard></Suspense>}>
              <Route path="/" element={<Suspense fallback={<LoadingScreen />}><Dashboard /></Suspense>} />
              <Route path="/painel" element={<Suspense fallback={<LoadingScreen />}><Dashboard /></Suspense>} />
              <Route path="/clientes" element={<Suspense fallback={<LoadingScreen />}><Clientes /></Suspense>} />
              <Route path="/estrutura" element={<Suspense fallback={<LoadingScreen />}><Estrutura /></Suspense>} />
              <Route path="/ganhos" element={<Suspense fallback={<LoadingScreen />}><Ganhos /></Suspense>} />
              <Route path="/pagamentos" element={<Suspense fallback={<LoadingScreen />}><Pagamentos /></Suspense>} />
              <Route path="/financeiro/saque" element={<Suspense fallback={<LoadingScreen />}><SaquePix /></Suspense>} />
              <Route path="/financeiro/extrato" element={<Suspense fallback={<LoadingScreen />}><ExtratoFinanceiro /></Suspense>} />
              <Route path="/configuracoes" element={<Suspense fallback={<LoadingScreen />}><Configuracoes /></Suspense>} />
              <Route path="/equipe" element={<Suspense fallback={<LoadingScreen />}><Equipe /></Suspense>} />
              <Route path="/admin" element={<Suspense fallback={<LoadingScreen />}><Admin /></Suspense>} />
              <Route path="/admin/logs" element={<Suspense fallback={<LoadingScreen />}><AdminLogs /></Suspense>} />
              <Route path="/admin/security" element={<Suspense fallback={<LoadingScreen />}><SecurityLogs /></Suspense>} />
              <Route path="/admin/importacoes" element={<Suspense fallback={<LoadingScreen />}><Importacoes /></Suspense>} />

              {/* SMS Module Routes */}
              <Route path="/sms/dashboard" element={<Suspense fallback={<LoadingScreen />}><SMSDashboard /></Suspense>} />
              <Route path="/sms/disparo" element={<Suspense fallback={<LoadingScreen />}><SMSDisparo /></Suspense>} />
              <Route path="/sms/campanhas" element={<Suspense fallback={<LoadingScreen />}><SMSCampanhas /></Suspense>} />
              <Route path="/sms/listas" element={<Suspense fallback={<LoadingScreen />}><SMSListas /></Suspense>} />
              <Route path="/sms/listas/nova" element={<Suspense fallback={<LoadingScreen />}><SMSNovaLista /></Suspense>} />
              <Route path="/sms/blacklist" element={<Suspense fallback={<LoadingScreen />}><SMSBlacklist /></Suspense>} />
              <Route path="/sms/saida" element={<Suspense fallback={<LoadingScreen />}><SMSSaida /></Suspense>} />
              <Route path="/sms/logs" element={<Suspense fallback={<LoadingScreen />}><SMSLogs /></Suspense>} />
              <Route path="/sms/relatorios" element={<Suspense fallback={<LoadingScreen />}><SMSRelatorios /></Suspense>} />
              <Route path="/sms/inbox" element={<Suspense fallback={<LoadingScreen />}><SMSInbox /></Suspense>} />
              <Route path="/sms/api" element={<Suspense fallback={<LoadingScreen />}><SMSApi /></Suspense>} />
              <Route path="/sms/webhooks" element={<Suspense fallback={<LoadingScreen />}><SMSWebhooks /></Suspense>} />
              <Route path="/sms/configuracoes" element={<Suspense fallback={<LoadingScreen />}><SMSConfiguracoes /></Suspense>} />

              {/* WhatsApp Agent Module Routes */}
              <Route path="/agente" element={<Suspense fallback={<LoadingScreen />}><AgenteDashboard /></Suspense>} />
              <Route path="/agente/leads" element={<Suspense fallback={<LoadingScreen />}><AgenteLeads /></Suspense>} />
              <Route path="/agente/agentes" element={<Suspense fallback={<LoadingScreen />}><AgenteAgentes /></Suspense>} />
              <Route path="/agente/mensagens" element={<Suspense fallback={<LoadingScreen />}><AgenteMensagens /></Suspense>} />
              <Route path="/agente/configuracoes" element={<Suspense fallback={<LoadingScreen />}><AgenteConfig /></Suspense>} />

              {/* Master Admin Routes */}
              <Route path="/master/central" element={<Suspense fallback={<LoadingScreen />}><MasterCentral /></Suspense>} />
              <Route path="/master/dashboard" element={<Suspense fallback={<LoadingScreen />}><MasterDashboard /></Suspense>} />
              <Route path="/master/financeiro" element={<Suspense fallback={<LoadingScreen />}><MasterFinanceiro /></Suspense>} />
              <Route path="/master/afiliados" element={<Suspense fallback={<LoadingScreen />}><MasterAfiliados /></Suspense>} />
              <Route path="/master/linhas" element={<Suspense fallback={<LoadingScreen />}><MasterLinhas /></Suspense>} />
              <Route path="/master/whatsapp" element={<Suspense fallback={<LoadingScreen />}><MasterWhatsApp /></Suspense>} />
              <Route path="/master/clientes" element={<Suspense fallback={<LoadingScreen />}><Dashboard /></Suspense>} />
              <Route path="/master/telecom" element={<Suspense fallback={<LoadingScreen />}><Dashboard /></Suspense>} />
              <Route path="/master/workers" element={<Suspense fallback={<LoadingScreen />}><MasterWorkers /></Suspense>} />
              <Route path="/master/auditoria" element={<Suspense fallback={<LoadingScreen />}><MasterAuditoria /></Suspense>} />
              <Route path="/master/notificacoes" element={<Suspense fallback={<LoadingScreen />}><NotificacoesVencimentoAudit /></Suspense>} />
              <Route path="/master/alertas" element={<Suspense fallback={<LoadingScreen />}><MasterAlertas /></Suspense>} />
              <Route path="/master/gateways" element={<Suspense fallback={<LoadingScreen />}><MasterGateways /></Suspense>} />
              <Route path="/master/planos" element={<Suspense fallback={<LoadingScreen />}><MasterPlanos /></Suspense>} />
              <Route path="/master/infraestrutura" element={<Suspense fallback={<LoadingScreen />}><MasterInfraestrutura /></Suspense>} />
              <Route path="/master/usuarios" element={<Suspense fallback={<LoadingScreen />}><MasterUsuarios /></Suspense>} />
              <Route path="/master/comissoes" element={<Suspense fallback={<LoadingScreen />}><MasterComissoes /></Suspense>} />
              <Route path="/master/antifraude" element={<Suspense fallback={<LoadingScreen />}><MasterAntifraude /></Suspense>} />
              <Route path="/master/projecoes" element={<Suspense fallback={<LoadingScreen />}><MasterProjecoes /></Suspense>} />
              <Route path="/master/config" element={<Suspense fallback={<LoadingScreen />}><Dashboard /></Suspense>} />
            </Route>
            <Route path="/termos" element={<Suspense fallback={<LoadingScreen />}><Termos /></Suspense>} />
            <Route path="/privacidade" element={<Suspense fallback={<LoadingScreen />}><Privacy /></Suspense>} />
            <Route path="*" element={<Suspense fallback={<LoadingScreen />}><NotFound /></Suspense>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;