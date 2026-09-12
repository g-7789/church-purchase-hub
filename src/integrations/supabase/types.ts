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
      anexos: {
        Row: {
          caminho: string
          created_at: string
          descricao: string | null
          enviado_por: string | null
          id: string
          solicitacao_id: string
          tipo: string
        }
        Insert: {
          caminho: string
          created_at?: string
          descricao?: string | null
          enviado_por?: string | null
          id?: string
          solicitacao_id: string
          tipo?: string
        }
        Update: {
          caminho?: string
          created_at?: string
          descricao?: string | null
          enviado_por?: string | null
          id?: string
          solicitacao_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "anexos_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          chave: string
          descricao: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          chave: string
          descricao?: string | null
          updated_at?: string
          valor: number
        }
        Update: {
          chave?: string
          descricao?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      cotacoes: {
        Row: {
          created_at: string
          fornecedor_id: string | null
          id: string
          observacoes: string | null
          prazo_entrega_dias: number | null
          registrado_por: string | null
          solicitacao_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          prazo_entrega_dias?: number | null
          registrado_por?: string | null
          solicitacao_id: string
          valor: number
        }
        Update: {
          created_at?: string
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          prazo_entrega_dias?: number | null
          registrado_por?: string | null
          solicitacao_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "cotacoes_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacoes_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          categoria: string | null
          contato: string | null
          created_at: string
          id: string
          nome: string
          observacoes: string | null
          whatsapp: string | null
        }
        Insert: {
          categoria?: string | null
          contato?: string | null
          created_at?: string
          id?: string
          nome: string
          observacoes?: string | null
          whatsapp?: string | null
        }
        Update: {
          categoria?: string | null
          contato?: string | null
          created_at?: string
          id?: string
          nome?: string
          observacoes?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      historico_solicitacao: {
        Row: {
          comentario: string | null
          created_at: string
          id: string
          solicitacao_id: string
          status_anterior:
            | Database["public"]["Enums"]["status_solicitacao"]
            | null
          status_novo: Database["public"]["Enums"]["status_solicitacao"]
          usuario_id: string | null
        }
        Insert: {
          comentario?: string | null
          created_at?: string
          id?: string
          solicitacao_id: string
          status_anterior?:
            | Database["public"]["Enums"]["status_solicitacao"]
            | null
          status_novo: Database["public"]["Enums"]["status_solicitacao"]
          usuario_id?: string | null
        }
        Update: {
          comentario?: string | null
          created_at?: string
          id?: string
          solicitacao_id?: string
          status_anterior?:
            | Database["public"]["Enums"]["status_solicitacao"]
            | null
          status_novo?: Database["public"]["Enums"]["status_solicitacao"]
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_solicitacao_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nome: string
          setor: string
          telefone: string | null
        }
        Insert: {
          created_at?: string
          id: string
          nome?: string
          setor?: string
          telefone?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          setor?: string
          telefone?: string | null
        }
        Relationships: []
      }
      solicitacoes_compra: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          concluido_em: string | null
          cotacao_escolhida_id: string | null
          created_at: string
          id: string
          item: string
          motivo: string | null
          observacoes: string | null
          prazo_desejado: string | null
          quantidade: number
          recebido_em: string | null
          recebido_por: string | null
          solicitante_id: string
          status: Database["public"]["Enums"]["status_solicitacao"]
          unidade: string
          updated_at: string
          valor_final: number | null
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          concluido_em?: string | null
          cotacao_escolhida_id?: string | null
          created_at?: string
          id?: string
          item: string
          motivo?: string | null
          observacoes?: string | null
          prazo_desejado?: string | null
          quantidade?: number
          recebido_em?: string | null
          recebido_por?: string | null
          solicitante_id: string
          status?: Database["public"]["Enums"]["status_solicitacao"]
          unidade?: string
          updated_at?: string
          valor_final?: number | null
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          concluido_em?: string | null
          cotacao_escolhida_id?: string | null
          created_at?: string
          id?: string
          item?: string
          motivo?: string | null
          observacoes?: string | null
          prazo_desejado?: string | null
          quantidade?: number
          recebido_em?: string | null
          recebido_por?: string | null
          solicitante_id?: string
          status?: Database["public"]["Enums"]["status_solicitacao"]
          unidade?: string
          updated_at?: string
          valor_final?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "manutencao"
        | "compras"
        | "encarregado"
        | "recebimento"
        | "financeiro"
        | "admin"
      status_solicitacao:
        | "solicitado"
        | "em_cotacao"
        | "aguardando_aprovacao"
        | "aprovado"
        | "comprado"
        | "recebido"
        | "concluido"
        | "cancelado"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "manutencao",
        "compras",
        "encarregado",
        "recebimento",
        "financeiro",
        "admin",
      ],
      status_solicitacao: [
        "solicitado",
        "em_cotacao",
        "aguardando_aprovacao",
        "aprovado",
        "comprado",
        "recebido",
        "concluido",
        "cancelado",
      ],
    },
  },
} as const
