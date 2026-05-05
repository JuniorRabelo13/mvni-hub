import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import AgenteAgentes from "./AgenteAgentes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mock do Supabase
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

// Importar o mock
import { supabase } from "@/integrations/supabase/client";

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
        staleTime: 0,
        gcTime: 0,
      },
    },
  });

describe("AgenteAgentes - Fluxo do Modal WhatsApp", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
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

    (supabase.from as any).mockImplementation(() => ({
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockAgents[0], error: null }),
      select: vi.fn().mockResolvedValue({ data: mockAgents, error: null }),
    }));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessionId: "session-abc" }),
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "desconectado", qr: null }),
    });

    renderComponent();

    const connectButton = await screen.findByText(/conectar/i, { selector: 'button span' });
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
    
    (supabase.from as any).mockImplementation(() => ({
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockAgents[0], error: null }),
      select: vi.fn().mockResolvedValue({ data: mockAgents, error: null }),
    }));

    renderComponent();
    const connectButton = await screen.findByText(/conectar/i, { selector: 'button span' });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessionId: "session-abc" }),
    });

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
});