export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          ativo: boolean
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cobrancas: {
        Row: {
          cliente_id: string
          created_at: string
          id: string
          is_primeira: boolean
          linha_id: string
          pago_em: string | null
          status: Database["public"]["Enums"]["cobranca_status"]
          user_id: string
          valor: number
          vencimento: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          id?: string
          is_primeira?: boolean
          linha_id: string
          pago_em?: string | null
          status?: Database["public"]["Enums"]["cobranca_status"]
          user_id: string
          valor?: number
          vencimento: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          id?: string
          is_primeira?: boolean
          linha_id?: string
          pago_em?: string | null
          status?: Database["public"]["Enums"]["cobranca_status"]
          user_id?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "cobrancas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobrancas_linha_id_fkey"
            columns: ["linha_id"]
            isOneToOne: false
            referencedRelation: "linhas"
            referencedColumns: ["id"]
          },
        ]
      }
      comissoes: {
        Row: {
          cliente_id: string
          cobranca_id: string
          competencia: string
          created_at: string
          id: string
          tipo: Database["public"]["Enums"]["comissao_tipo"]
          user_id: string
          valor: number
        }
        Insert: {
          cliente_id: string
          cobranca_id: string
          competencia?: string
          created_at?: string
          id?: string
          tipo: Database["public"]["Enums"]["comissao_tipo"]
          user_id: string
          valor: number
        }
        Update: {
          cliente_id?: string
          cobranca_id?: string
          competencia?: string
          created_at?: string
          id?: string
          tipo?: Database["public"]["Enums"]["comissao_tipo"]
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_cobranca_id_fkey"
            columns: ["cobranca_id"]
            isOneToOne: false
            referencedRelation: "cobrancas"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          chave: string
          descricao: string | null
          id: string
          updated_at: string | null
          valor: string
        }
        Insert: {
          chave: string
          descricao?: string | null
          id?: string
          updated_at?: string | null
          valor: string
        }
        Update: {
          chave?: string
          descricao?: string | null
          id?: string
          updated_at?: string | null
          valor?: string
        }
        Relationships: []
      }
      import_chunks: {
        Row: {
          created_at: string | null
          erro: string | null
          id: string
          job_id: string | null
          payload: Json
          proxima_tentativa: string | null
          status: string
          tentativas: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          erro?: string | null
          id?: string
          job_id?: string | null
          payload: Json
          proxima_tentativa?: string | null
          status?: string
          tentativas?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          erro?: string | null
          id?: string
          job_id?: string | null
          payload?: Json
          proxima_tentativa?: string | null
          status?: string
          tentativas?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_chunks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          cancelado: boolean | null
          created_at: string | null
          id: string
          linhas_processadas: number | null
          nome: string
          status: string
          total_linhas: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cancelado?: boolean | null
          created_at?: string | null
          id?: string
          linhas_processadas?: number | null
          nome: string
          status?: string
          total_linhas?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cancelado?: boolean | null
          created_at?: string | null
          id?: string
          linhas_processadas?: number | null
          nome?: string
          status?: string
          total_linhas?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      import_logs: {
        Row: {
          cnpj: string | null
          created_at: string | null
          erro: string | null
          id: string
          job_id: string | null
          payload: Json | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string | null
          erro?: string | null
          id?: string
          job_id?: string | null
          payload?: Json | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string | null
          erro?: string | null
          id?: string
          job_id?: string | null
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "import_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      linhas: {
        Row: {
          ativada_em: string
          cliente_id: string
          created_at: string
          id: string
          msisdn: string | null
          plano: string
          status: Database["public"]["Enums"]["linha_status"]
          user_id: string
          valor: number
        }
        Insert: {
          ativada_em?: string
          cliente_id: string
          created_at?: string
          id?: string
          msisdn?: string | null
          plano?: string
          status?: Database["public"]["Enums"]["linha_status"]
          user_id: string
          valor?: number
        }
        Update: {
          ativada_em?: string
          cliente_id?: string
          created_at?: string
          id?: string
          msisdn?: string | null
          plano?: string
          status?: Database["public"]["Enums"]["linha_status"]
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "linhas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          gestor_id: string | null
          id: string
          indicador_id: string | null
          nome: string
          role: string | null
          status: Database["public"]["Enums"]["user_status"]
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          gestor_id?: string | null
          id: string
          indicador_id?: string | null
          nome: string
          role?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          gestor_id?: string | null
          id?: string
          indicador_id?: string | null
          nome?: string
          role?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_indicador_id_fkey"
            columns: ["indicador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rpc_logs: {
        Row: {
          created_at: string | null
          function_name: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          function_name: string
          id?: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          function_name?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      rpc_usage_logs: {
        Row: {
          created_at: string | null
          function_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          function_name: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          function_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          campo_detectado: string
          created_at: string
          hash_payload: string
          id: string
          origem: string
          user_id: string
        }
        Insert: {
          campo_detectado: string
          created_at?: string
          hash_payload: string
          id?: string
          origem: string
          user_id: string
        }
        Update: {
          campo_detectado?: string
          created_at?: string
          hash_payload?: string
          id?: string
          origem?: string
          user_id?: string
        }
        Relationships: []
      }
      sms_blacklist: {
        Row: {
          created_at: string | null
          id: string
          motivo: string | null
          telefone: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          motivo?: string | null
          telefone: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          motivo?: string | null
          telefone?: string
          user_id?: string
        }
        Relationships: []
      }
      sms_campaigns: {
        Row: {
          agendado_para: string | null
          created_at: string | null
          entregues: number | null
          falhas: number | null
          id: string
          list_id: string | null
          mensagem: string
          nome: string
          status: string | null
          total_envios: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agendado_para?: string | null
          created_at?: string | null
          entregues?: number | null
          falhas?: number | null
          id?: string
          list_id?: string | null
          mensagem: string
          nome: string
          status?: string | null
          total_envios?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agendado_para?: string | null
          created_at?: string | null
          entregues?: number | null
          falhas?: number | null
          id?: string
          list_id?: string | null
          mensagem?: string
          nome?: string
          status?: string | null
          total_envios?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_campaigns_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "sms_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_contacts: {
        Row: {
          created_at: string | null
          id: string
          list_id: string | null
          nome: string | null
          tags: string[] | null
          telefone: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          list_id?: string | null
          nome?: string | null
          tags?: string[] | null
          telefone: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          list_id?: string | null
          nome?: string | null
          tags?: string[] | null
          telefone?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_contacts_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "sms_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_credits: {
        Row: {
          created_at: string | null
          id: string
          saldo: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          saldo?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          saldo?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sms_lists: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          total_contatos: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          total_contatos?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          total_contatos?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sms_messages: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          direcao: string | null
          erro: string | null
          id: string
          mensagem: string
          preco: number | null
          provider_id: string | null
          status: Database["public"]["Enums"]["sms_status"] | null
          telefone: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          direcao?: string | null
          erro?: string | null
          id?: string
          mensagem: string
          preco?: number | null
          provider_id?: string | null
          status?: Database["public"]["Enums"]["sms_status"] | null
          telefone: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          direcao?: string | null
          erro?: string | null
          id?: string
          mensagem?: string
          preco?: number | null
          provider_id?: string | null
          status?: Database["public"]["Enums"]["sms_status"] | null
          telefone?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sms_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_settings: {
        Row: {
          created_at: string | null
          id: string
          labsmobile_token: string | null
          labsmobile_username: string | null
          limite_por_minuto: number | null
          remetente: string | null
          updated_at: string | null
          user_id: string
          webhook_secret: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          labsmobile_token?: string | null
          labsmobile_username?: string | null
          limite_por_minuto?: number | null
          remetente?: string | null
          updated_at?: string | null
          user_id: string
          webhook_secret?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          labsmobile_token?: string | null
          labsmobile_username?: string | null
          limite_por_minuto?: number | null
          remetente?: string | null
          updated_at?: string | null
          user_id?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_import_job: { Args: { p_job_id: string }; Returns: undefined }
      check_rpc_rate_limit: {
        Args: { p_function_name: string; p_user_id: string }
        Returns: undefined
      }
      claim_next_import_chunk: {
        Args: never
        Returns: {
          created_at: string | null
          erro: string | null
          id: string
          job_id: string | null
          payload: Json
          proxima_tentativa: string | null
          status: string
          tentativas: number | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "import_chunks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cleanup_import_data: { Args: never; Returns: undefined }
      cleanup_old_imports: { Args: never; Returns: undefined }
      fail_import_chunk: {
        Args: { p_chunk_id: string; p_erro: string }
        Returns: undefined
      }
      get_configuracoes_safe: {
        Args: never
        Returns: {
          chave: string
          created_at: string
          id: string
          updated_at: string
          valor: string
        }[]
      }
      get_import_errors: {
        Args: { p_job_id: string }
        Returns: {
          cnpj: string
          erro: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_job_progress: { Args: { p_job_id: string }; Returns: undefined }
      log_rpc_call: {
        Args: { p_function_name: string; p_status: string; p_user_id: string }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_campo: string
          p_hash: string
          p_origem: string
          p_user: string
        }
        Returns: undefined
      }
      resume_import_job: { Args: { p_job_id: string }; Returns: undefined }
      sms_deduct_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      cobranca_status: "pendente" | "pago" | "atrasado" | "cancelado"
      comissao_tipo: "venda" | "recorrencia"
      linha_status: "ativa" | "suspensa" | "cancelada"
      sms_status:
        | "pending"
        | "processing"
        | "sent"
        | "delivered"
        | "failed"
        | "blacklist"
      user_status: "ativo" | "inativo"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      cobranca_status: ["pendente", "pago", "atrasado", "cancelado"],
      comissao_tipo: ["venda", "recorrencia"],
      linha_status: ["ativa", "suspensa", "cancelada"],
      sms_status: [
        "pending",
        "processing",
        "sent",
        "delivered",
        "failed",
        "blacklist",
      ],
      user_status: ["ativo", "inativo"],
    },
  },
} as const
