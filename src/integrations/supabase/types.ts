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
      auditoria: {
        Row: {
          created_at: string | null
          dados_antes: Json | null
          dados_depois: Json | null
          id: string
          operacao: string
          tabela: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dados_antes?: Json | null
          dados_depois?: Json | null
          id?: string
          operacao: string
          tabela: string
          user_id?: string
        }
        Update: {
          created_at?: string | null
          dados_antes?: Json | null
          dados_depois?: Json | null
          id?: string
          operacao?: string
          tabela?: string
          user_id?: string
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
          plano_id: string | null
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
          plano_id?: string | null
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
          plano_id?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
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
      faturas: {
        Row: {
          cliente_id: string
          created_at: string
          id: string
          mes_referencia: string
          pago_em: string | null
          status: string
          user_id: string
          valor: number
        }
        Insert: {
          cliente_id: string
          created_at?: string
          id?: string
          mes_referencia: string
          pago_em?: string | null
          status?: string
          user_id?: string
          valor: number
        }
        Update: {
          cliente_id?: string
          created_at?: string
          id?: string
          mes_referencia?: string
          pago_em?: string | null
          status?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "faturas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
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
      leads: {
        Row: {
          created_at: string
          id: string
          nome: string
          status: string
          telefone: string
          ultimo_contato: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          status?: string
          telefone: string
          ultimo_contato?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          status?: string
          telefone?: string
          ultimo_contato?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      logs: {
        Row: {
          acao: string
          created_at: string | null
          detalhes: Json | null
          id: string
          user_id: string
        }
        Insert: {
          acao: string
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          user_id?: string
        }
        Update: {
          acao?: string
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      planos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          features: Json | null
          id: string
          nome: string
          valor: number
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          features?: Json | null
          id?: string
          nome: string
          valor: number
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          features?: Json | null
          id?: string
          nome?: string
          valor?: number
        }
        Relationships: []
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
      whatsapp_agents: {
        Row: {
          conectado: boolean | null
          created_at: string
          id: string
          limite_diario: number
          mensagens_enviadas_hoje: number
          next_billing_at: string | null
          nivel_aquecimento: number
          numero_whatsapp: string
          qr_code: string | null
          session_id: string | null
          status: string
          status_conexao:
            | Database["public"]["Enums"]["whatsapp_connection_status"]
            | null
          subscription_price: number | null
          ultima_atividade: string | null
          ultima_mensagem_em: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conectado?: boolean | null
          created_at?: string
          id?: string
          limite_diario?: number
          mensagens_enviadas_hoje?: number
          next_billing_at?: string | null
          nivel_aquecimento?: number
          numero_whatsapp: string
          qr_code?: string | null
          session_id?: string | null
          status?: string
          status_conexao?:
            | Database["public"]["Enums"]["whatsapp_connection_status"]
            | null
          subscription_price?: number | null
          ultima_atividade?: string | null
          ultima_mensagem_em?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conectado?: boolean | null
          created_at?: string
          id?: string
          limite_diario?: number
          mensagens_enviadas_hoje?: number
          next_billing_at?: string | null
          nivel_aquecimento?: number
          numero_whatsapp?: string
          qr_code?: string | null
          session_id?: string | null
          status?: string
          status_conexao?:
            | Database["public"]["Enums"]["whatsapp_connection_status"]
            | null
          subscription_price?: number | null
          ultima_atividade?: string | null
          ultima_mensagem_em?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_alerts: {
        Row: {
          alert_name: string
          created_at: string | null
          id: string
          message: string
          metrics_data: Json | null
          resolved_at: string | null
          sample_sessions: string[] | null
          severity: string
        }
        Insert: {
          alert_name: string
          created_at?: string | null
          id?: string
          message: string
          metrics_data?: Json | null
          resolved_at?: string | null
          sample_sessions?: string[] | null
          severity: string
        }
        Update: {
          alert_name?: string
          created_at?: string | null
          id?: string
          message?: string
          metrics_data?: Json | null
          resolved_at?: string | null
          sample_sessions?: string[] | null
          severity?: string
        }
        Relationships: []
      }
      whatsapp_audit_logs: {
        Row: {
          agent_id: string | null
          backend_reason: string | null
          duration_ms: number | null
          environment: string | null
          error_code: string | null
          error_message: string | null
          event: string
          id: string
          level: string
          metadata: Json | null
          request_id: string | null
          session_id: string | null
          status: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          agent_id?: string | null
          backend_reason?: string | null
          duration_ms?: number | null
          environment?: string | null
          error_code?: string | null
          error_message?: string | null
          event: string
          id?: string
          level: string
          metadata?: Json | null
          request_id?: string | null
          session_id?: string | null
          status?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          agent_id?: string | null
          backend_reason?: string | null
          duration_ms?: number | null
          environment?: string | null
          error_code?: string | null
          error_message?: string | null
          event?: string
          id?: string
          level?: string
          metadata?: Json | null
          request_id?: string | null
          session_id?: string | null
          status?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      whatsapp_campaigns: {
        Row: {
          created_at: string
          id: string
          nome: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_config: {
        Row: {
          created_at: string
          delay_max: number
          delay_min: number
          horario_fim: string
          horario_inicio: string
          id: string
          prompt_ia: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delay_max?: number
          delay_min?: number
          horario_fim?: string
          horario_inicio?: string
          id?: string
          prompt_ia?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delay_max?: number
          delay_min?: number
          horario_fim?: string
          horario_inicio?: string
          id?: string
          prompt_ia?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_global_sends: {
        Row: {
          last_sent_at: string | null
          phone: string
        }
        Insert: {
          last_sent_at?: string | null
          phone: string
        }
        Update: {
          last_sent_at?: string | null
          phone?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          agente_id: string | null
          created_at: string
          direcao: string
          ia_resposta: boolean | null
          id: string
          lead_id: string
          mensagem: string
          status: string
        }
        Insert: {
          agente_id?: string | null
          created_at?: string
          direcao: string
          ia_resposta?: boolean | null
          id?: string
          lead_id: string
          mensagem: string
          status?: string
        }
        Update: {
          agente_id?: string | null
          created_at?: string
          direcao?: string
          ia_resposta?: boolean | null
          id?: string
          lead_id?: string
          mensagem?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_agente_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_metrics: {
        Row: {
          dimensions: Json | null
          id: string
          metric_name: string
          metric_value: number
          timestamp: string | null
        }
        Insert: {
          dimensions?: Json | null
          id?: string
          metric_name: string
          metric_value?: number
          timestamp?: string | null
        }
        Update: {
          dimensions?: Json | null
          id?: string
          metric_name?: string
          metric_value?: number
          timestamp?: string | null
        }
        Relationships: []
      }
      whatsapp_number_stats: {
        Row: {
          agent_id: string | null
          created_at: string | null
          daily_volume_limit: number | null
          id: string
          last_recalculation_at: string | null
          safety_status: string | null
          total_errors: number | null
          total_replies: number | null
          total_sent: number | null
          warming_level: number | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          daily_volume_limit?: number | null
          id?: string
          last_recalculation_at?: string | null
          safety_status?: string | null
          total_errors?: number | null
          total_replies?: number | null
          total_sent?: number | null
          warming_level?: number | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          daily_volume_limit?: number | null
          id?: string
          last_recalculation_at?: string | null
          safety_status?: string | null
          total_errors?: number | null
          total_replies?: number | null
          total_sent?: number | null
          warming_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_number_stats_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_queue: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          payload: Json
          scheduled_for: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          payload: Json
          scheduled_for?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          payload?: Json
          scheduled_for?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_sessions: {
        Row: {
          agent_id: string | null
          id: string
          key_id: string | null
          updated_at: string | null
          value: Json
        }
        Insert: {
          agent_id?: string | null
          id?: string
          key_id?: string | null
          updated_at?: string | null
          value: Json
        }
        Update: {
          agent_id?: string | null
          id?: string
          key_id?: string | null
          updated_at?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_sessions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_agents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_next_day_volume: {
        Args: { current_level: number; error_rate: number; reply_rate: number }
        Returns: number
      }
      cancel_import_job: { Args: { p_job_id: string }; Returns: undefined }
      check_and_register_whatsapp_send: {
        Args: { target_phone: string }
        Returns: boolean
      }
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
      registrar_fatura_idempotente: {
        Args: {
          p_cliente_id: string
          p_mes: string
          p_user_id: string
          p_valor: number
        }
        Returns: boolean
      }
      resume_import_job: { Args: { p_job_id: string }; Returns: undefined }
      sms_claim_messages: {
        Args: { p_limit?: number }
        Returns: {
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
        }[]
        SetofOptions: {
          from: "*"
          to: "sms_messages"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sms_deduct_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: boolean
      }
      sms_trigger_campaign: {
        Args: { p_campaign_id: string }
        Returns: undefined
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
      whatsapp_connection_status:
        | "qr"
        | "conectado"
        | "desconectado"
        | "iniciando"
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
      whatsapp_connection_status: [
        "qr",
        "conectado",
        "desconectado",
        "iniciando",
      ],
    },
  },
} as const
