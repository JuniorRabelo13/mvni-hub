import { supabase } from "@/integrations/supabase/client";

export type PixCharge = {
  pagamento_id: string;
  status: string;
  pix_copia_e_cola: string | null;
  pix_qr_code_base64: string | null;
  expires_at: string | null;
  valor: number;
  provider_intent_id: string | null;
};

export async function criarPixParaFatura(faturaId: string): Promise<PixCharge> {
  const { data, error } = await supabase.functions.invoke("mvno-pix-criar", {
    body: { fatura_id: faturaId },
  });
  if (error) {
    const details = (error as any)?.context ? await (error as any).context.text().catch(() => "") : "";
    throw new Error(details || error.message || "Falha ao gerar PIX");
  }
  if (!data || (data as any).error) {
    throw new Error((data as any)?.error ?? "Falha ao gerar PIX");
  }
  return data as PixCharge;
}

export async function getPagamentoByFatura(faturaId: string) {
  const { data, error } = await supabase
    .from("mvno_pagamentos")
    .select("*")
    .eq("fatura_id", faturaId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPagamentoById(id: string) {
  const { data, error } = await supabase
    .from("mvno_pagamentos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
