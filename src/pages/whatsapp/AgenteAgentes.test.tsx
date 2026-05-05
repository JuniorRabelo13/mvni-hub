import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import AgenteAgentes from "./AgenteAgentes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";

// Define mocks first, inside the vi.mock factory to avoid hoisting issues
vi.mock("@/integrations/supabase/client", () => {
  const mock = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve({ data: null, error: null })),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
  };
  return {
    supabase: mock,
  };
});

// Import supabase after mock definition to get the mocked instance
import { supabase } from "@/integrations/supabase/client";
const mockSupabase = supabase as any;

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-123" },
  }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
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

  const setupMockAgents = (agents: any[]) => {
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockResolvedValue({ data: agents, error: null }),
        single: vi.fn().mockResolvedValue({ data: agents[0], error: null }),
      })),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: agents[0], error: null }),
    }));
  };

  it("1) abre modal -> chama /start e inicia polling", async () => {
    setupMockAgents([
      { id: "agent-1", numero_whatsapp: "5511999999999", status: "ativo", conectado: false },
    ]);

    renderComponent();

    const connectButton = await screen.findByText((c, el) => el?.tagName === "BUTTON" && c.includes("Conectar"));
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessionId: "session-123" }),
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "desconectado", qr: null }),
    });

    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(screen.getByText(/Conectar WhatsApp/i)).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/start"), expect.any(Object));
    expect(screen.getByText(/Gerando QR Code.../i)).toBeInTheDocument();
  });

  it("2) polling retorna qr -> estado qr_pronto + imagem visível", async () => {
    setupMockAgents([{ id: "agent-1", numero_whatsapp: "5511999999999", status: "ativo", conectado: false }]);

    renderComponent();
    const connectButton = await screen.findByText((c, el) => el?.tagName === "BUTTON" && c.includes("Conectar"));

    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ sessionId: "session-123" }) });
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ status: "qr", qr: "data:image/png;base64,abc" }) });

    fireEvent.click(connectButton);

    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    await waitFor(() => {
      expect(screen.getByAltText(/WhatsApp QR Code/i)).toBeInTheDocument();
      expect(screen.getByText(/Aguardando leitura.../i)).toBeInTheDocument();
    });
  });

  it("3) timeout 60s -> estado erro + botão Repetir", async () => {
    setupMockAgents([{ id: "agent-1", numero_whatsapp: "5511999999999", status: "ativo", conectado: false }]);

    renderComponent();
    const connectButton = await screen.findByText((c, el) => el?.tagName === "BUTTON" && c.includes("Conectar"));

    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ status: "desconectado", qr: null, sessionId: "s1" }) });

    fireEvent.click(connectButton);

    await act(async () => {
      vi.advanceTimersByTime(61000);
    });

    await waitFor(() => {
      expect(screen.getByText(/Falha na conexão/i)).toBeInTheDocument();
      expect(screen.getByText(/Repetir tentativa/i)).toBeInTheDocument();
    });
  });

  it("4) fechar modal -> polling cancelado", async () => {
    setupMockAgents([{ id: "agent-1", numero_whatsapp: "5511999999999", status: "ativo", conectado: false }]);

    renderComponent();
    const connectButton = await screen.findByText((c, el) => el?.tagName === "BUTTON" && c.includes("Conectar"));

    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ status: "desconectado", qr: null, sessionId: "s1" }) });

    fireEvent.click(connectButton);
    
    await act(async () => { vi.advanceTimersByTime(2100); });
    const initialCallCount = mockFetch.mock.calls.length;

    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);

    await act(async () => { vi.advanceTimersByTime(10000); });
    
    expect(mockFetch.mock.calls.length).toBe(initialCallCount);
  });

  it("5) duas linhas conectando em paralelo -> estados isolados", async () => {
    const agents = [
      { id: "a1", numero_whatsapp: "111", status: "ativo", conectado: false },
      { id: "a2", numero_whatsapp: "222", status: "ativo", conectado: false }
    ];
    setupMockAgents(agents);

    renderComponent();
    
    const buttons = await screen.findAllByText((c, el) => el?.tagName === "BUTTON" && c.includes("Conectar"));
    
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ sessionId: "s1" }) });
    fireEvent.click(buttons[0]);
    
    await waitFor(() => {
       expect(screen.getByText(/111/i)).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/start"), expect.objectContaining({
      body: expect.stringContaining('"agentId":"a1"')
    }));
  });
});