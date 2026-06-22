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
      andamento_obras: {
        Row: {
          created_at: string
          desvio_cronograma_dias: number | null
          empreendimento_id: string | null
          evolucao_financeira_percentual: number | null
          evolucao_fisica_percentual: number | null
          id: string
          mes_referencia: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          desvio_cronograma_dias?: number | null
          empreendimento_id?: string | null
          evolucao_financeira_percentual?: number | null
          evolucao_fisica_percentual?: number | null
          id?: string
          mes_referencia?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          desvio_cronograma_dias?: number | null
          empreendimento_id?: string | null
          evolucao_financeira_percentual?: number | null
          evolucao_fisica_percentual?: number | null
          id?: string
          mes_referencia?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "andamento_obras_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      empreendimentos: {
        Row: {
          cidade: string | null
          created_at: string
          data_entrega_prevista: string | null
          data_entrega_real: string | null
          data_lancamento: string | null
          estado: string | null
          id: string
          nome: string
          status: string | null
          tipo: string | null
          total_unidades: number | null
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          data_entrega_prevista?: string | null
          data_entrega_real?: string | null
          data_lancamento?: string | null
          estado?: string | null
          id?: string
          nome: string
          status?: string | null
          tipo?: string | null
          total_unidades?: number | null
        }
        Update: {
          cidade?: string | null
          created_at?: string
          data_entrega_prevista?: string | null
          data_entrega_real?: string | null
          data_lancamento?: string | null
          estado?: string | null
          id?: string
          nome?: string
          status?: string | null
          tipo?: string | null
          total_unidades?: number | null
        }
        Relationships: []
      }
      fluxo_caixa_projecao: {
        Row: {
          cenario: string | null
          created_at: string
          entradas_previstas: number | null
          id: string
          mes_referencia: string | null
          saidas_previstas: number | null
          saldo_projetado: number | null
        }
        Insert: {
          cenario?: string | null
          created_at?: string
          entradas_previstas?: number | null
          id?: string
          mes_referencia?: string | null
          saidas_previstas?: number | null
          saldo_projetado?: number | null
        }
        Update: {
          cenario?: string | null
          created_at?: string
          entradas_previstas?: number | null
          id?: string
          mes_referencia?: string | null
          saidas_previstas?: number | null
          saldo_projetado?: number | null
        }
        Relationships: []
      }
      indicadores_financeiros: {
        Row: {
          ativo_circulante: number | null
          ativo_nao_circulante: number | null
          ativo_total: number | null
          burn_rate: number | null
          cobertura_juros: number | null
          cpv: number | null
          created_at: string
          divida_bruta: number | null
          divida_liquida: number | null
          ebitda: number | null
          entradas_periodo: number | null
          id: string
          indice_endividamento_geral: number | null
          liquidez_corrente: number | null
          liquidez_imediata: number | null
          liquidez_seca: number | null
          lucro_liquido: number | null
          margem_bruta_percentual: number | null
          margem_ebitda_percentual: number | null
          margem_liquida_percentual: number | null
          passivo_circulante: number | null
          passivo_nao_circulante: number | null
          passivo_total: number | null
          patrimonio_liquido: number | null
          periodo: string | null
          receita_bruta: number | null
          roa: number | null
          roe: number | null
          roic: number | null
          saidas_periodo: number | null
          saldo_caixa: number | null
          tipo_periodo: string | null
        }
        Insert: {
          ativo_circulante?: number | null
          ativo_nao_circulante?: number | null
          ativo_total?: number | null
          burn_rate?: number | null
          cobertura_juros?: number | null
          cpv?: number | null
          created_at?: string
          divida_bruta?: number | null
          divida_liquida?: number | null
          ebitda?: number | null
          entradas_periodo?: number | null
          id?: string
          indice_endividamento_geral?: number | null
          liquidez_corrente?: number | null
          liquidez_imediata?: number | null
          liquidez_seca?: number | null
          lucro_liquido?: number | null
          margem_bruta_percentual?: number | null
          margem_ebitda_percentual?: number | null
          margem_liquida_percentual?: number | null
          passivo_circulante?: number | null
          passivo_nao_circulante?: number | null
          passivo_total?: number | null
          patrimonio_liquido?: number | null
          periodo?: string | null
          receita_bruta?: number | null
          roa?: number | null
          roe?: number | null
          roic?: number | null
          saidas_periodo?: number | null
          saldo_caixa?: number | null
          tipo_periodo?: string | null
        }
        Update: {
          ativo_circulante?: number | null
          ativo_nao_circulante?: number | null
          ativo_total?: number | null
          burn_rate?: number | null
          cobertura_juros?: number | null
          cpv?: number | null
          created_at?: string
          divida_bruta?: number | null
          divida_liquida?: number | null
          ebitda?: number | null
          entradas_periodo?: number | null
          id?: string
          indice_endividamento_geral?: number | null
          liquidez_corrente?: number | null
          liquidez_imediata?: number | null
          liquidez_seca?: number | null
          lucro_liquido?: number | null
          margem_bruta_percentual?: number | null
          margem_ebitda_percentual?: number | null
          margem_liquida_percentual?: number | null
          passivo_circulante?: number | null
          passivo_nao_circulante?: number | null
          passivo_total?: number | null
          patrimonio_liquido?: number | null
          periodo?: string | null
          receita_bruta?: number | null
          roa?: number | null
          roe?: number | null
          roic?: number | null
          saidas_periodo?: number | null
          saldo_caixa?: number | null
          tipo_periodo?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
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
      vgv_vendas: {
        Row: {
          created_at: string
          empreendimento_id: string | null
          id: string
          mes_referencia: string | null
          ticket_medio: number | null
          unidades_distratadas: number | null
          unidades_vendidas: number | null
          vgv_lancado: number | null
          vgv_vendido: number | null
          vso_percentual: number | null
        }
        Insert: {
          created_at?: string
          empreendimento_id?: string | null
          id?: string
          mes_referencia?: string | null
          ticket_medio?: number | null
          unidades_distratadas?: number | null
          unidades_vendidas?: number | null
          vgv_lancado?: number | null
          vgv_vendido?: number | null
          vso_percentual?: number | null
        }
        Update: {
          created_at?: string
          empreendimento_id?: string | null
          id?: string
          mes_referencia?: string | null
          ticket_medio?: number | null
          unidades_distratadas?: number | null
          unidades_vendidas?: number | null
          vgv_lancado?: number | null
          vgv_vendido?: number | null
          vso_percentual?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vgv_vendas_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_dashboard_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "diretor" | "analista" | "gestor_obra"
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
      app_role: ["admin", "diretor", "analista", "gestor_obra"],
    },
  },
} as const
