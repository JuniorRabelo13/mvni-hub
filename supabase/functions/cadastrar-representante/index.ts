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

    // 1. Validar se o email já existe
    const { data: existingEmail } = await supabase
      .from("usuarios")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingEmail) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "E-mail já cadastrado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 2. Validar se o CPF já existe
    const { data: existingCPF } = await supabase
      .from("usuarios")
      .select("id")
      .eq("cpf", cpf)
      .maybeSingle();

    if (existingCPF) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "CPF já cadastrado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 3. Buscar sponsor se codigo_indicador enviado
    let sponsorId = null;
    if (codigo_indicador) {
      const { data: sponsor } = await supabase
        .from("usuarios")
        .select("id")
        .eq("codigo_indicacao", codigo_indicador)
        .maybeSingle();
      
      if (sponsor) {
        sponsorId = sponsor.id;
      }
    }

    // 4. Criar usuário no Auth via Service Role
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome, full_name: nome },
    });

    if (authError) throw authError;

    // 5. Inserir registro na tabela usuarios
    const { error: dbError } = await supabase
      .from("usuarios")
      .insert({
        id: authUser.user.id,
        nome,
        cpf,
        email,
        telefone,
        role: "representante",
        indicado_por: sponsorId,
      });

    if (dbError) {
      // Cleanup auth user if DB insert fails
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
