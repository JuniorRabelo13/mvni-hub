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
    // NÃO usar fake timers globalmente se estiver dando timeout, ou gerenciar cuidadosamente
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

    const connectButton = await screen.findByRole("button", { name: /conectar/i });
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessionId: "session-abc" }),
    });

    // Mock do poll inicial
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "desconectado", qr: null }),
    });

    fireEvent.click(connectButton);

    expect(await screen.findByText(/conectar whatsapp/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/whatsapp-api/start"),
        expect.any(Object)
      );
    });

    expect(await screen.findByText(/gerando qr code\.\.\./i)).toBeInTheDocument();
  });

  it("deve mostrar imagem visível quando polling retorna qr", async () => {
    const mockAgents = [{ id: "agent-1", numero_whatsapp: "5511999999999", status: "ativo", conectado: false }];
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

    // Mock polling
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "qr", qr: "data:image/png;base64,abc" }),
    });

    fireEvent.click(connectButton);

    const qrImage = await screen.findByAltText(/whatsapp qr code/i);
    expect(qrImage).toBeInTheDocument();
    expect(qrImage).toHaveAttribute("src", "data:image/png;base64,abc");
    expect(screen.getByText(/aguardando leitura\.\.\./i)).toBeInTheDocument();
  });

  it("deve mostrar erro após timeout de 60s", async () => {
    vi.useFakeTimers();
    const mockAgents = [{ id: "agent-1", numero_whatsapp: "5511999999999", status: "ativo", conectado: false }];
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

    await act(async () => {
      vi.advanceTimersByTime(61000);
    });

    expect(await screen.findByText(/falha na conexão/i)).toBeInTheDocument();
    vi.useRealTimers();
  });
});