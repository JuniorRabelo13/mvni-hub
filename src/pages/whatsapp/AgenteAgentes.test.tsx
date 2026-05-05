import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import AgenteAgentes from "./AgenteAgentes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";

// Use an object that vitest can hoist
const mockSupabase = {
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

vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase
}));

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
        gcTime: 0,
      },
    },
  });

describe("AgenteAgentes - Fluxo do Modal WhatsApp", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    // Don't use fake timers by default to avoid complexity with react-query and other effects
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AgenteAgentes />
        </TooltipProvider>
      </QueryClientProvider>
    );

  it("1) abre modal -> chama /start e inicia polling", async () => {
    const agents = [{ id: "agent-1", numero_whatsapp: "5511999999999", status: "ativo", conectado: false }];
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockResolvedValue({ data: agents, error: null }),
    }));

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

    expect(await screen.findByText(/Conectar WhatsApp/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/start"), expect.any(Object));
    });

    expect(await screen.findByText(/Gerando QR Code.../i)).toBeInTheDocument();
  });

  it("2) polling retorna qr -> estado qr_pronto + imagem visível", async () => {
    const agents = [{ id: "agent-1", numero_whatsapp: "5511999999999", status: "ativo", conectado: false }];
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockResolvedValue({ data: agents, error: null }),
    }));

    renderComponent();
    const connectButton = await screen.findByText((c, el) => el?.tagName === "BUTTON" && c.includes("Conectar"));

    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ sessionId: "session-123" }) });
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ status: "qr", qr: "data:image/png;base64,abc" }) });

    fireEvent.click(connectButton);

    const qrImage = await screen.findByAltText(/WhatsApp QR Code/i);
    expect(qrImage).toBeInTheDocument();
    expect(qrImage).toHaveAttribute("src", "data:image/png;base64,abc");
    expect(screen.getByText(/Aguardando leitura.../i)).toBeInTheDocument();
  });
});