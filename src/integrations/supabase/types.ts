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
      ai_agent_settings: {
        Row: {
          base_prompt: string
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_tokens: number | null
          model: string | null
          name: string
          temperature: number | null
          updated_at: string | null
        }
        Insert: {
          base_prompt: string
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model?: string | null
          name: string
          temperature?: number | null
          updated_at?: string | null
        }
        Update: {
          base_prompt?: string
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model?: string | null
          name?: string
          temperature?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_automation_logs: {
        Row: {
          action: string
          conversation_id: string | null
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          metadata: Json | null
          status: string
        }
        Insert: {
          action: string
          conversation_id?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          status: string
        }
        Update: {
          action?: string
          conversation_id?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_automation_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_context_embeddings: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          source_type: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          source_type?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          source_type?: string | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          external_id: string | null
          id: string
          last_message_at: string | null
          lead_id: string | null
          metadata: Json | null
          status: string | null
          updated_at: string | null
          whatsapp_instance_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          metadata?: Json | null
          status?: string | null
          updated_at?: string | null
          whatsapp_instance_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          metadata?: Json | null
          status?: string | null
          updated_at?: string | null
          whatsapp_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_whatsapp_instance_id_fkey"
            columns: ["whatsapp_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_lead_scores: {
        Row: {
          classification: string | null
          id: string
          last_update: string | null
          lead_id: string | null
          reasons: string[] | null
          score_value: number | null
        }
        Insert: {
          classification?: string | null
          id?: string
          last_update?: string | null
          lead_id?: string | null
          reasons?: string[] | null
          score_value?: number | null
        }
        Update: {
          classification?: string | null
          id?: string
          last_update?: string | null
          lead_id?: string | null
          reasons?: string[] | null
          score_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_lead_scores_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_memory: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          id: string
          importance_score: number | null
          instance_id: string | null
          key: string
          lead_id: string | null
          updated_at: string | null
          value: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          id?: string
          importance_score?: number | null
          instance_id?: string | null
          key: string
          lead_id?: string | null
          updated_at?: string | null
          value: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          id?: string
          importance_score?: number | null
          instance_id?: string | null
          key?: string
          lead_id?: string | null
          updated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_memory_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_memory_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_memory_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          agent_id: string | null
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          tokens: number | null
        }
        Insert: {
          agent_id?: string | null
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          tokens?: number | null
        }
        Update: {
          agent_id?: string | null
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          tokens?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agent_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompt_templates: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          template: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          template: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          template?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_token_usage: {
        Row: {
          completion_tokens: number | null
          conversation_id: string | null
          created_at: string | null
          estimated_cost: number | null
          id: string
          metadata: Json | null
          model: string
          prompt_tokens: number | null
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number | null
          conversation_id?: string | null
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          metadata?: Json | null
          model: string
          prompt_tokens?: number | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number | null
          conversation_id?: string | null
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          metadata?: Json | null
          model?: string
          prompt_tokens?: number | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_token_usage_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      anuncios: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string
          criado_por: string
          data_fim: string | null
          data_inicio: string | null
          dias_contratados: number | null
          id: string
          imagem_url: string | null
          link_destino: string | null
          motivo_rejeicao: string | null
          posicao: Database["public"]["Enums"]["anuncio_posicao"]
          status: Database["public"]["Enums"]["anuncio_status"]
          stripe_payment_id: string | null
          titulo: string
          updated_at: string
          valor_pago: number | null
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          criado_por: string
          data_fim?: string | null
          data_inicio?: string | null
          dias_contratados?: number | null
          id?: string
          imagem_url?: string | null
          link_destino?: string | null
          motivo_rejeicao?: string | null
          posicao: Database["public"]["Enums"]["anuncio_posicao"]
          status?: Database["public"]["Enums"]["anuncio_status"]
          stripe_payment_id?: string | null
          titulo: string
          updated_at?: string
          valor_pago?: number | null
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          criado_por?: string
          data_fim?: string | null
          data_inicio?: string | null
          dias_contratados?: number | null
          id?: string
          imagem_url?: string | null
          link_destino?: string | null
          motivo_rejeicao?: string | null
          posicao?: Database["public"]["Enums"]["anuncio_posicao"]
          status?: Database["public"]["Enums"]["anuncio_status"]
          stripe_payment_id?: string | null
          titulo?: string
          updated_at?: string
          valor_pago?: number | null
        }
        Relationships: []
      }
      anuncios_eventos: {
        Row: {
          anuncio_id: string
          created_at: string
          id: string
          tipo: string
          user_id: string | null
        }
        Insert: {
          anuncio_id: string
          created_at?: string
          id?: string
          tipo: string
          user_id?: string | null
        }
        Update: {
          anuncio_id?: string
          created_at?: string
          id?: string
          tipo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anuncios_eventos_anuncio_id_fkey"
            columns: ["anuncio_id"]
            isOneToOne: false
            referencedRelation: "anuncios"
            referencedColumns: ["id"]
          },
        ]
      }
      anuncios_precos: {
        Row: {
          ativo: boolean
          id: string
          posicao: Database["public"]["Enums"]["anuncio_posicao"]
          updated_at: string
          valor_por_dia: number
        }
        Insert: {
          ativo?: boolean
          id?: string
          posicao: Database["public"]["Enums"]["anuncio_posicao"]
          updated_at?: string
          valor_por_dia: number
        }
        Update: {
          ativo?: boolean
          id?: string
          posicao?: Database["public"]["Enums"]["anuncio_posicao"]
          updated_at?: string
          valor_por_dia?: number
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
          produto_id: string | null
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
          produto_id?: string | null
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
          produto_id?: string | null
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
          {
            foreignKeyName: "assinaturas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
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
      chip_estoque: {
        Row: {
          cliente_id: string | null
          created_at: string
          data_ativacao: string | null
          data_devolucao: string | null
          data_entrada: string | null
          data_envio: string | null
          data_recebimento: string | null
          data_reserva: string | null
          ddd: string | null
          iccid: string
          id: string
          lote_id: string | null
          numero_linha: string | null
          observacoes: string | null
          operadora: string
          prazo_entrega_dias: number
          produto_id: string | null
          representante_id: string | null
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          data_ativacao?: string | null
          data_devolucao?: string | null
          data_entrada?: string | null
          data_envio?: string | null
          data_recebimento?: string | null
          data_reserva?: string | null
          ddd?: string | null
          iccid: string
          id?: string
          lote_id?: string | null
          numero_linha?: string | null
          observacoes?: string | null
          operadora?: string
          prazo_entrega_dias?: number
          produto_id?: string | null
          representante_id?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          data_ativacao?: string | null
          data_devolucao?: string | null
          data_entrada?: string | null
          data_envio?: string | null
          data_recebimento?: string | null
          data_reserva?: string | null
          ddd?: string | null
          iccid?: string
          id?: string
          lote_id?: string | null
          numero_linha?: string | null
          observacoes?: string | null
          operadora?: string
          prazo_entrega_dias?: number
          produto_id?: string | null
          representante_id?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chip_estoque_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "chip_lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chip_estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      chip_kit_itens: {
        Row: {
          chip_id: string
          created_at: string
          id: string
          kit_id: string
          representante_id: string
          status: string
          updated_at: string
        }
        Insert: {
          chip_id: string
          created_at?: string
          id?: string
          kit_id: string
          representante_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          chip_id?: string
          created_at?: string
          id?: string
          kit_id?: string
          representante_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chip_kit_itens_chip_id_fkey"
            columns: ["chip_id"]
            isOneToOne: true
            referencedRelation: "chip_estoque"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chip_kit_itens_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "chip_kits_representante"
            referencedColumns: ["id"]
          },
        ]
      }
      chip_kits_representante: {
        Row: {
          aprovado_por: string | null
          codigo_rastreio: string | null
          created_at: string
          data_aprovacao: string | null
          data_envio: string | null
          data_recebimento: string | null
          data_solicitacao: string | null
          endereco_entrega: string | null
          id: string
          motivo_bloqueio: string | null
          observacoes: string | null
          operadora_prioritaria: string
          quantidade_enviada: number
          quantidade_prevista: number
          representante_id: string
          status: string
          tipo_kit: string
          updated_at: string
        }
        Insert: {
          aprovado_por?: string | null
          codigo_rastreio?: string | null
          created_at?: string
          data_aprovacao?: string | null
          data_envio?: string | null
          data_recebimento?: string | null
          data_solicitacao?: string | null
          endereco_entrega?: string | null
          id?: string
          motivo_bloqueio?: string | null
          observacoes?: string | null
          operadora_prioritaria?: string
          quantidade_enviada?: number
          quantidade_prevista?: number
          representante_id: string
          status?: string
          tipo_kit?: string
          updated_at?: string
        }
        Update: {
          aprovado_por?: string | null
          codigo_rastreio?: string | null
          created_at?: string
          data_aprovacao?: string | null
          data_envio?: string | null
          data_recebimento?: string | null
          data_solicitacao?: string | null
          endereco_entrega?: string | null
          id?: string
          motivo_bloqueio?: string | null
          observacoes?: string | null
          operadora_prioritaria?: string
          quantidade_enviada?: number
          quantidade_prevista?: number
          representante_id?: string
          status?: string
          tipo_kit?: string
          updated_at?: string
        }
        Relationships: []
      }
      chip_lotes: {
        Row: {
          created_at: string
          data_recebimento: string | null
          id: string
          nome: string
          observacoes: string | null
          operadora: string
          quantidade_disponivel: number
          quantidade_total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_recebimento?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          operadora?: string
          quantidade_disponivel?: number
          quantidade_total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_recebimento?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          operadora?: string
          quantidade_disponivel?: number
          quantidade_total?: number
          updated_at?: string
        }
        Relationships: []
      }
      chip_movimentacoes: {
        Row: {
          chip_id: string
          cliente_id: string | null
          created_at: string
          criado_por: string | null
          descricao: string | null
          id: string
          representante_id: string | null
          status_anterior: string | null
          status_novo: string | null
          tipo_movimentacao: string
        }
        Insert: {
          chip_id: string
          cliente_id?: string | null
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          id?: string
          representante_id?: string | null
          status_anterior?: string | null
          status_novo?: string | null
          tipo_movimentacao: string
        }
        Update: {
          chip_id?: string
          cliente_id?: string | null
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          id?: string
          representante_id?: string | null
          status_anterior?: string | null
          status_novo?: string | null
          tipo_movimentacao?: string
        }
        Relationships: [
          {
            foreignKeyName: "chip_movimentacoes_chip_id_fkey"
            columns: ["chip_id"]
            isOneToOne: false
            referencedRelation: "chip_estoque"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "saas_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      comissoes_mensais: {
        Row: {
          clientes_diretos_ativos: number | null
          clientes_indiretos_ativos: number | null
          criado_em: string
          data_pagamento: string | null
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
          data_pagamento?: string | null
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
          data_pagamento?: string | null
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
          {
            foreignKeyName: "fk_comissoes_mensais_representante_profile"
            columns: ["representante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      config_comissoes: {
        Row: {
          chave: string
          updated_at: string
          valor: number
        }
        Insert: {
          chave: string
          updated_at?: string
          valor: number
        }
        Update: {
          chave?: string
          updated_at?: string
          valor?: number
        }
        Relationships: []
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
      crm_interactions: {
        Row: {
          created_at: string
          descricao: string
          id: string
          lead_id: string
          tipo: Database["public"]["Enums"]["crm_interaction_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          lead_id: string
          tipo?: Database["public"]["Enums"]["crm_interaction_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          lead_id?: string
          tipo?: Database["public"]["Enums"]["crm_interaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          cliente_id: string | null
          comissao_ativacao_estimada: number | null
          comissao_recorrente_estimada: number | null
          convertido_em: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          observacao: string | null
          origem: string | null
          proximo_contato_em: string | null
          status: Database["public"]["Enums"]["crm_lead_status"]
          telefone: string | null
          updated_at: string
          user_id: string
          valor_mensal_estimado: number | null
        }
        Insert: {
          cliente_id?: string | null
          comissao_ativacao_estimada?: number | null
          comissao_recorrente_estimada?: number | null
          convertido_em?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          observacao?: string | null
          origem?: string | null
          proximo_contato_em?: string | null
          status?: Database["public"]["Enums"]["crm_lead_status"]
          telefone?: string | null
          updated_at?: string
          user_id: string
          valor_mensal_estimado?: number | null
        }
        Update: {
          cliente_id?: string | null
          comissao_ativacao_estimada?: number | null
          comissao_recorrente_estimada?: number | null
          convertido_em?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          observacao?: string | null
          origem?: string | null
          proximo_contato_em?: string | null
          status?: Database["public"]["Enums"]["crm_lead_status"]
          telefone?: string | null
          updated_at?: string
          user_id?: string
          valor_mensal_estimado?: number | null
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
      import_heartbeats: {
        Row: {
          active_jobs: string[] | null
          last_ping: string | null
          worker_id: string
        }
        Insert: {
          active_jobs?: string[] | null
          last_ping?: string | null
          worker_id?: string
        }
        Update: {
          active_jobs?: string[] | null
          last_ping?: string | null
          worker_id?: string
        }
        Relationships: []
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
          produto_id: string | null
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
          produto_id?: string | null
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
          produto_id?: string | null
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
            foreignKeyName: "itens_comissao_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
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
      mvni_lancamentos_financeiros: {
        Row: {
          cliente_id: string | null
          created_at: string
          descricao: string | null
          direcao: Database["public"]["Enums"]["mvni_lancamento_direcao"]
          id: string
          linha_id: string | null
          mes_referencia: string
          metadata: Json | null
          operadora_id: string | null
          representante_id: string | null
          tipo: Database["public"]["Enums"]["mvni_lancamento_tipo"]
          valor: number
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          descricao?: string | null
          direcao: Database["public"]["Enums"]["mvni_lancamento_direcao"]
          id?: string
          linha_id?: string | null
          mes_referencia: string
          metadata?: Json | null
          operadora_id?: string | null
          representante_id?: string | null
          tipo: Database["public"]["Enums"]["mvni_lancamento_tipo"]
          valor: number
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          descricao?: string | null
          direcao?: Database["public"]["Enums"]["mvni_lancamento_direcao"]
          id?: string
          linha_id?: string | null
          mes_referencia?: string
          metadata?: Json | null
          operadora_id?: string | null
          representante_id?: string | null
          tipo?: Database["public"]["Enums"]["mvni_lancamento_tipo"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "mvni_lancamentos_financeiros_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mvni_lancamentos_financeiros_linha_id_fkey"
            columns: ["linha_id"]
            isOneToOne: false
            referencedRelation: "mvno_linhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mvni_lancamentos_financeiros_operadora_id_fkey"
            columns: ["operadora_id"]
            isOneToOne: false
            referencedRelation: "operadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      mvni_receitas_operadoras: {
        Row: {
          cliente_id: string | null
          created_at: string
          data_recebimento: string | null
          id: string
          lancamento_financeiro_id: string | null
          linha_id: string | null
          mes_referencia: string
          operadora_id: string
          status: string
          updated_at: string
          valor_recebido: number
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          data_recebimento?: string | null
          id?: string
          lancamento_financeiro_id?: string | null
          linha_id?: string | null
          mes_referencia: string
          operadora_id: string
          status?: string
          updated_at?: string
          valor_recebido: number
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          data_recebimento?: string | null
          id?: string
          lancamento_financeiro_id?: string | null
          linha_id?: string | null
          mes_referencia?: string
          operadora_id?: string
          status?: string
          updated_at?: string
          valor_recebido?: number
        }
        Relationships: [
          {
            foreignKeyName: "mvni_receitas_operadoras_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mvni_receitas_operadoras_lancamento_financeiro_id_fkey"
            columns: ["lancamento_financeiro_id"]
            isOneToOne: false
            referencedRelation: "mvni_lancamentos_financeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mvni_receitas_operadoras_linha_id_fkey"
            columns: ["linha_id"]
            isOneToOne: false
            referencedRelation: "mvno_linhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mvni_receitas_operadoras_operadora_id_fkey"
            columns: ["operadora_id"]
            isOneToOne: false
            referencedRelation: "operadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      mvno_audit_logs: {
        Row: {
          acao: string
          actor_id: string | null
          antes: Json | null
          created_at: string
          depois: Json | null
          entidade: string
          entidade_id: string | null
          id: string
          ip: string | null
          tenant_id: string | null
          user_agent: string | null
        }
        Insert: {
          acao: string
          actor_id?: string | null
          antes?: Json | null
          created_at?: string
          depois?: Json | null
          entidade: string
          entidade_id?: string | null
          id?: string
          ip?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Update: {
          acao?: string
          actor_id?: string | null
          antes?: Json | null
          created_at?: string
          depois?: Json | null
          entidade?: string
          entidade_id?: string | null
          id?: string
          ip?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      mvno_consumos: {
        Row: {
          competencia: string
          created_at: string
          dados_mb: number
          id: string
          linha_id: string
          metadata: Json
          minutos_qtd: number
          roaming_mb: number
          sms_qtd: number
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          competencia: string
          created_at?: string
          dados_mb?: number
          id?: string
          linha_id: string
          metadata?: Json
          minutos_qtd?: number
          roaming_mb?: number
          sms_qtd?: number
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          competencia?: string
          created_at?: string
          dados_mb?: number
          id?: string
          linha_id?: string
          metadata?: Json
          minutos_qtd?: number
          roaming_mb?: number
          sms_qtd?: number
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mvno_consumos_linha_id_fkey"
            columns: ["linha_id"]
            isOneToOne: false
            referencedRelation: "mvno_linhas"
            referencedColumns: ["id"]
          },
        ]
      }
      mvno_fatura_itens: {
        Row: {
          categoria: Database["public"]["Enums"]["mvno_item_categoria"]
          created_at: string
          descricao: string
          fatura_id: string
          id: string
          metadata: Json
          quantidade: number
          valor_total: number
          valor_unit: number
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["mvno_item_categoria"]
          created_at?: string
          descricao: string
          fatura_id: string
          id?: string
          metadata?: Json
          quantidade?: number
          valor_total?: number
          valor_unit?: number
        }
        Update: {
          categoria?: Database["public"]["Enums"]["mvno_item_categoria"]
          created_at?: string
          descricao?: string
          fatura_id?: string
          id?: string
          metadata?: Json
          quantidade?: number
          valor_total?: number
          valor_unit?: number
        }
        Relationships: [
          {
            foreignKeyName: "mvno_fatura_itens_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "mvno_faturas"
            referencedColumns: ["id"]
          },
        ]
      }
      mvno_faturas: {
        Row: {
          cliente_id: string | null
          competencia: string
          created_at: string
          id: string
          linha_id: string
          metadata: Json
          pago_em: string | null
          pdf_path: string | null
          status: Database["public"]["Enums"]["mvno_fatura_status"]
          tenant_id: string | null
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          cliente_id?: string | null
          competencia: string
          created_at?: string
          id?: string
          linha_id: string
          metadata?: Json
          pago_em?: string | null
          pdf_path?: string | null
          status?: Database["public"]["Enums"]["mvno_fatura_status"]
          tenant_id?: string | null
          updated_at?: string
          valor?: number
          vencimento: string
        }
        Update: {
          cliente_id?: string | null
          competencia?: string
          created_at?: string
          id?: string
          linha_id?: string
          metadata?: Json
          pago_em?: string | null
          pdf_path?: string | null
          status?: Database["public"]["Enums"]["mvno_fatura_status"]
          tenant_id?: string | null
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "mvno_faturas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mvno_faturas_linha_id_fkey"
            columns: ["linha_id"]
            isOneToOne: false
            referencedRelation: "mvno_linhas"
            referencedColumns: ["id"]
          },
        ]
      }
      mvno_linha_historico: {
        Row: {
          actor_id: string | null
          created_at: string
          descricao: string | null
          evento: Database["public"]["Enums"]["mvno_evento_tipo"]
          id: string
          linha_id: string
          metadata: Json
          tenant_id: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          descricao?: string | null
          evento: Database["public"]["Enums"]["mvno_evento_tipo"]
          id?: string
          linha_id: string
          metadata?: Json
          tenant_id?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          descricao?: string | null
          evento?: Database["public"]["Enums"]["mvno_evento_tipo"]
          id?: string
          linha_id?: string
          metadata?: Json
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mvno_linha_historico_linha_id_fkey"
            columns: ["linha_id"]
            isOneToOne: false
            referencedRelation: "mvno_linhas"
            referencedColumns: ["id"]
          },
        ]
      }
      mvno_linhas: {
        Row: {
          ativada_em: string | null
          chip_estoque_id: string | null
          cliente_id: string | null
          created_at: string
          iccid: string | null
          id: string
          imsi: string | null
          metadata: Json
          numero: string | null
          observacoes: string | null
          operadora_id: string | null
          plano_id: string | null
          proximo_vencimento: string | null
          status: Database["public"]["Enums"]["mvno_linha_status"]
          tenant_id: string | null
          updated_at: string
          user_id: string | null
          valor_mensal: number
        }
        Insert: {
          ativada_em?: string | null
          chip_estoque_id?: string | null
          cliente_id?: string | null
          created_at?: string
          iccid?: string | null
          id?: string
          imsi?: string | null
          metadata?: Json
          numero?: string | null
          observacoes?: string | null
          operadora_id?: string | null
          plano_id?: string | null
          proximo_vencimento?: string | null
          status?: Database["public"]["Enums"]["mvno_linha_status"]
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
          valor_mensal?: number
        }
        Update: {
          ativada_em?: string | null
          chip_estoque_id?: string | null
          cliente_id?: string | null
          created_at?: string
          iccid?: string | null
          id?: string
          imsi?: string | null
          metadata?: Json
          numero?: string | null
          observacoes?: string | null
          operadora_id?: string | null
          plano_id?: string | null
          proximo_vencimento?: string | null
          status?: Database["public"]["Enums"]["mvno_linha_status"]
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
          valor_mensal?: number
        }
        Relationships: [
          {
            foreignKeyName: "mvno_linhas_chip_estoque_id_fkey"
            columns: ["chip_estoque_id"]
            isOneToOne: false
            referencedRelation: "chip_estoque"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mvno_linhas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mvno_linhas_operadora_id_fkey"
            columns: ["operadora_id"]
            isOneToOne: false
            referencedRelation: "operadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mvno_linhas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos_mvno"
            referencedColumns: ["id"]
          },
        ]
      }
      mvno_pagamentos: {
        Row: {
          cliente_id: string | null
          created_at: string
          expires_at: string | null
          fatura_id: string
          gateway: string | null
          gateway_status: string | null
          gateway_transaction_id: string | null
          id: string
          linha_id: string | null
          metadata: Json
          paid_at: string | null
          payload: Json | null
          pix_copia_e_cola: string | null
          pix_qr_code_base64: string | null
          processed_at: string | null
          provider: string
          provider_intent_id: string | null
          status: Database["public"]["Enums"]["mvno_pagamento_status"]
          updated_at: string
          valor: number
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          expires_at?: string | null
          fatura_id: string
          gateway?: string | null
          gateway_status?: string | null
          gateway_transaction_id?: string | null
          id?: string
          linha_id?: string | null
          metadata?: Json
          paid_at?: string | null
          payload?: Json | null
          pix_copia_e_cola?: string | null
          pix_qr_code_base64?: string | null
          processed_at?: string | null
          provider?: string
          provider_intent_id?: string | null
          status?: Database["public"]["Enums"]["mvno_pagamento_status"]
          updated_at?: string
          valor: number
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          expires_at?: string | null
          fatura_id?: string
          gateway?: string | null
          gateway_status?: string | null
          gateway_transaction_id?: string | null
          id?: string
          linha_id?: string | null
          metadata?: Json
          paid_at?: string | null
          payload?: Json | null
          pix_copia_e_cola?: string | null
          pix_qr_code_base64?: string | null
          processed_at?: string | null
          provider?: string
          provider_intent_id?: string | null
          status?: Database["public"]["Enums"]["mvno_pagamento_status"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "mvno_pagamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mvno_pagamentos_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "mvno_faturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mvno_pagamentos_linha_id_fkey"
            columns: ["linha_id"]
            isOneToOne: false
            referencedRelation: "mvno_linhas"
            referencedColumns: ["id"]
          },
        ]
      }
      mvno_parser_jobs: {
        Row: {
          created_at: string
          erro: string | null
          finalizado_em: string | null
          id: string
          iniciado_em: string | null
          resultado: Json
          status: Database["public"]["Enums"]["mvno_parser_status"]
          tenant_id: string | null
          tipo: Database["public"]["Enums"]["mvno_parser_tipo"]
          updated_at: string
          upload_id: string
        }
        Insert: {
          created_at?: string
          erro?: string | null
          finalizado_em?: string | null
          id?: string
          iniciado_em?: string | null
          resultado?: Json
          status?: Database["public"]["Enums"]["mvno_parser_status"]
          tenant_id?: string | null
          tipo: Database["public"]["Enums"]["mvno_parser_tipo"]
          updated_at?: string
          upload_id: string
        }
        Update: {
          created_at?: string
          erro?: string | null
          finalizado_em?: string | null
          id?: string
          iniciado_em?: string | null
          resultado?: Json
          status?: Database["public"]["Enums"]["mvno_parser_status"]
          tenant_id?: string | null
          tipo?: Database["public"]["Enums"]["mvno_parser_tipo"]
          updated_at?: string
          upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mvno_parser_jobs_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "mvno_uploads_faturas"
            referencedColumns: ["id"]
          },
        ]
      }
      mvno_parser_logs: {
        Row: {
          contexto: Json
          created_at: string
          id: string
          job_id: string
          mensagem: string
          nivel: string
        }
        Insert: {
          contexto?: Json
          created_at?: string
          id?: string
          job_id: string
          mensagem: string
          nivel?: string
        }
        Update: {
          contexto?: Json
          created_at?: string
          id?: string
          job_id?: string
          mensagem?: string
          nivel?: string
        }
        Relationships: [
          {
            foreignKeyName: "mvno_parser_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "mvno_parser_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      mvno_uploads_faturas: {
        Row: {
          arquivo_path: string
          competencia: string
          created_at: string
          erros_count: number
          id: string
          mime: string | null
          observacoes: string | null
          operadora_id: string | null
          processadas: number
          size_bytes: number | null
          status: Database["public"]["Enums"]["mvno_parser_status"]
          tenant_id: string | null
          total_linhas: number
          updated_at: string
          uploader_id: string | null
        }
        Insert: {
          arquivo_path: string
          competencia: string
          created_at?: string
          erros_count?: number
          id?: string
          mime?: string | null
          observacoes?: string | null
          operadora_id?: string | null
          processadas?: number
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["mvno_parser_status"]
          tenant_id?: string | null
          total_linhas?: number
          updated_at?: string
          uploader_id?: string | null
        }
        Update: {
          arquivo_path?: string
          competencia?: string
          created_at?: string
          erros_count?: number
          id?: string
          mime?: string | null
          observacoes?: string | null
          operadora_id?: string | null
          processadas?: number
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["mvno_parser_status"]
          tenant_id?: string | null
          total_linhas?: number
          updated_at?: string
          uploader_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mvno_uploads_faturas_operadora_id_fkey"
            columns: ["operadora_id"]
            isOneToOne: false
            referencedRelation: "operadoras"
            referencedColumns: ["id"]
          },
        ]
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
      notificacoes_vencimento: {
        Row: {
          created_at: string | null
          data_envio: string | null
          erro: string | null
          fatura_id: string | null
          id: string
          mensagem_enviada: string | null
          numero_whatsapp: string
          status: string
        }
        Insert: {
          created_at?: string | null
          data_envio?: string | null
          erro?: string | null
          fatura_id?: string | null
          id?: string
          mensagem_enviada?: string | null
          numero_whatsapp: string
          status: string
        }
        Update: {
          created_at?: string | null
          data_envio?: string | null
          erro?: string | null
          fatura_id?: string | null
          id?: string
          mensagem_enviada?: string | null
          numero_whatsapp?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_vencimento_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "pagamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      operadora_acordos_comerciais: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          operadora_id: string
          percentual_comissao_ativacao: number
          updated_at: string
          valor_comissao_ativacao: number | null
          valor_plano_referencia: number
          vigencia_fim: string | null
          vigencia_inicio: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          operadora_id: string
          percentual_comissao_ativacao: number
          updated_at?: string
          valor_comissao_ativacao?: number | null
          valor_plano_referencia?: number
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          operadora_id?: string
          percentual_comissao_ativacao?: number
          updated_at?: string
          valor_comissao_ativacao?: number | null
          valor_plano_referencia?: number
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "operadora_acordos_comerciais_operadora_id_fkey"
            columns: ["operadora_id"]
            isOneToOne: false
            referencedRelation: "operadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      operadoras: {
        Row: {
          ativo: boolean
          cor: string | null
          created_at: string
          id: string
          logo_url: string | null
          nome: string
          slug: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          nome: string
          slug: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          nome?: string
          slug?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
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
      pagamentos_cadastro_representante: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          moeda: string
          pago_em: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string
          updated_at: string
          user_id: string
          valor: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          moeda?: string
          pago_em?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id: string
          updated_at?: string
          user_id: string
          valor?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          moeda?: string
          pago_em?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string
          updated_at?: string
          user_id?: string
          valor?: number | null
        }
        Relationships: []
      }
      planos_mvno: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          franquia_dados_mb: number
          id: string
          minutos_incluidos: number
          nome: string
          operadora_id: string | null
          sms_incluidos: number
          tenant_id: string | null
          updated_at: string
          valor_mensal: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          franquia_dados_mb?: number
          id?: string
          minutos_incluidos?: number
          nome: string
          operadora_id?: string | null
          sms_incluidos?: number
          tenant_id?: string | null
          updated_at?: string
          valor_mensal?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          franquia_dados_mb?: number
          id?: string
          minutos_incluidos?: number
          nome?: string
          operadora_id?: string | null
          sms_incluidos?: number
          tenant_id?: string | null
          updated_at?: string
          valor_mensal?: number
        }
        Relationships: [
          {
            foreignKeyName: "planos_mvno_operadora_id_fkey"
            columns: ["operadora_id"]
            isOneToOne: false
            referencedRelation: "operadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_events: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          metadata: Json | null
          source: string
          status: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          metadata?: Json | null
          source: string
          status?: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          metadata?: Json | null
          source?: string
          status?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          comissao_ativacao: number | null
          comissao_recorrente: number | null
          created_at: string
          custo_operacional: number | null
          descricao_comercial: string | null
          id: string
          nome: string
          produto_principal: boolean
          slug: string
          status: string
          updated_at: string
          valor_mensal: number | null
        }
        Insert: {
          comissao_ativacao?: number | null
          comissao_recorrente?: number | null
          created_at?: string
          custo_operacional?: number | null
          descricao_comercial?: string | null
          id?: string
          nome: string
          produto_principal?: boolean
          slug: string
          status?: string
          updated_at?: string
          valor_mensal?: number | null
        }
        Update: {
          comissao_ativacao?: number | null
          comissao_recorrente?: number | null
          created_at?: string
          custo_operacional?: number | null
          descricao_comercial?: string | null
          id?: string
          nome?: string
          produto_principal?: boolean
          slug?: string
          status?: string
          updated_at?: string
          valor_mensal?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cadastro_pago_em: string | null
          codigo_indicacao: string | null
          cpf: string | null
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
          cadastro_pago_em?: string | null
          codigo_indicacao?: string | null
          cpf?: string | null
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
          cadastro_pago_em?: string | null
          codigo_indicacao?: string | null
          cpf?: string | null
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
      queue_dead_letters: {
        Row: {
          created_at: string | null
          error_log: Json | null
          final_status: string | null
          id: string
          original_job_id: string | null
          payload: Json | null
          queue_name: string
        }
        Insert: {
          created_at?: string | null
          error_log?: Json | null
          final_status?: string | null
          id?: string
          original_job_id?: string | null
          payload?: Json | null
          queue_name: string
        }
        Update: {
          created_at?: string | null
          error_log?: Json | null
          final_status?: string | null
          id?: string
          original_job_id?: string | null
          payload?: Json | null
          queue_name?: string
        }
        Relationships: []
      }
      queue_jobs: {
        Row: {
          attempts: number | null
          created_at: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          idempotency_key: string | null
          last_error_at: string | null
          max_attempts: number | null
          payload: Json
          priority: Database["public"]["Enums"]["job_priority"] | null
          queue_name: string
          run_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          timeout_seconds: number | null
          worker_id: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          idempotency_key?: string | null
          last_error_at?: string | null
          max_attempts?: number | null
          payload: Json
          priority?: Database["public"]["Enums"]["job_priority"] | null
          queue_name: string
          run_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          timeout_seconds?: number | null
          worker_id?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          idempotency_key?: string | null
          last_error_at?: string | null
          max_attempts?: number | null
          payload?: Json
          priority?: Database["public"]["Enums"]["job_priority"] | null
          queue_name?: string
          run_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          timeout_seconds?: number | null
          worker_id?: string | null
        }
        Relationships: []
      }
      queue_metrics: {
        Row: {
          avg_latency_ms: number | null
          id: string
          jobs_failed: number | null
          jobs_processed: number | null
          measured_at: string | null
          queue_name: string
          throughput_per_min: number | null
        }
        Insert: {
          avg_latency_ms?: number | null
          id?: string
          jobs_failed?: number | null
          jobs_processed?: number | null
          measured_at?: string | null
          queue_name: string
          throughput_per_min?: number | null
        }
        Update: {
          avg_latency_ms?: number | null
          id?: string
          jobs_failed?: number | null
          jobs_processed?: number | null
          measured_at?: string | null
          queue_name?: string
          throughput_per_min?: number | null
        }
        Relationships: []
      }
      queue_rate_limits: {
        Row: {
          burst_limit: number | null
          current_usage: number | null
          id: string
          last_reset: string | null
          provider: string
          requests_per_second: number | null
        }
        Insert: {
          burst_limit?: number | null
          current_usage?: number | null
          id?: string
          last_reset?: string | null
          provider: string
          requests_per_second?: number | null
        }
        Update: {
          burst_limit?: number | null
          current_usage?: number | null
          id?: string
          last_reset?: string | null
          provider?: string
          requests_per_second?: number | null
        }
        Relationships: []
      }
      queue_workers: {
        Row: {
          cpu_usage: number | null
          created_at: string | null
          id: string
          last_ping: string | null
          memory_usage: number | null
          name: string
          queues_handled: string[] | null
          status: string | null
        }
        Insert: {
          cpu_usage?: number | null
          created_at?: string | null
          id?: string
          last_ping?: string | null
          memory_usage?: number | null
          name: string
          queues_handled?: string[] | null
          status?: string | null
        }
        Update: {
          cpu_usage?: number | null
          created_at?: string | null
          id?: string
          last_ping?: string | null
          memory_usage?: number | null
          name?: string
          queues_handled?: string[] | null
          status?: string | null
        }
        Relationships: []
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
          features: Json | null
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
          features?: Json | null
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
          features?: Json | null
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
          processamento_iniciado_em: string | null
          solicitado_em: string | null
          status: string
          taxa: number
          user_id: string
          valor: number
          valor_liquido: number | null
          wallet_id: string
        }
        Insert: {
          comprovante_url?: string | null
          dados_bancarios_id: string
          id?: string
          motivo_rejeicao?: string | null
          pago_em?: string | null
          processado_em?: string | null
          processamento_iniciado_em?: string | null
          solicitado_em?: string | null
          status?: string
          taxa?: number
          user_id: string
          valor: number
          valor_liquido?: number | null
          wallet_id: string
        }
        Update: {
          comprovante_url?: string | null
          dados_bancarios_id?: string
          id?: string
          motivo_rejeicao?: string | null
          pago_em?: string | null
          processado_em?: string | null
          processamento_iniciado_em?: string | null
          solicitado_em?: string | null
          status?: string
          taxa?: number
          user_id?: string
          valor?: number
          valor_liquido?: number | null
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
      system_alerts: {
        Row: {
          created_at: string
          fingerprint: string
          id: string
          last_seen: string
          message: string | null
          metadata: Json | null
          module: string
          occurrences: number
          resolved_at: string | null
          severity: Database["public"]["Enums"]["system_severity"]
          status: Database["public"]["Enums"]["system_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fingerprint: string
          id?: string
          last_seen?: string
          message?: string | null
          metadata?: Json | null
          module: string
          occurrences?: number
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["system_severity"]
          status?: Database["public"]["Enums"]["system_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fingerprint?: string
          id?: string
          last_seen?: string
          message?: string | null
          metadata?: Json | null
          module?: string
          occurrences?: number
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["system_severity"]
          status?: Database["public"]["Enums"]["system_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_error_logs: {
        Row: {
          cpu_estimate: number | null
          created_at: string
          error_code: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: number
          memory_usage_mb: number | null
          metadata: Json | null
          module: string
          provider: string | null
          provider_response: Json | null
          request_id: string | null
          retries: number | null
          stacktrace: string | null
          user_id: string | null
        }
        Insert: {
          cpu_estimate?: number | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: number
          memory_usage_mb?: number | null
          metadata?: Json | null
          module: string
          provider?: string | null
          provider_response?: Json | null
          request_id?: string | null
          retries?: number | null
          stacktrace?: string | null
          user_id?: string | null
        }
        Update: {
          cpu_estimate?: number | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: number
          memory_usage_mb?: number | null
          metadata?: Json | null
          module?: string
          provider?: string | null
          provider_response?: Json | null
          request_id?: string | null
          retries?: number | null
          stacktrace?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_health_checks: {
        Row: {
          checked_at: string
          details: Json | null
          id: string
          latency_ms: number | null
          service: string
          status: Database["public"]["Enums"]["system_status"]
        }
        Insert: {
          checked_at?: string
          details?: Json | null
          id?: string
          latency_ms?: number | null
          service: string
          status: Database["public"]["Enums"]["system_status"]
        }
        Update: {
          checked_at?: string
          details?: Json | null
          id?: string
          latency_ms?: number | null
          service?: string
          status?: Database["public"]["Enums"]["system_status"]
        }
        Relationships: []
      }
      system_incidents: {
        Row: {
          auto_recovered: boolean
          created_at: string
          description: string | null
          id: string
          impact: string | null
          metadata: Json | null
          module: string
          recovery_time_seconds: number | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["system_severity"]
          started_at: string
          status: Database["public"]["Enums"]["system_incident_status"]
          title: string
          updated_at: string
        }
        Insert: {
          auto_recovered?: boolean
          created_at?: string
          description?: string | null
          id?: string
          impact?: string | null
          metadata?: Json | null
          module: string
          recovery_time_seconds?: number | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["system_severity"]
          started_at?: string
          status?: Database["public"]["Enums"]["system_incident_status"]
          title: string
          updated_at?: string
        }
        Update: {
          auto_recovered?: boolean
          created_at?: string
          description?: string | null
          id?: string
          impact?: string | null
          metadata?: Json | null
          module?: string
          recovery_time_seconds?: number | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["system_severity"]
          started_at?: string
          status?: Database["public"]["Enums"]["system_incident_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          created_at: string
          dimensions: Json | null
          id: number
          metric_name: string
          metric_value: number
          module: string | null
        }
        Insert: {
          created_at?: string
          dimensions?: Json | null
          id?: number
          metric_name: string
          metric_value: number
          module?: string | null
        }
        Update: {
          created_at?: string
          dimensions?: Json | null
          id?: number
          metric_name?: string
          metric_value?: number
          module?: string | null
        }
        Relationships: []
      }
      system_performance_logs: {
        Row: {
          category: string
          created_at: string
          duration_ms: number
          id: number
          is_slow: boolean
          metadata: Json | null
          module: string | null
          operation: string
        }
        Insert: {
          category: string
          created_at?: string
          duration_ms: number
          id?: number
          is_slow?: boolean
          metadata?: Json | null
          module?: string | null
          operation: string
        }
        Update: {
          category?: string
          created_at?: string
          duration_ms?: number
          id?: number
          is_slow?: boolean
          metadata?: Json | null
          module?: string | null
          operation?: string
        }
        Relationships: []
      }
      system_provider_status: {
        Row: {
          consecutive_failures: number | null
          id: string
          last_check: string
          last_failure: string | null
          last_success: string | null
          latency_ms: number | null
          metadata: Json | null
          provider: string
          status: Database["public"]["Enums"]["system_status"]
        }
        Insert: {
          consecutive_failures?: number | null
          id?: string
          last_check?: string
          last_failure?: string | null
          last_success?: string | null
          latency_ms?: number | null
          metadata?: Json | null
          provider: string
          status?: Database["public"]["Enums"]["system_status"]
        }
        Update: {
          consecutive_failures?: number | null
          id?: string
          last_check?: string
          last_failure?: string | null
          last_success?: string | null
          latency_ms?: number | null
          metadata?: Json | null
          provider?: string
          status?: Database["public"]["Enums"]["system_status"]
        }
        Relationships: []
      }
      system_queues: {
        Row: {
          concurrency_limit: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          concurrency_limit?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          concurrency_limit?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      system_resource_usage: {
        Row: {
          active_jobs: number | null
          cpu_pct: number | null
          id: number
          memory_mb: number | null
          metadata: Json | null
          module: string | null
          recorded_at: string
          region: string | null
          worker_id: string
        }
        Insert: {
          active_jobs?: number | null
          cpu_pct?: number | null
          id?: number
          memory_mb?: number | null
          metadata?: Json | null
          module?: string | null
          recorded_at?: string
          region?: string | null
          worker_id: string
        }
        Update: {
          active_jobs?: number | null
          cpu_pct?: number | null
          id?: number
          memory_mb?: number | null
          metadata?: Json | null
          module?: string | null
          recorded_at?: string
          region?: string | null
          worker_id?: string
        }
        Relationships: []
      }
      system_uptime_logs: {
        Row: {
          checked_at: string
          downtime_seconds: number | null
          id: number
          module: string
          status: Database["public"]["Enums"]["system_status"]
          uptime_pct: number | null
        }
        Insert: {
          checked_at?: string
          downtime_seconds?: number | null
          id?: number
          module: string
          status: Database["public"]["Enums"]["system_status"]
          uptime_pct?: number | null
        }
        Update: {
          checked_at?: string
          downtime_seconds?: number | null
          id?: number
          module?: string
          status?: Database["public"]["Enums"]["system_status"]
          uptime_pct?: number | null
        }
        Relationships: []
      }
      telecom_jobs: {
        Row: {
          action: string
          attempts: number | null
          created_at: string | null
          id: string
          last_error: string | null
          linha_id: string | null
          max_attempts: number | null
          payload: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          action: string
          attempts?: number | null
          created_at?: string | null
          id?: string
          last_error?: string | null
          linha_id?: string | null
          max_attempts?: number | null
          payload?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          action?: string
          attempts?: number | null
          created_at?: string | null
          id?: string
          last_error?: string | null
          linha_id?: string | null
          max_attempts?: number | null
          payload?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telecom_jobs_linha_id_fkey"
            columns: ["linha_id"]
            isOneToOne: false
            referencedRelation: "linhas"
            referencedColumns: ["id"]
          },
        ]
      }
      telecom_provider_logs: {
        Row: {
          action: string
          cliente_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          linha_id: string | null
          payload: Json | null
          provider: string
          response: Json | null
          success: boolean | null
        }
        Insert: {
          action: string
          cliente_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          linha_id?: string | null
          payload?: Json | null
          provider: string
          response?: Json | null
          success?: boolean | null
        }
        Update: {
          action?: string
          cliente_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          linha_id?: string | null
          payload?: Json | null
          provider?: string
          response?: Json | null
          success?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "telecom_provider_logs_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telecom_provider_logs_linha_id_fkey"
            columns: ["linha_id"]
            isOneToOne: false
            referencedRelation: "linhas"
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
          cadastro_pago_em: string | null
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
          cadastro_pago_em?: string | null
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
          cadastro_pago_em?: string | null
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
      whatsapp_instance_health: {
        Row: {
          details: Json | null
          heartbeat_at: string | null
          id: string
          instance_id: string | null
          latency_ms: number | null
          status: Database["public"]["Enums"]["whatsapp_instance_status"]
        }
        Insert: {
          details?: Json | null
          heartbeat_at?: string | null
          id?: string
          instance_id?: string | null
          latency_ms?: number | null
          status: Database["public"]["Enums"]["whatsapp_instance_status"]
        }
        Update: {
          details?: Json | null
          heartbeat_at?: string | null
          id?: string
          instance_id?: string | null
          latency_ms?: number | null
          status?: Database["public"]["Enums"]["whatsapp_instance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instance_health_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instance_metrics: {
        Row: {
          avg_response_time_ms: number | null
          delivery_rate: number | null
          failed_count: number | null
          id: string
          instance_id: string | null
          last_reset_at: string | null
          sent_count: number | null
        }
        Insert: {
          avg_response_time_ms?: number | null
          delivery_rate?: number | null
          failed_count?: number | null
          id?: string
          instance_id?: string | null
          last_reset_at?: string | null
          sent_count?: number | null
        }
        Update: {
          avg_response_time_ms?: number | null
          delivery_rate?: number | null
          failed_count?: number | null
          id?: string
          instance_id?: string | null
          last_reset_at?: string | null
          sent_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instance_metrics_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: true
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          connected_at: string | null
          created_at: string | null
          disconnected_at: string | null
          health_score: number | null
          id: string
          last_seen: string | null
          nome: string
          numero_conectado: string | null
          provider: string | null
          qr_code: string | null
          reconnect_attempts: number | null
          session_id: string
          status: Database["public"]["Enums"]["whatsapp_instance_status"] | null
          updated_at: string | null
        }
        Insert: {
          connected_at?: string | null
          created_at?: string | null
          disconnected_at?: string | null
          health_score?: number | null
          id?: string
          last_seen?: string | null
          nome: string
          numero_conectado?: string | null
          provider?: string | null
          qr_code?: string | null
          reconnect_attempts?: number | null
          session_id: string
          status?:
            | Database["public"]["Enums"]["whatsapp_instance_status"]
            | null
          updated_at?: string | null
        }
        Update: {
          connected_at?: string | null
          created_at?: string | null
          disconnected_at?: string | null
          health_score?: number | null
          id?: string
          last_seen?: string | null
          nome?: string
          numero_conectado?: string | null
          provider?: string | null
          qr_code?: string | null
          reconnect_attempts?: number | null
          session_id?: string
          status?:
            | Database["public"]["Enums"]["whatsapp_instance_status"]
            | null
          updated_at?: string | null
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
      whatsapp_message_logs: {
        Row: {
          action: string
          created_at: string | null
          execution_time_ms: number | null
          id: string
          instance_id: string | null
          provider_response: Json | null
          queue_id: string | null
          status: string
        }
        Insert: {
          action: string
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          instance_id?: string | null
          provider_response?: Json | null
          queue_id?: string | null
          status: string
        }
        Update: {
          action?: string
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          instance_id?: string | null
          provider_response?: Json | null
          queue_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_logs_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_message_logs_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_message_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_message_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          instance_id: string | null
          max_retries: number | null
          mensagem: string
          metadata: Json | null
          prioridade: number | null
          processed_at: string | null
          retries: number | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["whatsapp_queue_status"] | null
          telefone: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          instance_id?: string | null
          max_retries?: number | null
          mensagem: string
          metadata?: Json | null
          prioridade?: number | null
          processed_at?: string | null
          retries?: number | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["whatsapp_queue_status"] | null
          telefone: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          instance_id?: string | null
          max_retries?: number | null
          mensagem?: string
          metadata?: Json | null
          prioridade?: number | null
          processed_at?: string | null
          retries?: number | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["whatsapp_queue_status"] | null
          telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_queue_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
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
      aprovar_anuncio: {
        Args: { p_anuncio_id: string }
        Returns: {
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string
          criado_por: string
          data_fim: string | null
          data_inicio: string | null
          dias_contratados: number | null
          id: string
          imagem_url: string | null
          link_destino: string | null
          motivo_rejeicao: string | null
          posicao: Database["public"]["Enums"]["anuncio_posicao"]
          status: Database["public"]["Enums"]["anuncio_status"]
          stripe_payment_id: string | null
          titulo: string
          updated_at: string
          valor_pago: number | null
        }
        SetofOptions: {
          from: "*"
          to: "anuncios"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      aprovar_saque: { Args: { p_saque_id: string }; Returns: undefined }
      ativar_linha_pos_pagamento: {
        Args: {
          p_cliente_id: string
          p_ddd?: string
          p_operadora_id: string
          p_plano_id?: string
          p_representante_id: string
          p_tipo?: string
        }
        Returns: {
          ativada_em: string | null
          chip_estoque_id: string | null
          cliente_id: string | null
          created_at: string
          iccid: string | null
          id: string
          imsi: string | null
          metadata: Json
          numero: string | null
          observacoes: string | null
          operadora_id: string | null
          plano_id: string | null
          proximo_vencimento: string | null
          status: Database["public"]["Enums"]["mvno_linha_status"]
          tenant_id: string | null
          updated_at: string
          user_id: string | null
          valor_mensal: number
        }
        SetofOptions: {
          from: "*"
          to: "mvno_linhas"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      auto_recover_alerts: { Args: never; Returns: undefined }
      calcular_preco_anuncio: {
        Args: {
          p_dias: number
          p_posicao: Database["public"]["Enums"]["anuncio_posicao"]
        }
        Returns: number
      }
      calculate_next_day_volume: {
        Args: { current_level: number; error_rate: number; reply_rate: number }
        Returns: number
      }
      calculate_next_run: { Args: { p_attempts: number }; Returns: string }
      cancel_import_job: { Args: { p_job_id: string }; Returns: undefined }
      check_and_register_whatsapp_send: {
        Args: { target_phone: string }
        Returns: boolean
      }
      check_rpc_rate_limit: {
        Args: { p_function_name: string; p_user_id: string }
        Returns: undefined
      }
      claim_batch_import_chunks: {
        Args: { p_batch_size?: number }
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
        }[]
        SetofOptions: {
          from: "*"
          to: "import_chunks"
          isOneToOne: false
          isSetofReturn: true
        }
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
      cleanup_observability_data: { Args: never; Returns: undefined }
      cleanup_old_imports: { Args: never; Returns: undefined }
      complete_job: { Args: { p_job_id: string }; Returns: undefined }
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
      current_tenant_id: { Args: never; Returns: string }
      detectar_ciclo_indicacao: {
        Args: { p_indicado_id: string; p_indicador_id: string }
        Returns: boolean
      }
      estornar_transacao_wallet: {
        Args: { p_transacao_id: string }
        Returns: undefined
      }
      fail_import_chunk: {
        Args: { p_chunk_id: string; p_erro: string }
        Returns: undefined
      }
      fail_job: {
        Args: { p_error: string; p_job_id: string }
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
      get_mvni_financeiro_mensal: {
        Args: { p_mes_referencia: string }
        Returns: {
          comissoes_ativacao_pagas: number
          comissoes_recorrencia_pagas: number
          custo_operadoras: number
          descontos_concedidos: number
          lucro_liquido: number
          receita_ativacao_operadoras: number
          receita_clientes: number
        }[]
      }
      get_next_jobs: {
        Args: { p_limit?: number; p_queue: string; p_worker_id: string }
        Returns: {
          attempts: number | null
          created_at: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          idempotency_key: string | null
          last_error_at: string | null
          max_attempts: number | null
          payload: Json
          priority: Database["public"]["Enums"]["job_priority"] | null
          queue_name: string
          run_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          timeout_seconds: number | null
          worker_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "queue_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_system_health_overview: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_job_progress: { Args: { p_job_id: string }; Returns: undefined }
      increment_job_progress_batch: {
        Args: { p_amount: number; p_job_id: string }
        Returns: undefined
      }
      increment_lead_score: {
        Args: { p_inc: number; p_lead_id: string }
        Returns: undefined
      }
      increment_whatsapp_metrics: {
        Args: { p_instance_id: string; p_success: boolean }
        Returns: undefined
      }
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
      match_ai_context: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      register_system_alert: {
        Args: {
          p_fingerprint?: string
          p_message?: string
          p_metadata?: Json
          p_module: string
          p_severity: Database["public"]["Enums"]["system_severity"]
          p_status: Database["public"]["Enums"]["system_status"]
          p_title: string
        }
        Returns: string
      }
      registrar_ativacao_financeira: {
        Args: {
          p_cliente_id: string
          p_linha_id?: string
          p_mes_referencia?: string
          p_operadora_id: string
          p_representante_id: string
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
      registrar_recorrencia_financeira: {
        Args: {
          p_cliente_id: string
          p_linha_id?: string
          p_mes_referencia?: string
          p_operadora_id: string
          p_representante_id: string
        }
        Returns: undefined
      }
      rejeitar_anuncio: {
        Args: { p_anuncio_id: string; p_motivo: string }
        Returns: {
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string
          criado_por: string
          data_fim: string | null
          data_inicio: string | null
          dias_contratados: number | null
          id: string
          imagem_url: string | null
          link_destino: string | null
          motivo_rejeicao: string | null
          posicao: Database["public"]["Enums"]["anuncio_posicao"]
          status: Database["public"]["Enums"]["anuncio_status"]
          stripe_payment_id: string | null
          titulo: string
          updated_at: string
          valor_pago: number | null
        }
        SetofOptions: {
          from: "*"
          to: "anuncios"
          isOneToOne: true
          isSetofReturn: false
        }
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
      update_import_heartbeat: {
        Args: { p_worker_id: string }
        Returns: undefined
      }
      upsert_import_batch: { Args: { p_payloads: Json[] }; Returns: undefined }
    }
    Enums: {
      anuncio_posicao:
        | "dashboard_topo"
        | "dashboard_lateral"
        | "tela_vendas"
        | "painel_ganhos"
      anuncio_status:
        | "rascunho"
        | "aguardando_pagamento"
        | "pendente_aprovacao"
        | "aprovado"
        | "rejeitado"
        | "ativo"
        | "pausado"
        | "encerrado"
      app_role: "admin" | "user" | "master_admin"
      cobranca_status: "pendente" | "pago" | "atrasado" | "cancelado"
      comissao_tipo: "venda" | "recorrencia"
      crm_interaction_type:
        | "ligacao"
        | "mensagem"
        | "reuniao"
        | "email"
        | "nota"
        | "outro"
      crm_lead_status:
        | "novo"
        | "em_contato"
        | "em_negociacao"
        | "convertido"
        | "perdido"
      job_priority: "critical" | "high" | "normal" | "low"
      job_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "retrying"
        | "cancelled"
      linha_status:
        | "ativa"
        | "suspensa"
        | "cancelada"
        | "pending_activation"
        | "active"
        | "suspended"
        | "cancelled"
        | "blocked"
        | "inactive"
      mvni_lancamento_direcao: "entrada" | "saida"
      mvni_lancamento_tipo:
        | "receita_cliente"
        | "custo_operadora"
        | "comissao_ativacao_parceiro"
        | "comissao_recorrente_parceiro"
        | "receita_ativacao_operadora"
        | "desconto_chip_prepago"
        | "outros"
      mvno_evento_tipo:
        | "ativacao"
        | "suspensao"
        | "reativacao"
        | "troca_plano"
        | "pagamento"
        | "inadimplencia"
        | "cancelamento"
        | "portabilidade"
        | "importacao_fatura"
        | "alteracao_admin"
        | "criacao"
      mvno_fatura_status:
        | "aberta"
        | "paga"
        | "atrasada"
        | "cancelada"
        | "contestada"
      mvno_item_categoria:
        | "assinatura"
        | "dados"
        | "sms"
        | "ligacoes"
        | "roaming"
        | "servicos_adicionais"
        | "tributos"
        | "desconto"
        | "outros"
      mvno_linha_status:
        | "ativa"
        | "suspensa"
        | "bloqueada"
        | "cancelada"
        | "portabilidade"
        | "em_ativacao"
      mvno_pagamento_status:
        | "pendente"
        | "confirmado"
        | "expirado"
        | "cancelado"
        | "falhou"
      mvno_parser_status:
        | "pending"
        | "processing"
        | "done"
        | "failed"
        | "pending_ai"
        | "canceled"
      mvno_parser_tipo: "pdf" | "csv" | "xlsx" | "ocr"
      sms_status:
        | "pending"
        | "processing"
        | "sent"
        | "delivered"
        | "failed"
        | "blacklist"
      system_incident_status: "open" | "acknowledged" | "resolved" | "closed"
      system_severity: "info" | "low" | "medium" | "high" | "critical"
      system_status: "healthy" | "warning" | "critical" | "offline" | "degraded"
      user_status: "ativo" | "inativo"
      whatsapp_connection_status:
        | "qr"
        | "conectado"
        | "desconectado"
        | "iniciando"
      whatsapp_instance_status:
        | "connecting"
        | "qr_pending"
        | "connected"
        | "reconnecting"
        | "disconnected"
        | "banned"
        | "timeout"
        | "rate_limited"
      whatsapp_queue_status:
        | "pending"
        | "processing"
        | "sent"
        | "failed"
        | "cancelled"
        | "scheduled"
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
      anuncio_posicao: [
        "dashboard_topo",
        "dashboard_lateral",
        "tela_vendas",
        "painel_ganhos",
      ],
      anuncio_status: [
        "rascunho",
        "aguardando_pagamento",
        "pendente_aprovacao",
        "aprovado",
        "rejeitado",
        "ativo",
        "pausado",
        "encerrado",
      ],
      app_role: ["admin", "user", "master_admin"],
      cobranca_status: ["pendente", "pago", "atrasado", "cancelado"],
      comissao_tipo: ["venda", "recorrencia"],
      crm_interaction_type: [
        "ligacao",
        "mensagem",
        "reuniao",
        "email",
        "nota",
        "outro",
      ],
      crm_lead_status: [
        "novo",
        "em_contato",
        "em_negociacao",
        "convertido",
        "perdido",
      ],
      job_priority: ["critical", "high", "normal", "low"],
      job_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "retrying",
        "cancelled",
      ],
      linha_status: [
        "ativa",
        "suspensa",
        "cancelada",
        "pending_activation",
        "active",
        "suspended",
        "cancelled",
        "blocked",
        "inactive",
      ],
      mvni_lancamento_direcao: ["entrada", "saida"],
      mvni_lancamento_tipo: [
        "receita_cliente",
        "custo_operadora",
        "comissao_ativacao_parceiro",
        "comissao_recorrente_parceiro",
        "receita_ativacao_operadora",
        "desconto_chip_prepago",
        "outros",
      ],
      mvno_evento_tipo: [
        "ativacao",
        "suspensao",
        "reativacao",
        "troca_plano",
        "pagamento",
        "inadimplencia",
        "cancelamento",
        "portabilidade",
        "importacao_fatura",
        "alteracao_admin",
        "criacao",
      ],
      mvno_fatura_status: [
        "aberta",
        "paga",
        "atrasada",
        "cancelada",
        "contestada",
      ],
      mvno_item_categoria: [
        "assinatura",
        "dados",
        "sms",
        "ligacoes",
        "roaming",
        "servicos_adicionais",
        "tributos",
        "desconto",
        "outros",
      ],
      mvno_linha_status: [
        "ativa",
        "suspensa",
        "bloqueada",
        "cancelada",
        "portabilidade",
        "em_ativacao",
      ],
      mvno_pagamento_status: [
        "pendente",
        "confirmado",
        "expirado",
        "cancelado",
        "falhou",
      ],
      mvno_parser_status: [
        "pending",
        "processing",
        "done",
        "failed",
        "pending_ai",
        "canceled",
      ],
      mvno_parser_tipo: ["pdf", "csv", "xlsx", "ocr"],
      sms_status: [
        "pending",
        "processing",
        "sent",
        "delivered",
        "failed",
        "blacklist",
      ],
      system_incident_status: ["open", "acknowledged", "resolved", "closed"],
      system_severity: ["info", "low", "medium", "high", "critical"],
      system_status: ["healthy", "warning", "critical", "offline", "degraded"],
      user_status: ["ativo", "inativo"],
      whatsapp_connection_status: [
        "qr",
        "conectado",
        "desconectado",
        "iniciando",
      ],
      whatsapp_instance_status: [
        "connecting",
        "qr_pending",
        "connected",
        "reconnecting",
        "disconnected",
        "banned",
        "timeout",
        "rate_limited",
      ],
      whatsapp_queue_status: [
        "pending",
        "processing",
        "sent",
        "failed",
        "cancelled",
        "scheduled",
      ],
    },
  },
} as const
