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
      admin_alertas_fraude: {
        Row: {
          created_at: string | null
          detalhes: Json | null
          id: string
          resolvido: boolean | null
          score_risco: number | null
          tipo: string
          user_ids: string[]
        }
        Insert: {
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          resolvido?: boolean | null
          score_risco?: number | null
          tipo: string
          user_ids: string[]
        }
        Update: {
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          resolvido?: boolean | null
          score_risco?: number | null
          tipo?: string
          user_ids?: string[]
        }
        Relationships: []
      }
      admin_alerts: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          message: string | null
          resolved: boolean | null
          severity: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          resolved?: boolean | null
          severity?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          resolved?: boolean | null
          severity?: string | null
          title?: string
        }
        Relationships: []
      }
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
      assinaturas: {
        Row: {
          cliente_id: string
          criado_em: string
          data_proxima_cobranca: string | null
          data_vencimento: string | null
          id: string
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          valor: number | null
        }
        Insert: {
          cliente_id: string
          criado_em?: string
          data_proxima_cobranca?: string | null
          data_vencimento?: string | null
          id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          valor?: number | null
        }
        Update: {
          cliente_id?: string
          criado_em?: string
          data_proxima_cobranca?: string | null
          data_vencimento?: string | null
          id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria: {
        Row: {
          created_at: string | null
          dados_antes: Json | null
          dados_depois: Json | null
          id: string
          operacao: string
          origem: string | null
          tabela: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dados_antes?: Json | null
          dados_depois?: Json | null
          id?: string
          operacao: string
          origem?: string | null
          tabela: string
          user_id?: string
        }
        Update: {
          created_at?: string | null
          dados_antes?: Json | null
          dados_depois?: Json | null
          id?: string
          operacao?: string
          origem?: string | null
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
          notify_whatsapp: boolean | null
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
          notify_whatsapp?: boolean | null
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
          notify_whatsapp?: boolean | null
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
      comissoes_mensais: {
        Row: {
          clientes_diretos_ativos: number | null
          clientes_indiretos_ativos: number | null
          criado_em: string
          id: string
          mes_referencia: string
          representante_id: string
          status: string | null
          updated_at: string
          valor_ativacoes: number | null
          valor_bonus: number | null
          valor_recorrencia_direta: number | null
          valor_recorrencia_indireta: number | null
          valor_total: number
        }
        Insert: {
          clientes_diretos_ativos?: number | null
          clientes_indiretos_ativos?: number | null
          criado_em?: string
          id?: string
          mes_referencia: string
          representante_id: string
          status?: string | null
          updated_at?: string
          valor_ativacoes?: number | null
          valor_bonus?: number | null
          valor_recorrencia_direta?: number | null
          valor_recorrencia_indireta?: number | null
          valor_total?: number
        }
        Update: {
          clientes_diretos_ativos?: number | null
          clientes_indiretos_ativos?: number | null
          criado_em?: string
          id?: string
          mes_referencia?: string
          representante_id?: string
          status?: string | null
          updated_at?: string
          valor_ativacoes?: number | null
          valor_bonus?: number | null
          valor_recorrencia_direta?: number | null
          valor_recorrencia_indireta?: number | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_mensais_representante_id_fkey"
            columns: ["representante_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          paid_at: string | null
          profile_id: string | null
          reference_id: string | null
          status: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          paid_at?: string | null
          profile_id?: string | null
          reference_id?: string | null
          status?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          paid_at?: string | null
          profile_id?: string | null
          reference_id?: string | null
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      dados_bancarios: {
        Row: {
          chave_pix: string
          created_at: string | null
          historico_alteracoes: Json | null
          id: string
          tipo_chave: string
          titular_cpf: string
          titular_nome: string
          updated_at: string | null
          user_id: string
          verificado: boolean | null
        }
        Insert: {
          chave_pix: string
          created_at?: string | null
          historico_alteracoes?: Json | null
          id?: string
          tipo_chave: string
          titular_cpf: string
          titular_nome: string
          updated_at?: string | null
          user_id: string
          verificado?: boolean | null
        }
        Update: {
          chave_pix?: string
          created_at?: string | null
          historico_alteracoes?: Json | null
          id?: string
          tipo_chave?: string
          titular_cpf?: string
          titular_nome?: string
          updated_at?: string | null
          user_id?: string
          verificado?: boolean | null
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
      fingerprints_login: {
        Row: {
          created_at: string | null
          fingerprint_hash: string | null
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          fingerprint_hash?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          fingerprint_hash?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fraud_alerts: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          is_resolved: boolean | null
          profile_id: string | null
          score_impact: number | null
          severity: string
          type: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          is_resolved?: boolean | null
          profile_id?: string | null
          score_impact?: number | null
          severity: string
          type: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          is_resolved?: boolean | null
          profile_id?: string | null
          score_impact?: number | null
          severity?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_alerts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      indicacoes: {
        Row: {
          created_at: string | null
          id: string
          indicado_user_id: string
          indicador_user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          indicado_user_id: string
          indicador_user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          indicado_user_id?: string
          indicador_user_id?: string
        }
        Relationships: []
      }
      itens_comissao: {
        Row: {
          cliente_id: string | null
          comissao_id: string | null
          criado_em: string
          id: string
          mes_referencia: string
          representante_id: string
          tipo: string
          valor: number
        }
        Insert: {
          cliente_id?: string | null
          comissao_id?: string | null
          criado_em?: string
          id?: string
          mes_referencia: string
          representante_id: string
          tipo: string
          valor?: number
        }
        Update: {
          cliente_id?: string | null
          comissao_id?: string | null
          criado_em?: string
          id?: string
          mes_referencia?: string
          representante_id?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_comissao_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_comissao_comissao_id_fkey"
            columns: ["comissao_id"]
            isOneToOne: false
            referencedRelation: "comissoes_mensais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_comissao_representante_id_fkey"
            columns: ["representante_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
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
      master_permissions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      master_projections_history: {
        Row: {
          actual_revenue: number | null
          created_at: string | null
          estimated_profit: number | null
          id: string
          month_year: string
          projected_churn: number | null
          projected_expansion_rate: number | null
          projected_revenue: number | null
        }
        Insert: {
          actual_revenue?: number | null
          created_at?: string | null
          estimated_profit?: number | null
          id?: string
          month_year: string
          projected_churn?: number | null
          projected_expansion_rate?: number | null
          projected_revenue?: number | null
        }
        Update: {
          actual_revenue?: number | null
          created_at?: string | null
          estimated_profit?: number | null
          id?: string
          month_year?: string
          projected_churn?: number | null
          projected_expansion_rate?: number | null
          projected_revenue?: number | null
        }
        Relationships: []
      }
      master_system_health: {
        Row: {
          active_workers: number | null
          created_at: string | null
          error_rate_24h: number | null
          id: string
          online_whatsapp_instances: number | null
          status: string
          uptime_percentage: number | null
        }
        Insert: {
          active_workers?: number | null
          created_at?: string | null
          error_rate_24h?: number | null
          id?: string
          online_whatsapp_instances?: number | null
          status: string
          uptime_percentage?: number | null
        }
        Update: {
          active_workers?: number | null
          created_at?: string | null
          error_rate_24h?: number | null
          id?: string
          online_whatsapp_instances?: number | null
          status?: string
          uptime_percentage?: number | null
        }
        Relationships: []
      }
      notificacoes: {
        Row: {
          canal: string
          cliente_id: string
          enviado_em: string
          id: string
          mensagem: string
          status: string
          tipo: string
          user_id: string
        }
        Insert: {
          canal?: string
          cliente_id: string
          enviado_em?: string
          id?: string
          mensagem: string
          status: string
          tipo: string
          user_id?: string
        }
        Update: {
          canal?: string
          cliente_id?: string
          enviado_em?: string
          id?: string
          mensagem?: string
          status?: string
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes_enviadas: {
        Row: {
          cliente_id: string
          detalhes: string | null
          enviado_em: string | null
          id: string
          referencia_mes: string
          status: string
          tipo: string
        }
        Insert: {
          cliente_id: string
          detalhes?: string | null
          enviado_em?: string | null
          id?: string
          referencia_mes: string
          status: string
          tipo: string
        }
        Update: {
          cliente_id?: string
          detalhes?: string | null
          enviado_em?: string | null
          id?: string
          referencia_mes?: string
          status?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_enviadas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          assinatura_id: string
          cliente_id: string
          criado_em: string
          data_pagamento: string | null
          data_vencimento: string | null
          id: string
          status: string | null
          stripe_payment_id: string | null
          valor: number | null
        }
        Insert: {
          assinatura_id: string
          cliente_id: string
          criado_em?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          id?: string
          status?: string | null
          stripe_payment_id?: string | null
          valor?: number | null
        }
        Update: {
          assinatura_id?: string
          cliente_id?: string
          criado_em?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          id?: string
          status?: string | null
          stripe_payment_id?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "assinaturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
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
      profile_permissions: {
        Row: {
          permission_id: string
          profile_id: string
        }
        Insert: {
          permission_id: string
          profile_id: string
        }
        Update: {
          permission_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "master_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_permissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          is_blocked: boolean | null
          nome: string
          risk_score: number | null
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
          is_blocked?: boolean | null
          nome: string
          risk_score?: number | null
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
          is_blocked?: boolean | null
          nome?: string
          risk_score?: number | null
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
      saas_plans: {
        Row: {
          automation_limit: number
          commission_rate: number
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          lines_limit: number
          monthly_price: number
          name: string
          updated_at: string | null
          whatsapp_limit: number
        }
        Insert: {
          automation_limit?: number
          commission_rate?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          lines_limit?: number
          monthly_price?: number
          name: string
          updated_at?: string | null
          whatsapp_limit?: number
        }
        Update: {
          automation_limit?: number
          commission_rate?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          lines_limit?: number
          monthly_price?: number
          name?: string
          updated_at?: string | null
          whatsapp_limit?: number
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
      solicitacoes_saque: {
        Row: {
          comprovante_url: string | null
          dados_bancarios_id: string
          id: string
          motivo_rejeicao: string | null
          pago_em: string | null
          processado_em: string | null
          solicitado_em: string | null
          status: string
          user_id: string
          valor: number
          wallet_id: string
        }
        Insert: {
          comprovante_url?: string | null
          dados_bancarios_id: string
          id?: string
          motivo_rejeicao?: string | null
          pago_em?: string | null
          processado_em?: string | null
          solicitado_em?: string | null
          status?: string
          user_id: string
          valor: number
          wallet_id: string
        }
        Update: {
          comprovante_url?: string | null
          dados_bancarios_id?: string
          id?: string
          motivo_rejeicao?: string | null
          pago_em?: string | null
          processado_em?: string | null
          solicitado_em?: string | null
          status?: string
          user_id?: string
          valor?: number
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_saque_dados_bancarios_id_fkey"
            columns: ["dados_bancarios_id"]
            isOneToOne: false
            referencedRelation: "dados_bancarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_saque_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes_wallet: {
        Row: {
          created_at: string | null
          data_liberacao: string | null
          descricao: string | null
          id: string
          referencia_id: string | null
          status: string
          tipo: string
          valor: number
          wallet_id: string
        }
        Insert: {
          created_at?: string | null
          data_liberacao?: string | null
          descricao?: string | null
          id?: string
          referencia_id?: string | null
          status?: string
          tipo: string
          valor: number
          wallet_id: string
        }
        Update: {
          created_at?: string | null
          data_liberacao?: string | null
          descricao?: string | null
          id?: string
          referencia_id?: string | null
          status?: string
          tipo?: string
          valor?: number
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_wallet_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          profile_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          profile_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          profile_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          email: string | null
          id: string
          last_login: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          email?: string | null
          id: string
          last_login?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          email?: string | null
          id?: string
          last_login?: string | null
          role?: string | null
          updated_at?: string | null
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
      usuarios: {
        Row: {
          codigo_indicacao: string
          created_at: string
          email: string | null
          id: string
          indicado_por: string | null
          nome: string | null
          role: string | null
          status: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          codigo_indicacao?: string
          created_at?: string
          email?: string | null
          id: string
          indicado_por?: string | null
          nome?: string | null
          role?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          codigo_indicacao?: string
          created_at?: string
          email?: string | null
          id?: string
          indicado_por?: string | null
          nome?: string | null
          role?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_indicado_por_fkey"
            columns: ["indicado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          id: string
          saldo_a_liberar: number
          saldo_bloqueado: number
          saldo_disponivel: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          saldo_a_liberar?: number
          saldo_bloqueado?: number
          saldo_disponivel?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          saldo_a_liberar?: number
          saldo_bloqueado?: number
          saldo_disponivel?: number
          updated_at?: string | null
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
      whatsapp_logs: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          message_body: string | null
          status: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          message_body?: string | null
          status?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          message_body?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_logs_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
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
      whatsapp_templates: {
        Row: {
          body: string
          created_at: string | null
          id: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      admin_mrr_consolidado: {
        Row: {
          afiliado_email: string | null
          afiliado_id: string | null
          clientes_ativos: number | null
          clientes_inativos: number | null
          mrr_atual: number | null
          ultimo_acesso: string | null
        }
        Relationships: []
      }
      view_admin_alertas_fraude: {
        Row: {
          created_at: string | null
          detalhes: Json | null
          id: string | null
          resolvido: boolean | null
          score_risco: number | null
          tipo: string | null
          user_ids: string[] | null
        }
        Insert: {
          created_at?: string | null
          detalhes?: Json | null
          id?: string | null
          resolvido?: boolean | null
          score_risco?: number | null
          tipo?: string | null
          user_ids?: string[] | null
        }
        Update: {
          created_at?: string | null
          detalhes?: Json | null
          id?: string | null
          resolvido?: boolean | null
          score_risco?: number | null
          tipo?: string | null
          user_ids?: string[] | null
        }
        Relationships: []
      }
    }
    Functions: {
      aprovar_saque: { Args: { p_saque_id: string }; Returns: undefined }
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
      creditar_wallet: {
        Args: {
          p_dias_carencia?: number
          p_referencia_id: string
          p_tipo: string
          p_user_id: string
          p_valor: number
        }
        Returns: undefined
      }
      detectar_ciclo_indicacao: {
        Args: { p_indicado_id: string; p_indicador_id: string }
        Returns: boolean
      }
      fail_import_chunk: {
        Args: { p_chunk_id: string; p_erro: string }
        Returns: undefined
      }
      gerar_codigo_indicacao: { Args: never; Returns: string }
      get_commission_ranking: {
        Args: { limit_count?: number }
        Returns: {
          nome: string
          paid_commissions: number
          profile_id: string
          total_commissions: number
        }[]
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
      get_global_finance_metrics: { Args: never; Returns: Json }
      get_global_metrics: { Args: never; Returns: Json }
      get_import_errors: {
        Args: { p_job_id: string }
        Returns: {
          cnpj: string
          erro: string
        }[]
      }
      get_master_affiliates_report: {
        Args: never
        Returns: {
          affiliate_email: string
          affiliate_id: string
          affiliate_name: string
          churn_count: number
          churn_rate: number
          monthly_recurring: number
          overdue_count: number
          overdue_rate: number
          total_clients: number
          total_revenue: number
        }[]
      }
      get_master_audit_logs: {
        Args: {
          p_end_date?: string
          p_event_type?: string
          p_limit?: number
          p_start_date?: string
          p_user_id?: string
        }
        Returns: {
          actor_id: string
          actor_name: string
          event_message: string
          event_time: string
          event_type: string
          log_id: string
          metadata: Json
          target_id: string
        }[]
      }
      get_master_critical_alerts: {
        Args: never
        Returns: {
          category: string
          created_at: string
          description: string
          id: string
          is_resolved: boolean
          metadata: Json
          severity: string
          title: string
        }[]
      }
      get_master_gateways_report: {
        Args: never
        Returns: {
          active_subscriptions: number
          failed_count: number
          gateway_id: string
          gateway_name: string
          last_processed: string
          status: string
          success_rate: number
          volume_card: number
          volume_pix: number
          volume_total: number
          webhook_health: number
        }[]
      }
      get_master_lines_report: { Args: never; Returns: Json }
      get_master_whatsapp_report: { Args: never; Returns: Json }
      get_master_workers_report: { Args: never; Returns: Json }
      get_mrr_historico: {
        Args: { p_meses: number }
        Returns: {
          mes: string
          mrr_total: number
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
      is_master_admin: { Args: { _user_id: string }; Returns: boolean }
      liberar_transacao_wallet: {
        Args: { p_transacao_id: string; p_valor: number; p_wallet_id: string }
        Returns: undefined
      }
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
      app_role: "admin" | "user" | "master_admin"
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
      app_role: ["admin", "user", "master_admin"],
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
