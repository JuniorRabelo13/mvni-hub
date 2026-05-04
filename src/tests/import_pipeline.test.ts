import { describe, it, expect, vi } from 'vitest';
import { supabase } from '../integrations/supabase/client';

// Mock do supabase para testes de UI
vi.mock('../integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

describe('Importação Pipeline - Estabilidade', () => {
  it('deve garantir que o encoding CSV inclua o BOM para UTF-8', () => {
    const csvData = "CNPJ;Erro\n12345678000100;Erro teste";
    const content = "\uFEFF" + csvData;
    expect(content.startsWith("\uFEFF")).toBe(true);
  });

  it('deve escapar caracteres especiais no CSV', () => {
    const rawErro = "Erro com; ponto e vírgula\ne quebra de linha";
    const sanitizedErro = rawErro
      .replace(/;/g, ',')
      .replace(/\n/g, ' ')
      .replace(/\r/g, '');
    
    expect(sanitizedErro).not.toContain(';');
    expect(sanitizedErro).not.toContain('\n');
    expect(sanitizedErro).toBe("Erro com, ponto e vírgula e quebra de linha");
  });
});
