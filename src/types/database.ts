
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "activity_events": {
                  Row: {
                    "actor_id": string,"created_at": string,"fragrance_id": string | null,"id": number,"list_id": string | null,"review_id": string | null,"target_user_id": string | null,"type": Database["public"]['Enums']["activity_type"],"user_fragrance_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id": string,"created_at"?: string,"fragrance_id"?: string | null,"id"?: never,"list_id"?: string | null,"review_id"?: string | null,"target_user_id"?: string | null,"type": Database["public"]['Enums']["activity_type"],"user_fragrance_id"?: string | null
                  }
                  Update: {
                    "actor_id"?: string,"created_at"?: string,"fragrance_id"?: string | null,"id"?: never,"list_id"?: string | null,"review_id"?: string | null,"target_user_id"?: string | null,"type"?: Database["public"]['Enums']["activity_type"],"user_fragrance_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "activity_events_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_events_fragrance_id_fkey"
      columns: ["fragrance_id"]
isOneToOne: false
      referencedRelation: "fragrances"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_events_list_id_fkey"
      columns: ["list_id"]
isOneToOne: false
      referencedRelation: "lists"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_events_review_id_fkey"
      columns: ["review_id"]
isOneToOne: false
      referencedRelation: "reviews"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_events_target_user_id_fkey"
      columns: ["target_user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_events_user_fragrance_id_fkey"
      columns: ["user_fragrance_id"]
isOneToOne: false
      referencedRelation: "user_fragrances"
      referencedColumns: ["id"]
    }
                  ]
                },"brands": {
                  Row: {
                    "country": string | null,"created_at": string,"description_en": string | null,"description_es": string | null,"founded_year": number | null,"id": string,"logo_url": string | null,"name": string,"slug": string,"updated_at": string,"website_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "country"?: string | null,"created_at"?: string,"description_en"?: string | null,"description_es"?: string | null,"founded_year"?: number | null,"id"?: string,"logo_url"?: string | null,"name": string,"slug": string,"updated_at"?: string,"website_url"?: string | null
                  }
                  Update: {
                    "country"?: string | null,"created_at"?: string,"description_en"?: string | null,"description_es"?: string | null,"founded_year"?: number | null,"id"?: string,"logo_url"?: string | null,"name"?: string,"slug"?: string,"updated_at"?: string,"website_url"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"follows": {
                  Row: {
                    "created_at": string,"follower_id": string,"following_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"follower_id": string,"following_id": string
                  }
                  Update: {
                    "created_at"?: string,"follower_id"?: string,"following_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "follows_follower_id_fkey"
      columns: ["follower_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "follows_following_id_fkey"
      columns: ["following_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"fragrance_families": {
                  Row: {
                    "id": number,"name_en": string,"name_es": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: never,"name_en": string,"name_es": string,"slug": string
                  }
                  Update: {
                    "id"?: never,"name_en"?: string,"name_es"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"fragrance_notes": {
                  Row: {
                    "fragrance_id": string,"layer": Database["public"]['Enums']["note_layer"],"note_id": string,"position": number
                  }
                  ComputedFields: never
                  Insert: {
                    "fragrance_id": string,"layer": Database["public"]['Enums']["note_layer"],"note_id": string,"position"?: number
                  }
                  Update: {
                    "fragrance_id"?: string,"layer"?: Database["public"]['Enums']["note_layer"],"note_id"?: string,"position"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "fragrance_notes_fragrance_id_fkey"
      columns: ["fragrance_id"]
isOneToOne: false
      referencedRelation: "fragrances"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fragrance_notes_note_id_fkey"
      columns: ["note_id"]
isOneToOne: false
      referencedRelation: "notes"
      referencedColumns: ["id"]
    }
                  ]
                },"fragrance_perfumers": {
                  Row: {
                    "fragrance_id": string,"perfumer_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "fragrance_id": string,"perfumer_id": string
                  }
                  Update: {
                    "fragrance_id"?: string,"perfumer_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "fragrance_perfumers_fragrance_id_fkey"
      columns: ["fragrance_id"]
isOneToOne: false
      referencedRelation: "fragrances"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fragrance_perfumers_perfumer_id_fkey"
      columns: ["perfumer_id"]
isOneToOne: false
      referencedRelation: "perfumers"
      referencedColumns: ["id"]
    }
                  ]
                },"fragrances": {
                  Row: {
                    "brand_id": string,"concentration": Database["public"]['Enums']["fragrance_concentration"],"created_at": string,"description_en": string | null,"description_es": string | null,"diary_count": number,"family_id": number | null,"id": string,"image_credit": string | null,"image_url": string | null,"name": string,"parent_id": string | null,"rating_avg": number | null,"rating_count": number,"release_year": number | null,"review_count": number,"search_text": string,"slug": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "brand_id": string,"concentration": Database["public"]['Enums']["fragrance_concentration"],"created_at"?: string,"description_en"?: string | null,"description_es"?: string | null,"diary_count"?: number,"family_id"?: number | null,"id"?: string,"image_credit"?: string | null,"image_url"?: string | null,"name": string,"parent_id"?: string | null,"rating_avg"?: number | null,"rating_count"?: number,"release_year"?: number | null,"review_count"?: number,"search_text"?: string,"slug": string,"updated_at"?: string
                  }
                  Update: {
                    "brand_id"?: string,"concentration"?: Database["public"]['Enums']["fragrance_concentration"],"created_at"?: string,"description_en"?: string | null,"description_es"?: string | null,"diary_count"?: number,"family_id"?: number | null,"id"?: string,"image_credit"?: string | null,"image_url"?: string | null,"name"?: string,"parent_id"?: string | null,"rating_avg"?: number | null,"rating_count"?: number,"release_year"?: number | null,"review_count"?: number,"search_text"?: string,"slug"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "fragrances_brand_id_fkey"
      columns: ["brand_id"]
isOneToOne: false
      referencedRelation: "brands"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fragrances_family_id_fkey"
      columns: ["family_id"]
isOneToOne: false
      referencedRelation: "fragrance_families"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fragrances_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "fragrances"
      referencedColumns: ["id"]
    }
                  ]
                },"list_fragrances": {
                  Row: {
                    "added_at": string,"fragrance_id": string,"list_id": string,"note": string | null,"position": number
                  }
                  ComputedFields: never
                  Insert: {
                    "added_at"?: string,"fragrance_id": string,"list_id": string,"note"?: string | null,"position": number
                  }
                  Update: {
                    "added_at"?: string,"fragrance_id"?: string,"list_id"?: string,"note"?: string | null,"position"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "list_fragrances_fragrance_id_fkey"
      columns: ["fragrance_id"]
isOneToOne: false
      referencedRelation: "fragrances"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "list_fragrances_list_id_fkey"
      columns: ["list_id"]
isOneToOne: false
      referencedRelation: "lists"
      referencedColumns: ["id"]
    }
                  ]
                },"list_likes": {
                  Row: {
                    "created_at": string,"list_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"list_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"list_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "list_likes_list_id_fkey"
      columns: ["list_id"]
isOneToOne: false
      referencedRelation: "lists"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "list_likes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"lists": {
                  Row: {
                    "cover_image_url": string | null,"created_at": string,"description": string | null,"id": string,"is_public": boolean,"is_ranked": boolean,"item_count": number,"like_count": number,"title": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cover_image_url"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"is_public"?: boolean,"is_ranked"?: boolean,"item_count"?: number,"like_count"?: number,"title": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "cover_image_url"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"is_public"?: boolean,"is_ranked"?: boolean,"item_count"?: number,"like_count"?: number,"title"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lists_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notes": {
                  Row: {
                    "id": string,"name_en": string,"name_es": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"name_en": string,"name_es": string,"slug": string
                  }
                  Update: {
                    "id"?: string,"name_en"?: string,"name_es"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"perfumers": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"slug": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profile_favorites": {
                  Row: {
                    "fragrance_id": string,"position": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "fragrance_id": string,"position": number,"user_id": string
                  }
                  Update: {
                    "fragrance_id"?: string,"position"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_favorites_fragrance_id_fkey"
      columns: ["fragrance_id"]
isOneToOne: false
      referencedRelation: "fragrances"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profile_favorites_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"bio": string | null,"created_at": string,"display_name": string | null,"id": string,"is_admin": boolean,"locale": string,"updated_at": string,"username": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"bio"?: string | null,"created_at"?: string,"display_name"?: string | null,"id": string,"is_admin"?: boolean,"locale"?: string,"updated_at"?: string,"username": string
                  }
                  Update: {
                    "avatar_url"?: string | null,"bio"?: string | null,"created_at"?: string,"display_name"?: string | null,"id"?: string,"is_admin"?: boolean,"locale"?: string,"updated_at"?: string,"username"?: string
                  }
                  Relationships: [
                    
                  ]
                },"review_comments": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"review_id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"id"?: string,"review_id": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"review_id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "review_comments_review_id_fkey"
      columns: ["review_id"]
isOneToOne: false
      referencedRelation: "reviews"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "review_comments_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"review_likes": {
                  Row: {
                    "created_at": string,"review_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"review_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"review_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "review_likes_review_id_fkey"
      columns: ["review_id"]
isOneToOne: false
      referencedRelation: "reviews"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "review_likes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"reviews": {
                  Row: {
                    "body": string,"comment_count": number,"created_at": string,"fragrance_id": string,"id": string,"like_count": number,"longevity": number | null,"projection": number | null,"sillage": number | null,"updated_at": string,"user_id": string,"value": number | null,"versatility": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"comment_count"?: number,"created_at"?: string,"fragrance_id": string,"id"?: string,"like_count"?: number,"longevity"?: number | null,"projection"?: number | null,"sillage"?: number | null,"updated_at"?: string,"user_id": string,"value"?: number | null,"versatility"?: number | null
                  }
                  Update: {
                    "body"?: string,"comment_count"?: number,"created_at"?: string,"fragrance_id"?: string,"id"?: string,"like_count"?: number,"longevity"?: number | null,"projection"?: number | null,"sillage"?: number | null,"updated_at"?: string,"user_id"?: string,"value"?: number | null,"versatility"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_diary_entry_fk"
      columns: ["user_id","fragrance_id"]
isOneToOne: true
      referencedRelation: "user_fragrances"
      referencedColumns: ["user_id","fragrance_id"]
    },{
      foreignKeyName: "reviews_fragrance_id_fkey"
      columns: ["fragrance_id"]
isOneToOne: false
      referencedRelation: "fragrances"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_fragrances": {
                  Row: {
                    "added_on": string,"created_at": string,"fragrance_id": string,"id": string,"is_private": boolean,"notes": string | null,"rating": number | null,"status": Database["public"]['Enums']["diary_status"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "added_on"?: string,"created_at"?: string,"fragrance_id": string,"id"?: string,"is_private"?: boolean,"notes"?: string | null,"rating"?: number | null,"status": Database["public"]['Enums']["diary_status"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "added_on"?: string,"created_at"?: string,"fragrance_id"?: string,"id"?: string,"is_private"?: boolean,"notes"?: string | null,"rating"?: number | null,"status"?: Database["public"]['Enums']["diary_status"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_fragrances_fragrance_id_fkey"
      columns: ["fragrance_id"]
isOneToOne: false
      referencedRelation: "fragrances"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_fragrances_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_reserved_username":
{ Args: { "name": string }; Returns: boolean
                           },
"normalize_search":
{ Args: { "value": string }; Returns: string
                           },
"refresh_fragrance_diary_stats":
{ Args: { "target": string }; Returns: undefined
                           }
          }
          Enums: {
            "activity_type": "diary_entry"|"review"|"list"|"follow","diary_status": "owned"|"tested"|"wishlist"|"finished","fragrance_concentration": "edc"|"edt"|"edp"|"parfum"|"extrait"|"other","note_layer": "top"|"heart"|"base"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "activity_type": ["diary_entry", "review", "list", "follow"],"diary_status": ["owned", "tested", "wishlist", "finished"],"fragrance_concentration": ["edc", "edt", "edp", "parfum", "extrait", "other"],"note_layer": ["top", "heart", "base"]
          }
        }
} as const
