import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { nome, cpf, email, telefone, senha, codigo_indicador } = await req.json();

    // SECURITY: input validation
    const errs: string[] = [];
    const isStr = (v: unknown, max = 255) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
    if (!isStr(nome, 120)) errs.push("nome inválido");
    if (!isStr(email, 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push("email inválido");
    if (typeof senha !== "string" || senha.length < 8 || senha.length > 128) errs.push("senha deve ter 8-128 caracteres");
    const cpfDigits = typeof cpf === "string" ? cpf.replace(/\D/g, "") : "";
    if (cpfDigits.length !== 11) errs.push("CPF inválido");
    // CPF check digit validation
    const validCpf = (d: string) => {
      if (/^(\d)\1{10}$/.test(d)) return false;
      const calc = (slice: number) => {
        let sum = 0;
        for (let i = 0; i < slice; i++) sum += parseInt(d[i]) * (slice + 1 - i);
        const r = (sum * 10) % 11;
        return r === 10 ? 0 : r;
      };
      return calc(9) === parseInt(d[9]) && calc(10) === parseInt(d[10]);
    };
    if (cpfDigits.length === 11 && !validCpf(cpfDigits)) errs.push("CPF inválido");
    const telDigits = typeof telefone === "string" ? telefone.replace(/\D/g, "") : "";
    if (telefone !== undefined && telefone !== null && telefone !== "" && (telDigits.length < 10 || telDigits.length > 13)) errs.push("telefone inválido");
    if (codigo_indicador !== undefined && codigo_indicador !== null && codigo_indicador !== "" && !isStr(codigo_indicador, 64)) errs.push("codigo_indicador inválido");
    if (errs.length) {
      return new Response(JSON.stringify({ sucesso: false, mensagem: errs.join("; ") }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }



    // 1. Validar se o email já existe em profiles
    const { data: existingEmail } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingEmail) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "E-mail já cadastrado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 2. Validar se o CPF já existe em profiles
    const { data: existingCPF } = await supabase
      .from("profiles")
      .select("id")
      .eq("cpf", cpfDigits)
      .maybeSingle();

    if (existingCPF) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "CPF já cadastrado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 3. Buscar sponsor (indicador) via codigo_indicacao em profiles
    let sponsorId: string | null = null;
    if (codigo_indicador) {
      const { data: sponsor } = await supabase
        .from("profiles")
        .select("id")
        .eq("codigo_indicacao", codigo_indicador)
        .maybeSingle();

      if (sponsor) {
        sponsorId = sponsor.id;
      }
    }

    // 4. Criar usuário no Auth — trigger handle_new_user popula profiles
    //    a partir do user_metadata (nome, telefone, cpf, indicador_id, role).
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome,
        full_name: nome,
        telefone,
        cpf: cpfDigits,
        indicador_id: sponsorId,
        role: "representante",
      },
    });

    if (authError) throw authError;

    // 5. Garante role/telefone/cpf caso o trigger não tenha propagado tudo
    //    (idempotente — apenas reforça).
    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        nome,
        telefone,
        cpf: cpfDigits,
        role: "representante",
        indicador_id: sponsorId,
      })
      .eq("id", authUser.user.id);

    if (dbError) {
      await supabase.auth.admin.deleteUser(authUser.user.id);
      throw dbError;
    }

    return new Response(
      JSON.stringify({ sucesso: true, mensagem: "Conta criada com sucesso" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("Erro no cadastro:", error);
    return new Response(
      JSON.stringify({ sucesso: false, mensagem: error.message || "Erro interno ao criar conta" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
