import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Estrutura from "./pages/Estrutura";
import Ganhos from "./pages/Ganhos";
import Pagamentos from "./pages/Pagamentos";
import Configuracoes from "./pages/Configuracoes";
import Equipe from "./pages/Equipe";
import Admin from "./pages/Admin";
import AdminLogs from "./pages/AdminLogs";
import SecurityLogs from "./pages/SecurityLogs";
import Importacoes from "./pages/Importacoes";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import SaquePix from "./pages/financeiro/SaquePix";
import ExtratoFinanceiro from "./pages/financeiro/Extrato";

// SMS Module Pages
import SMSDashboard from "./pages/sms/SMSDashboard";
import SMSDisparo from "./pages/sms/SMSDisparo";
import SMSCampanhas from "./pages/sms/SMSCampanhas";
import SMSListas from "./pages/sms/SMSListas";
import SMSNovaLista from "./pages/sms/SMSNovaLista";
import SMSBlacklist from "./pages/sms/SMSBlacklist";
import SMSSaida from "./pages/sms/SMSSaida";
import SMSLogs from "./pages/sms/SMSLogs";
import SMSRelatorios from "./pages/sms/SMSRelatorios";
import SMSInbox from "./pages/sms/SMSInbox";
import SMSApi from "./pages/sms/SMSApi";
import SMSWebhooks from "./pages/sms/SMSWebhooks";
import SMSConfiguracoes from "./pages/sms/SMSConfiguracoes";

// WhatsApp Agent Module Pages
import AgenteDashboard from "./pages/whatsapp/AgenteDashboard";
import AgenteLeads from "./pages/whatsapp/AgenteLeads";
import AgenteConfig from "./pages/whatsapp/AgenteConfig";
import AgenteMensagens from "./pages/whatsapp/AgenteMensagens";
import AgenteAgentes from "./pages/whatsapp/AgenteAgentes";

// Master Admin Pages
import MasterDashboard from "./pages/master-admin/Dashboard";
import MasterFinanceiro from "./pages/master-admin/Financeiro";
import MasterAfiliados from "./pages/master-admin/Afiliados";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner theme="dark" />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
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

              {/* SMS Module Routes */}
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

              {/* WhatsApp Agent Module Routes */}
              <Route path="/agente" element={<AgenteDashboard />} />
              <Route path="/agente/leads" element={<AgenteLeads />} />
              <Route path="/agente/agentes" element={<AgenteAgentes />} />
              <Route path="/agente/mensagens" element={<AgenteMensagens />} />
              <Route path="/agente/configuracoes" element={<AgenteConfig />} />

              {/* Master Admin Routes */}
              <Route path="/master/dashboard" element={<MasterDashboard />} />
              <Route path="/master/financeiro" element={<MasterFinanceiro />} />
              <Route path="/master/afiliados" element={<MasterAfiliados />} />
              <Route path="/master/clientes" element={<Dashboard />} />
              <Route path="/master/telecom" element={<Dashboard />} />
              <Route path="/master/automacoes" element={<Dashboard />} />
              <Route path="/master/alertas" element={<Dashboard />} />
              <Route path="/master/config" element={<Dashboard />} />
            </Route>
            <Route path="/termos" element={<Terms />} />
            <Route path="/privacidade" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
