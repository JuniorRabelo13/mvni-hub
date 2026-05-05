import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import AgenteAgentes from "./AgenteAgentes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mock do Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: [], error: null })),
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: "agent-1" }, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
  },
}));

// Mock do hook useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-123" },
  }),
}));

// Mock de fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch;

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe("AgenteAgentes - Fluxo do Modal WhatsApp", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AgenteAgentes />
        </TooltipProvider>
      </QueryClientProvider>
    );

  it("deve abrir o modal, chamar /start e iniciar polling", async () => {
    // Mocking initial data - one agent disconnected
    const mockAgents = [
      {
        id: "agent-1",
        numero_whatsapp: "5511999999999",
        status: "ativo",
        conectado: false,
        status_conexao: "desconectado",
        whatsapp_number_stats: [{ safety_status: "safe", daily_volume_limit: 42, warming_level: 1 }],
      },
    ];

    const { supabase } = await import("@/integrations/supabase/client");
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: mockAgents, error: null }),
      }),
    });

    renderComponent();

    // Encontra o botão de conectar na tabela
    const connectButton = await screen.findByRole("button", { name: /conectar/i });
    
    // Mock da resposta do /start
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessionId: "session-abc" }),
    });

    // Mock da primeira resposta do polling /qr (ainda sem QR)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "desconectado", qr: null }),
    });

    fireEvent.click(connectButton);

    // Verifica se modal abriu
    expect(screen.getByText(/conectar whatsapp/i)).toBeInTheDocument();
    
    // Verifica se chamou /start
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/whatsapp-api/start"),
        expect.objectContaining({ method: "POST" })
      );
    });

    // Verifica estado de polling inicial
    expect(screen.getByText(/gerando qr code\.\.\./i)).toBeInTheDocument();
  });

  it("deve mostrar imagem visível quando polling retorna qr", async () => {
    // Setup similar ao anterior, mas mockando resposta com QR
    const mockAgents = [
      { id: "agent-1", numero_whatsapp: "5511999999999", status: "ativo", conectado: false },
    ];
    const { supabase } = await import("@/integrations/supabase/client");
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: mockAgents, error: null }),
      }),
    });

    renderComponent();
    const connectButton = await screen.findByRole("button", { name: /conectar/i });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessionId: "session-abc" }),
    });

    // Segunda chamada (polling) retorna o QR
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "qr", qr: "data:image/png;base64,abc" }),
    });

    fireEvent.click(connectButton);

    // Avança o tempo para o polling ocorrer
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      const qrImage = screen.getByAltText(/whatsapp qr code/i);
      expect(qrImage).toBeInTheDocument();
      expect(qrImage).toHaveAttribute("src", "data:image/png;base64,abc");
    });
    
    expect(screen.getByText(/aguardando leitura\.\.\./i)).toBeInTheDocument();
  });

  it("deve mostrar erro e botão de repetir após timeout de 60s", async () => {
    const mockAgents = [
      { id: "agent-1", numero_whatsapp: "5511999999999", status: "ativo", conectado: false },
    ];
    const { supabase } = await import("@/integrations/supabase/client");
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: mockAgents, error: null }),
      }),
    });

    renderComponent();
    const connectButton = await screen.findByRole("button", { name: /conectar/i });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "desconectado", qr: null, sessionId: "session-abc" }),
    });

    fireEvent.click(connectButton);

    // Avança 61 segundos
    await act(async () => {
      vi.advanceTimersByTime(61000);
    });

    await waitFor(() => {
      expect(screen.getByText(/falha na conexão/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /repetir tentativa/i })).toBeInTheDocument();
    });
  });

  it("deve cancelar o polling ao fechar o modal", async () => {
    const mockAgents = [
      { id: "agent-1", numero_whatsapp: "5511999999999", status: "ativo", conectado: false },
    ];
    const { supabase } = await import("@/integrations/supabase/client");
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: mockAgents, error: null }),
      }),
    });

    renderComponent();
    const connectButton = await screen.findByRole("button", { name: /conectar/i });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "desconectado", qr: null, sessionId: "session-abc" }),
    });

    fireEvent.click(connectButton);
    
    // Verifica que polling iniciou
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(mockFetch).toHaveBeenCalledTimes(2); // /start + 1 poll

    // Fecha o modal (simulando clique fora ou no fechar do Dialog)
    // No Radix UI Dialog, o onOpenChange(false) é chamado
    const closeButton = screen.getByRole("button", { name: /close/i }); // Botão padrão do Dialog
    fireEvent.click(closeButton);

    // Avança mais tempo e verifica se não houve mais chamadas fetch
    mockFetch.mockClear();
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });
    
    expect(mockFetch).not.toHaveBeenCalled();
  });
});