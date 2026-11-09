
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
            "account_deletion_requests": {
                  Row: {
                    "created_at": string,"id": string,"reason": string | null,"status": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"reason"?: string | null,"status"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"reason"?: string | null,"status"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "account_deletion_requests_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"announcement_reads": {
                  Row: {
                    "announcement_id": string,"id": string,"read_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "announcement_id": string,"id"?: string,"read_at"?: string,"user_id": string
                  }
                  Update: {
                    "announcement_id"?: string,"id"?: string,"read_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "announcement_reads_announcement_id_fkey"
      columns: ["announcement_id"]
isOneToOne: false
      referencedRelation: "announcements"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "announcement_reads_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"announcements": {
                  Row: {
                    "audience": Database["public"]['Enums']["announcement_audience"],"body": string,"created_at": string,"cta_label": string | null,"cta_url": string | null,"expires_at": string | null,"fanned_out_at": string | null,"id": string,"is_draft": boolean,"is_pinned": boolean,"kind": Database["public"]['Enums']["announcement_kind"],"pin_until": string | null,"program_id": string | null,"publish_at": string,"title": string,"updated_at": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "audience"?: Database["public"]['Enums']["announcement_audience"],"body": string,"created_at"?: string,"cta_label"?: string | null,"cta_url"?: string | null,"expires_at"?: string | null,"fanned_out_at"?: string | null,"id"?: string,"is_draft"?: boolean,"is_pinned"?: boolean,"kind"?: Database["public"]['Enums']["announcement_kind"],"pin_until"?: string | null,"program_id"?: string | null,"publish_at"?: string,"title": string,"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "audience"?: Database["public"]['Enums']["announcement_audience"],"body"?: string,"created_at"?: string,"cta_label"?: string | null,"cta_url"?: string | null,"expires_at"?: string | null,"fanned_out_at"?: string | null,"id"?: string,"is_draft"?: boolean,"is_pinned"?: boolean,"kind"?: Database["public"]['Enums']["announcement_kind"],"pin_until"?: string | null,"program_id"?: string | null,"publish_at"?: string,"title"?: string,"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "announcements_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "programs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "announcements_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_role": string | null,"created_at": string,"diff": NonNullable<Json>,"entity": string,"entity_id": string,"id": string,"ip_address": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_role"?: string | null,"created_at"?: string,"diff"?: NonNullable<Json>,"entity": string,"entity_id": string,"id"?: string,"ip_address"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_role"?: string | null,"created_at"?: string,"diff"?: NonNullable<Json>,"entity"?: string,"entity_id"?: string,"id"?: string,"ip_address"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_log_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"badges": {
                  Row: {
                    "created_at": string,"criteria": NonNullable<Json>,"description": string,"icon_url": string,"id": string,"slug": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"criteria"?: NonNullable<Json>,"description": string,"icon_url": string,"id"?: string,"slug": string,"title": string
                  }
                  Update: {
                    "created_at"?: string,"criteria"?: NonNullable<Json>,"description"?: string,"icon_url"?: string,"id"?: string,"slug"?: string,"title"?: string
                  }
                  Relationships: [
                    
                  ]
                },"bundle_items": {
                  Row: {
                    "bundle_id": string,"created_at": string,"id": string,"program_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bundle_id": string,"created_at"?: string,"id"?: string,"program_id": string
                  }
                  Update: {
                    "bundle_id"?: string,"created_at"?: string,"id"?: string,"program_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "bundle_items_bundle_id_fkey"
      columns: ["bundle_id"]
isOneToOne: false
      referencedRelation: "bundles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bundle_items_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "programs"
      referencedColumns: ["id"]
    }
                  ]
                },"bundles": {
                  Row: {
                    "compare_at_price_paise": number | null,"created_at": string,"description": string,"id": string,"is_published": boolean,"price_paise": number,"slug": string,"thumbnail_url": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "compare_at_price_paise"?: number | null,"created_at"?: string,"description": string,"id"?: string,"is_published"?: boolean,"price_paise": number,"slug": string,"thumbnail_url"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "compare_at_price_paise"?: number | null,"created_at"?: string,"description"?: string,"id"?: string,"is_published"?: boolean,"price_paise"?: number,"slug"?: string,"thumbnail_url"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"certificates": {
                  Row: {
                    "certificate_code": string,"created_at": string,"id": string,"issued_at": string,"metadata": NonNullable<Json>,"program_id": string,"title": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "certificate_code": string,"created_at"?: string,"id"?: string,"issued_at"?: string,"metadata"?: NonNullable<Json>,"program_id": string,"title": string,"user_id": string
                  }
                  Update: {
                    "certificate_code"?: string,"created_at"?: string,"id"?: string,"issued_at"?: string,"metadata"?: NonNullable<Json>,"program_id"?: string,"title"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "certificates_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "programs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "certificates_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"comments": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"is_hidden": boolean,"post_id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"id"?: string,"is_hidden"?: boolean,"post_id": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"is_hidden"?: boolean,"post_id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "comments_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"coupon_redemptions": {
                  Row: {
                    "coupon_id": string,"created_at": string,"discount_paise": number,"id": string,"order_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "coupon_id": string,"created_at"?: string,"discount_paise": number,"id"?: string,"order_id": string,"user_id": string
                  }
                  Update: {
                    "coupon_id"?: string,"created_at"?: string,"discount_paise"?: number,"id"?: string,"order_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "coupon_redemptions_coupon_id_fkey"
      columns: ["coupon_id"]
isOneToOne: false
      referencedRelation: "coupons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "coupon_redemptions_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "coupon_redemptions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"coupons": {
                  Row: {
                    "applicable_program_ids": (string)[] | null,"code": string,"created_at": string,"discount_type": Database["public"]['Enums']["discount_type"],"id": string,"is_active": boolean,"max_uses": number | null,"per_user_limit": number,"updated_at": string,"used_count": number,"valid_from": string,"valid_until": string | null,"value": number
                  }
                  ComputedFields: never
                  Insert: {
                    "applicable_program_ids"?: (string)[] | null,"code": string,"created_at"?: string,"discount_type": Database["public"]['Enums']["discount_type"],"id"?: string,"is_active"?: boolean,"max_uses"?: number | null,"per_user_limit"?: number,"updated_at"?: string,"used_count"?: number,"valid_from"?: string,"valid_until"?: string | null,"value": number
                  }
                  Update: {
                    "applicable_program_ids"?: (string)[] | null,"code"?: string,"created_at"?: string,"discount_type"?: Database["public"]['Enums']["discount_type"],"id"?: string,"is_active"?: boolean,"max_uses"?: number | null,"per_user_limit"?: number,"updated_at"?: string,"used_count"?: number,"valid_from"?: string,"valid_until"?: string | null,"value"?: number
                  }
                  Relationships: [
                    
                  ]
                },"course_sections": {
                  Row: {
                    "created_at": string,"description": string | null,"id": string,"program_id": string,"sort_order": number,"thumbnail_url": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"program_id": string,"sort_order"?: number,"thumbnail_url"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"program_id"?: string,"sort_order"?: number,"thumbnail_url"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "course_sections_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "programs"
      referencedColumns: ["id"]
    }
                  ]
                },"enrollments": {
                  Row: {
                    "access_until": string | null,"created_at": string,"enrolled_at": string,"id": string,"order_id": string | null,"payment_id": string | null,"program_id": string,"source": Database["public"]['Enums']["enrollment_source"],"status": Database["public"]['Enums']["enrollment_status"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "access_until"?: string | null,"created_at"?: string,"enrolled_at"?: string,"id"?: string,"order_id"?: string | null,"payment_id"?: string | null,"program_id": string,"source"?: Database["public"]['Enums']["enrollment_source"],"status"?: Database["public"]['Enums']["enrollment_status"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "access_until"?: string | null,"created_at"?: string,"enrolled_at"?: string,"id"?: string,"order_id"?: string | null,"payment_id"?: string | null,"program_id"?: string,"source"?: Database["public"]['Enums']["enrollment_source"],"status"?: Database["public"]['Enums']["enrollment_status"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "enrollments_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "enrollments_payment_id_fkey"
      columns: ["payment_id"]
isOneToOne: false
      referencedRelation: "payments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "enrollments_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "programs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "enrollments_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"faqs": {
                  Row: {
                    "answer": string,"category": string,"created_at": string,"id": string,"is_published": boolean,"program_id": string | null,"question": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answer": string,"category"?: string,"created_at"?: string,"id"?: string,"is_published"?: boolean,"program_id"?: string | null,"question": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "answer"?: string,"category"?: string,"created_at"?: string,"id"?: string,"is_published"?: boolean,"program_id"?: string | null,"question"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "faqs_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "programs"
      referencedColumns: ["id"]
    }
                  ]
                },"lesson_media": {
                  Row: {
                    "attachments": NonNullable<Json>,"content_url": string | null,"created_at": string,"id": string,"lesson_id": string,"subtitles": NonNullable<Json>,"updated_at": string,"video_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "attachments"?: NonNullable<Json>,"content_url"?: string | null,"created_at"?: string,"id"?: string,"lesson_id": string,"subtitles"?: NonNullable<Json>,"updated_at"?: string,"video_id"?: string | null
                  }
                  Update: {
                    "attachments"?: NonNullable<Json>,"content_url"?: string | null,"created_at"?: string,"id"?: string,"lesson_id"?: string,"subtitles"?: NonNullable<Json>,"updated_at"?: string,"video_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "fk_lesson_media_video"
      columns: ["video_id"]
isOneToOne: false
      referencedRelation: "videos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lesson_media_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: true
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    }
                  ]
                },"lesson_progress": {
                  Row: {
                    "completed": boolean,"completed_at": string | null,"created_at": string,"id": string,"last_position_seconds": number,"lesson_id": string,"updated_at": string,"user_id": string,"watch_time_seconds": number
                  }
                  ComputedFields: never
                  Insert: {
                    "completed"?: boolean,"completed_at"?: string | null,"created_at"?: string,"id"?: string,"last_position_seconds"?: number,"lesson_id": string,"updated_at"?: string,"user_id": string,"watch_time_seconds"?: number
                  }
                  Update: {
                    "completed"?: boolean,"completed_at"?: string | null,"created_at"?: string,"id"?: string,"last_position_seconds"?: number,"lesson_id"?: string,"updated_at"?: string,"user_id"?: string,"watch_time_seconds"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "lesson_progress_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: false
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lesson_progress_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"lessons": {
                  Row: {
                    "created_at": string,"description": string | null,"duration_seconds": number,"id": string,"is_free_preview": boolean,"is_published": boolean,"release_at": string | null,"section_id": string,"sort_order": number,"thumbnail_url": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"duration_seconds"?: number,"id"?: string,"is_free_preview"?: boolean,"is_published"?: boolean,"release_at"?: string | null,"section_id": string,"sort_order"?: number,"thumbnail_url"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"duration_seconds"?: number,"id"?: string,"is_free_preview"?: boolean,"is_published"?: boolean,"release_at"?: string | null,"section_id"?: string,"sort_order"?: number,"thumbnail_url"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lessons_section_id_fkey"
      columns: ["section_id"]
isOneToOne: false
      referencedRelation: "course_sections"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"is_read": boolean,"link_url": string | null,"notification_dedupe_key": string | null,"title": string,"type": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"id"?: string,"is_read"?: boolean,"link_url"?: string | null,"notification_dedupe_key"?: string | null,"title": string,"type"?: string,"user_id": string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"is_read"?: boolean,"link_url"?: string | null,"notification_dedupe_key"?: string | null,"title"?: string,"type"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"orders": {
                  Row: {
                    "amount_paise": number,"bundle_id": string | null,"coupon_id": string | null,"created_at": string,"discount_paise": number,"id": string,"program_id": string | null,"razorpay_order_id": string | null,"status": Database["public"]['Enums']["order_status"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_paise": number,"bundle_id"?: string | null,"coupon_id"?: string | null,"created_at"?: string,"discount_paise"?: number,"id"?: string,"program_id"?: string | null,"razorpay_order_id"?: string | null,"status"?: Database["public"]['Enums']["order_status"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "amount_paise"?: number,"bundle_id"?: string | null,"coupon_id"?: string | null,"created_at"?: string,"discount_paise"?: number,"id"?: string,"program_id"?: string | null,"razorpay_order_id"?: string | null,"status"?: Database["public"]['Enums']["order_status"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "orders_bundle_id_fkey"
      columns: ["bundle_id"]
isOneToOne: false
      referencedRelation: "bundles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_coupon_id_fkey"
      columns: ["coupon_id"]
isOneToOne: false
      referencedRelation: "coupons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "programs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"payments": {
                  Row: {
                    "amount_paise": number,"captured_at": string | null,"created_at": string,"id": string,"method": string | null,"order_id": string,"raw_payload": NonNullable<Json>,"razorpay_payment_id": string | null,"razorpay_signature": string | null,"refunded_amount_paise": number,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_paise": number,"captured_at"?: string | null,"created_at"?: string,"id"?: string,"method"?: string | null,"order_id": string,"raw_payload"?: NonNullable<Json>,"razorpay_payment_id"?: string | null,"razorpay_signature"?: string | null,"refunded_amount_paise"?: number,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "amount_paise"?: number,"captured_at"?: string | null,"created_at"?: string,"id"?: string,"method"?: string | null,"order_id"?: string,"raw_payload"?: NonNullable<Json>,"razorpay_payment_id"?: string | null,"razorpay_signature"?: string | null,"refunded_amount_paise"?: number,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"piracy_flags": {
                  Row: {
                    "created_at": string,"evidence": NonNullable<Json>,"id": string,"reason": string,"status": string,"user_id": string,"video_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"evidence"?: NonNullable<Json>,"id"?: string,"reason": string,"status"?: string,"user_id": string,"video_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"evidence"?: NonNullable<Json>,"id"?: string,"reason"?: string,"status"?: string,"user_id"?: string,"video_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "piracy_flags_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "piracy_flags_video_id_fkey"
      columns: ["video_id"]
isOneToOne: false
      referencedRelation: "videos"
      referencedColumns: ["id"]
    }
                  ]
                },"post_likes": {
                  Row: {
                    "created_at": string,"id": string,"post_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"post_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"post_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_likes_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_likes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"post_reports": {
                  Row: {
                    "comment_id": string | null,"created_at": string,"id": string,"post_id": string | null,"reason": string,"reported_by": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "comment_id"?: string | null,"created_at"?: string,"id"?: string,"post_id"?: string | null,"reason": string,"reported_by": string,"status"?: string
                  }
                  Update: {
                    "comment_id"?: string | null,"created_at"?: string,"id"?: string,"post_id"?: string | null,"reason"?: string,"reported_by"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_reports_comment_id_fkey"
      columns: ["comment_id"]
isOneToOne: false
      referencedRelation: "comments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_reports_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_reports_reported_by_fkey"
      columns: ["reported_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"posts": {
                  Row: {
                    "body": string,"comments_count": number,"created_at": string,"id": string,"is_hidden": boolean,"is_pinned": boolean,"likes_count": number,"program_id": string,"title": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"comments_count"?: number,"created_at"?: string,"id"?: string,"is_hidden"?: boolean,"is_pinned"?: boolean,"likes_count"?: number,"program_id": string,"title"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "body"?: string,"comments_count"?: number,"created_at"?: string,"id"?: string,"is_hidden"?: boolean,"is_pinned"?: boolean,"likes_count"?: number,"program_id"?: string,"title"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "posts_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "programs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "posts_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"created_at": string,"full_name": string | null,"goal_pillars": (string)[] | null,"goal_tag": string | null,"id": string,"is_blocked": boolean,"last_seen_at": string | null,"onboarding_completed_at": string | null,"phone": string | null,"referral_source": string | null,"role": Database["public"]['Enums']["user_role"],"terms_accepted_at": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"created_at"?: string,"full_name"?: string | null,"goal_pillars"?: (string)[] | null,"goal_tag"?: string | null,"id": string,"is_blocked"?: boolean,"last_seen_at"?: string | null,"onboarding_completed_at"?: string | null,"phone"?: string | null,"referral_source"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"terms_accepted_at"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"created_at"?: string,"full_name"?: string | null,"goal_pillars"?: (string)[] | null,"goal_tag"?: string | null,"id"?: string,"is_blocked"?: boolean,"last_seen_at"?: string | null,"onboarding_completed_at"?: string | null,"phone"?: string | null,"referral_source"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"terms_accepted_at"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"program_sessions": {
                  Row: {
                    "created_at": string,"day_number": number,"description": string | null,"id": string,"live_platform": Database["public"]['Enums']["live_platform"],"program_id": string,"resources": NonNullable<Json>,"scheduled_at": string,"status": Database["public"]['Enums']["session_status"],"task_body": string | null,"task_title": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"day_number": number,"description"?: string | null,"id"?: string,"live_platform"?: Database["public"]['Enums']["live_platform"],"program_id": string,"resources"?: NonNullable<Json>,"scheduled_at": string,"status"?: Database["public"]['Enums']["session_status"],"task_body"?: string | null,"task_title"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"day_number"?: number,"description"?: string | null,"id"?: string,"live_platform"?: Database["public"]['Enums']["live_platform"],"program_id"?: string,"resources"?: NonNullable<Json>,"scheduled_at"?: string,"status"?: Database["public"]['Enums']["session_status"],"task_body"?: string | null,"task_title"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "program_sessions_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "programs"
      referencedColumns: ["id"]
    }
                  ]
                },"programs": {
                  Row: {
                    "category": Database["public"]['Enums']["program_category"],"compare_at_price_paise": number | null,"cover_image_alt": string | null,"cover_image_url": string | null,"cover_srcset": Json | null,"created_at": string,"deleted_at": string | null,"description": string,"ends_at": string | null,"enrollment_deadline": string | null,"faq": NonNullable<Json>,"id": string,"is_featured": boolean,"is_trending_pinned": boolean,"max_seats": number | null,"poster_image_alt": string | null,"poster_image_url": string | null,"poster_srcset": Json | null,"price_paise": number,"promo_video_url": string | null,"short_description": string,"slug": string,"sort_order": number,"starts_at": string | null,"status": Database["public"]['Enums']["program_status"],"tags": (string)[],"thumbnail_alt": string | null,"thumbnail_srcset": Json | null,"thumbnail_url": string | null,"title": string,"type": Database["public"]['Enums']["program_type"],"updated_at": string,"what_you_will_learn": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "category": Database["public"]['Enums']["program_category"],"compare_at_price_paise"?: number | null,"cover_image_alt"?: string | null,"cover_image_url"?: string | null,"cover_srcset"?: Json | null,"created_at"?: string,"deleted_at"?: string | null,"description": string,"ends_at"?: string | null,"enrollment_deadline"?: string | null,"faq"?: NonNullable<Json>,"id"?: string,"is_featured"?: boolean,"is_trending_pinned"?: boolean,"max_seats"?: number | null,"poster_image_alt"?: string | null,"poster_image_url"?: string | null,"poster_srcset"?: Json | null,"price_paise"?: number,"promo_video_url"?: string | null,"short_description": string,"slug": string,"sort_order"?: number,"starts_at"?: string | null,"status"?: Database["public"]['Enums']["program_status"],"tags"?: (string)[],"thumbnail_alt"?: string | null,"thumbnail_srcset"?: Json | null,"thumbnail_url"?: string | null,"title": string,"type": Database["public"]['Enums']["program_type"],"updated_at"?: string,"what_you_will_learn"?: NonNullable<Json>
                  }
                  Update: {
                    "category"?: Database["public"]['Enums']["program_category"],"compare_at_price_paise"?: number | null,"cover_image_alt"?: string | null,"cover_image_url"?: string | null,"cover_srcset"?: Json | null,"created_at"?: string,"deleted_at"?: string | null,"description"?: string,"ends_at"?: string | null,"enrollment_deadline"?: string | null,"faq"?: NonNullable<Json>,"id"?: string,"is_featured"?: boolean,"is_trending_pinned"?: boolean,"max_seats"?: number | null,"poster_image_alt"?: string | null,"poster_image_url"?: string | null,"poster_srcset"?: Json | null,"price_paise"?: number,"promo_video_url"?: string | null,"short_description"?: string,"slug"?: string,"sort_order"?: number,"starts_at"?: string | null,"status"?: Database["public"]['Enums']["program_status"],"tags"?: (string)[],"thumbnail_alt"?: string | null,"thumbnail_srcset"?: Json | null,"thumbnail_url"?: string | null,"title"?: string,"type"?: Database["public"]['Enums']["program_type"],"updated_at"?: string,"what_you_will_learn"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"quiz_attempts": {
                  Row: {
                    "answers": NonNullable<Json>,"created_at": string,"id": string,"passed": boolean,"quiz_id": string,"score_percent": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answers"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"passed"?: boolean,"quiz_id": string,"score_percent": number,"user_id": string
                  }
                  Update: {
                    "answers"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"passed"?: boolean,"quiz_id"?: string,"score_percent"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "quiz_attempts_quiz_id_fkey"
      columns: ["quiz_id"]
isOneToOne: false
      referencedRelation: "quizzes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quiz_attempts_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"quiz_questions": {
                  Row: {
                    "correct_option_index": number,"created_at": string,"explanation": string | null,"id": string,"options": NonNullable<Json>,"question_text": string,"quiz_id": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "correct_option_index": number,"created_at"?: string,"explanation"?: string | null,"id"?: string,"options": NonNullable<Json>,"question_text": string,"quiz_id": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "correct_option_index"?: number,"created_at"?: string,"explanation"?: string | null,"id"?: string,"options"?: NonNullable<Json>,"question_text"?: string,"quiz_id"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "quiz_questions_quiz_id_fkey"
      columns: ["quiz_id"]
isOneToOne: false
      referencedRelation: "quizzes"
      referencedColumns: ["id"]
    }
                  ]
                },"quizzes": {
                  Row: {
                    "created_at": string,"description": string | null,"id": string,"lesson_id": string | null,"passing_score_percent": number,"program_id": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"lesson_id"?: string | null,"passing_score_percent"?: number,"program_id"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"lesson_id"?: string | null,"passing_score_percent"?: number,"program_id"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "quizzes_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: false
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quizzes_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "programs"
      referencedColumns: ["id"]
    }
                  ]
                },"reviews": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"is_published": boolean,"program_id": string,"rating": number,"title": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"id"?: string,"is_published"?: boolean,"program_id": string,"rating": number,"title"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"is_published"?: boolean,"program_id"?: string,"rating"?: number,"title"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "programs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"session_attendance": {
                  Row: {
                    "attended_at": string,"duration_minutes": number | null,"id": string,"session_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attended_at"?: string,"duration_minutes"?: number | null,"id"?: string,"session_id": string,"user_id": string
                  }
                  Update: {
                    "attended_at"?: string,"duration_minutes"?: number | null,"id"?: string,"session_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "session_attendance_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "program_sessions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "session_attendance_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"session_links": {
                  Row: {
                    "created_at": string,"id": string,"link_published_at": string | null,"link_published_by": string | null,"live_url": string | null,"recording_url": string | null,"recording_visible": boolean,"session_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"link_published_at"?: string | null,"link_published_by"?: string | null,"live_url"?: string | null,"recording_url"?: string | null,"recording_visible"?: boolean,"session_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"link_published_at"?: string | null,"link_published_by"?: string | null,"live_url"?: string | null,"recording_url"?: string | null,"recording_visible"?: boolean,"session_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "session_links_session_id_fkey"
      columns: ["session_id"]
isOneToOne: true
      referencedRelation: "program_sessions"
      referencedColumns: ["id"]
    }
                  ]
                },"site_content": {
                  Row: {
                    "created_at": string,"id": string,"key": string,"updated_at": string,"updated_by": string | null,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"key": string,"updated_at"?: string,"updated_by"?: string | null,"value"?: NonNullable<Json>
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"key"?: string,"updated_at"?: string,"updated_by"?: string | null,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "site_content_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"site_settings": {
                  Row: {
                    "brand_name": string,"created_at": string,"gst_number": string | null,"id": boolean,"legal_text": string | null,"maintenance_mode": boolean,"razorpay_mode": string,"support_email": string,"support_whatsapp": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "brand_name"?: string,"created_at"?: string,"gst_number"?: string | null,"id"?: boolean,"legal_text"?: string | null,"maintenance_mode"?: boolean,"razorpay_mode"?: string,"support_email"?: string,"support_whatsapp"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "brand_name"?: string,"created_at"?: string,"gst_number"?: string | null,"id"?: boolean,"legal_text"?: string | null,"maintenance_mode"?: boolean,"razorpay_mode"?: string,"support_email"?: string,"support_whatsapp"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"testimonials": {
                  Row: {
                    "author_avatar_url": string | null,"author_name": string,"author_role": string | null,"content": string,"created_at": string,"id": string,"is_featured": boolean,"program_id": string | null,"rating": number | null,"sort_order": number,"updated_at": string,"video_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "author_avatar_url"?: string | null,"author_name": string,"author_role"?: string | null,"content": string,"created_at"?: string,"id"?: string,"is_featured"?: boolean,"program_id"?: string | null,"rating"?: number | null,"sort_order"?: number,"updated_at"?: string,"video_url"?: string | null
                  }
                  Update: {
                    "author_avatar_url"?: string | null,"author_name"?: string,"author_role"?: string | null,"content"?: string,"created_at"?: string,"id"?: string,"is_featured"?: boolean,"program_id"?: string | null,"rating"?: number | null,"sort_order"?: number,"updated_at"?: string,"video_url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "testimonials_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "programs"
      referencedColumns: ["id"]
    }
                  ]
                },"user_badges": {
                  Row: {
                    "awarded_at": string,"badge_id": string,"id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "awarded_at"?: string,"badge_id": string,"id"?: string,"user_id": string
                  }
                  Update: {
                    "awarded_at"?: string,"badge_id"?: string,"id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_badges_badge_id_fkey"
      columns: ["badge_id"]
isOneToOne: false
      referencedRelation: "badges"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_badges_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"video_access_logs": {
                  Row: {
                    "created_at": string,"id": string,"segments_requested": number,"session_id": string | null,"user_id": string,"video_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"segments_requested"?: number,"session_id"?: string | null,"user_id": string,"video_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"segments_requested"?: number,"session_id"?: string | null,"user_id"?: string,"video_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "video_access_logs_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "video_sessions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "video_access_logs_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "video_access_logs_video_id_fkey"
      columns: ["video_id"]
isOneToOne: false
      referencedRelation: "videos"
      referencedColumns: ["id"]
    }
                  ]
                },"video_keys": {
                  Row: {
                    "created_at": string,"encrypted_key": string,"id": string,"video_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"encrypted_key": string,"id"?: string,"video_id": string
                  }
                  Update: {
                    "created_at"?: string,"encrypted_key"?: string,"id"?: string,"video_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "video_keys_video_id_fkey"
      columns: ["video_id"]
isOneToOne: true
      referencedRelation: "videos"
      referencedColumns: ["id"]
    }
                  ]
                },"video_sessions": {
                  Row: {
                    "created_at": string,"device_id": string,"id": string,"ip_address": string | null,"is_active": boolean,"last_heartbeat": string,"user_id": string,"video_id": string,"watermark_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"device_id": string,"id"?: string,"ip_address"?: string | null,"is_active"?: boolean,"last_heartbeat"?: string,"user_id": string,"video_id": string,"watermark_id": string
                  }
                  Update: {
                    "created_at"?: string,"device_id"?: string,"id"?: string,"ip_address"?: string | null,"is_active"?: boolean,"last_heartbeat"?: string,"user_id"?: string,"video_id"?: string,"watermark_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "video_sessions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "video_sessions_video_id_fkey"
      columns: ["video_id"]
isOneToOne: false
      referencedRelation: "videos"
      referencedColumns: ["id"]
    }
                  ]
                },"videos": {
                  Row: {
                    "created_at": string,"duration_seconds": number,"error": string | null,"id": string,"lesson_id": string | null,"original_filename": string,"progress": number,"renditions": NonNullable<Json>,"size_bytes": number,"status": Database["public"]['Enums']["video_status"],"thumbnail_path": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"duration_seconds"?: number,"error"?: string | null,"id"?: string,"lesson_id"?: string | null,"original_filename": string,"progress"?: number,"renditions"?: NonNullable<Json>,"size_bytes"?: number,"status"?: Database["public"]['Enums']["video_status"],"thumbnail_path"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"duration_seconds"?: number,"error"?: string | null,"id"?: string,"lesson_id"?: string | null,"original_filename"?: string,"progress"?: number,"renditions"?: NonNullable<Json>,"size_bytes"?: number,"status"?: Database["public"]['Enums']["video_status"],"thumbnail_path"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "videos_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: false
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    }
                  ]
                },"webhook_events": {
                  Row: {
                    "created_at": string,"error": string | null,"event_id": string,"id": string,"payload": NonNullable<Json>,"processed_at": string | null,"provider": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"error"?: string | null,"event_id": string,"id"?: string,"payload"?: NonNullable<Json>,"processed_at"?: string | null,"provider"?: string
                  }
                  Update: {
                    "created_at"?: string,"error"?: string | null,"event_id"?: string,"id"?: string,"payload"?: NonNullable<Json>,"processed_at"?: string | null,"provider"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "save_session_with_links": {
              Args: {
                "p_day_number": number,
                "p_description"?: string | null,
                "p_is_link_published"?: boolean,
                "p_live_platform"?: Database["public"]['Enums']["live_platform"],
                "p_live_url"?: string | null,
                "p_notify_enrollees"?: boolean,
                "p_program_id": string,
                "p_recording_url"?: string | null,
                "p_recording_visible"?: boolean,
                "p_resources"?: Json,
                "p_scheduled_at": string,
                "p_session_id"?: string | null,
                "p_status"?: Database["public"]['Enums']["session_status"],
                "p_task_body"?: string | null,
                "p_task_title"?: string | null,
                "p_title": string
              },
              Returns: Json
            },
            "upsert_session_with_links": {
              Args: {
                "p_day_number": number,
                "p_description"?: string | null,
                "p_is_link_published"?: boolean,
                "p_live_platform"?: Database["public"]['Enums']["live_platform"],
                "p_live_url"?: string | null,
                "p_notify_enrollees"?: boolean,
                "p_program_id": string,
                "p_recording_url"?: string | null,
                "p_recording_visible"?: boolean,
                "p_resources"?: Json,
                "p_scheduled_at": string,
                "p_session_id"?: string | null,
                "p_status"?: Database["public"]['Enums']["session_status"],
                "p_task_body"?: string | null,
                "p_task_title"?: string | null,
                "p_title": string
              },
              Returns: Json
            },
            "publish_session_link": {
              Args: {
                "p_force_renotify"?: boolean,
                "p_live_url": string,
                "p_notify_enrollees"?: boolean,
                "p_session_id": string
              },
              Returns: Json
            },
            "fan_out_scheduled_announcements": {
              Args: Record<PropertyKey, never>,
              Returns: Json
            },
            "generate_challenge_schedule": {
              Args: {
                "p_daily_time_ist": string,
                "p_overwrite"?: boolean,
                "p_program_id": string,
                "p_start_date": string,
                "p_total_days": number
              },
              Returns: Json
            },
            "shift_challenge_schedule": {
              Args: {
                "p_program_id": string,
                "p_shift_days": number
              },
              Returns: Json
            },
            "can_view_lesson":
{ Args: { "p_lesson_id": string }; Returns: boolean
                           },
"get_my_programs":
{ Args: Record<PropertyKey, never>; Returns: {
              "access_until": string,"attended_sessions": number,"category": Database["public"]['Enums']["program_category"],"completed_lessons": number,"cover_image_alt": string,"cover_image_url": string,"ends_at": string,"enrolled_at": string,"enrollment_status": Database["public"]['Enums']["enrollment_status"],"poster_image_alt": string,"poster_image_url": string,"program_id": string,"short_description": string,"slug": string,"starts_at": string,"status": Database["public"]['Enums']["program_status"],"thumbnail_alt": string,"thumbnail_url": string,"title": string,"total_lessons": number,"total_sessions": number,"type": Database["public"]['Enums']["program_type"]
            }[]
                           },
"get_public_stats":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"grant_enrollment":
{ Args: { "p_amount_paise"?: number,"p_method"?: string,"p_order_id": string,"p_raw_payload"?: Json,"p_razorpay_payment_id"?: string,"p_razorpay_signature"?: string }; Returns: {
              "access_until": string | null,
"created_at": string,
"enrolled_at": string,
"id": string,
"order_id": string | null,
"payment_id": string | null,
"program_id": string,
"source": Database["public"]['Enums']["enrollment_source"],
"status": Database["public"]['Enums']["enrollment_status"],
"updated_at": string,
"user_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "enrollments"
        isOneToOne: true
        isSetofReturn: false
      } },
"has_active_enrollment":
{ Args: { "p_program_id": string }; Returns: boolean
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_staff_or_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"mark_announcement_read":
{ Args: { "p_announcement_id": string }; Returns: undefined
                           },
"mark_notification_read":
{ Args: { "p_notification_id": string }; Returns: undefined
                           },
"show_limit":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"show_trgm":
{ Args: { "": string }; Returns: (string)[]
                           }
          }
          Enums: {
            "announcement_audience": "all"|"program"|"user","announcement_kind": "info"|"success"|"warning"|"urgent","discount_type": "percent"|"flat","enrollment_source": "paid"|"manual"|"coupon_free","enrollment_status": "active"|"refunded"|"revoked","live_platform": "zoom"|"meet"|"youtube"|"other","order_status": "created"|"paid"|"failed"|"refunded","program_category": "emotional"|"mental"|"academic"|"personal","program_status": "draft"|"published"|"live"|"completed"|"archived","program_type": "challenge"|"course","session_status": "scheduled"|"live"|"ended","user_role": "admin"|"staff"|"student","video_status": "uploading"|"queued"|"transcoding"|"ready"|"failed"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"storage": {
          Tables: {
            "buckets": {
                  Row: {
                    "allowed_mime_types": (string)[] | null,"avif_autodetection": boolean | null,"created_at": string | null,"file_size_limit": number | null,"id": string,"lifecycle_configuration": Json | null,"lifecycle_configuration_generation": string | null,"name": string,"owner": string | null,"owner_id": string | null,"public": boolean | null,"type": Database["storage"]['Enums']["buckettype"],"updated_at": string | null,"versioning_status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "allowed_mime_types"?: (string)[] | null,"avif_autodetection"?: boolean | null,"created_at"?: string | null,"file_size_limit"?: number | null,"id": string,"lifecycle_configuration"?: Json | null,"lifecycle_configuration_generation"?: string | null,"name": string,"owner"?: string | null,"owner_id"?: string | null,"public"?: boolean | null,"type"?: Database["storage"]['Enums']["buckettype"],"updated_at"?: string | null,"versioning_status"?: string
                  }
                  Update: {
                    "allowed_mime_types"?: (string)[] | null,"avif_autodetection"?: boolean | null,"created_at"?: string | null,"file_size_limit"?: number | null,"id"?: string,"lifecycle_configuration"?: Json | null,"lifecycle_configuration_generation"?: string | null,"name"?: string,"owner"?: string | null,"owner_id"?: string | null,"public"?: boolean | null,"type"?: Database["storage"]['Enums']["buckettype"],"updated_at"?: string | null,"versioning_status"?: string
                  }
                  Relationships: [
                    
                  ]
                },"buckets_analytics": {
                  Row: {
                    "created_at": string,"deleted_at": string | null,"format": string,"id": string,"name": string,"type": Database["storage"]['Enums']["buckettype"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"deleted_at"?: string | null,"format"?: string,"id"?: string,"name": string,"type"?: Database["storage"]['Enums']["buckettype"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"deleted_at"?: string | null,"format"?: string,"id"?: string,"name"?: string,"type"?: Database["storage"]['Enums']["buckettype"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"buckets_vectors": {
                  Row: {
                    "created_at": string,"id": string,"type": Database["storage"]['Enums']["buckettype"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id": string,"type"?: Database["storage"]['Enums']["buckettype"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"type"?: Database["storage"]['Enums']["buckettype"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"iceberg_namespaces": {
                  Row: {
                    "bucket_name": string,"catalog_id": string,"created_at": string,"id": string,"metadata": NonNullable<Json>,"name": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bucket_name": string,"catalog_id": string,"created_at"?: string,"id"?: string,"metadata"?: NonNullable<Json>,"name": string,"updated_at"?: string
                  }
                  Update: {
                    "bucket_name"?: string,"catalog_id"?: string,"created_at"?: string,"id"?: string,"metadata"?: NonNullable<Json>,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "iceberg_namespaces_catalog_id_fkey"
      columns: ["catalog_id"]
isOneToOne: false
      referencedRelation: "buckets_analytics"
      referencedColumns: ["id"]
    }
                  ]
                },"iceberg_tables": {
                  Row: {
                    "bucket_name": string,"catalog_id": string,"created_at": string,"id": string,"location": string,"name": string,"namespace_id": string,"remote_table_id": string | null,"shard_id": string | null,"shard_key": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bucket_name": string,"catalog_id": string,"created_at"?: string,"id"?: string,"location": string,"name": string,"namespace_id": string,"remote_table_id"?: string | null,"shard_id"?: string | null,"shard_key"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "bucket_name"?: string,"catalog_id"?: string,"created_at"?: string,"id"?: string,"location"?: string,"name"?: string,"namespace_id"?: string,"remote_table_id"?: string | null,"shard_id"?: string | null,"shard_key"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "iceberg_tables_catalog_id_fkey"
      columns: ["catalog_id"]
isOneToOne: false
      referencedRelation: "buckets_analytics"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "iceberg_tables_namespace_id_fkey"
      columns: ["namespace_id"]
isOneToOne: false
      referencedRelation: "iceberg_namespaces"
      referencedColumns: ["id"]
    }
                  ]
                },"migrations": {
                  Row: {
                    "executed_at": string | null,"hash": string,"id": number,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "executed_at"?: string | null,"hash": string,"id": number,"name": string
                  }
                  Update: {
                    "executed_at"?: string | null,"hash"?: string,"id"?: number,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"objects": {
                  Row: {
                    "archived_at": string | null,"bucket_id": string | null,"created_at": string | null,"id": string,"is_delete_marker": boolean,"is_versioned": boolean,"last_accessed_at": string | null,"metadata": Json | null,"name": string | null,"owner": string | null,"owner_id": string | null,"path_tokens": (string)[] | null,"updated_at": string | null,"user_metadata": Json | null,"version": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"bucket_id"?: string | null,"created_at"?: string | null,"id"?: string,"is_delete_marker"?: boolean,"is_versioned"?: boolean,"last_accessed_at"?: string | null,"metadata"?: Json | null,"name"?: string | null,"owner"?: string | null,"owner_id"?: string | null,"path_tokens"?: never,"updated_at"?: string | null,"user_metadata"?: Json | null,"version"?: string | null
                  }
                  Update: {
                    "archived_at"?: string | null,"bucket_id"?: string | null,"created_at"?: string | null,"id"?: string,"is_delete_marker"?: boolean,"is_versioned"?: boolean,"last_accessed_at"?: string | null,"metadata"?: Json | null,"name"?: string | null,"owner"?: string | null,"owner_id"?: string | null,"path_tokens"?: never,"updated_at"?: string | null,"user_metadata"?: Json | null,"version"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "objects_bucketId_fkey"
      columns: ["bucket_id"]
isOneToOne: false
      referencedRelation: "buckets"
      referencedColumns: ["id"]
    }
                  ]
                },"s3_multipart_uploads": {
                  Row: {
                    "bucket_id": string,"created_at": string,"id": string,"in_progress_size": number,"key": string,"metadata": Json | null,"owner_id": string | null,"upload_signature": string,"user_metadata": Json | null,"version": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bucket_id": string,"created_at"?: string,"id": string,"in_progress_size"?: number,"key": string,"metadata"?: Json | null,"owner_id"?: string | null,"upload_signature": string,"user_metadata"?: Json | null,"version": string
                  }
                  Update: {
                    "bucket_id"?: string,"created_at"?: string,"id"?: string,"in_progress_size"?: number,"key"?: string,"metadata"?: Json | null,"owner_id"?: string | null,"upload_signature"?: string,"user_metadata"?: Json | null,"version"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
      columns: ["bucket_id"]
isOneToOne: false
      referencedRelation: "buckets"
      referencedColumns: ["id"]
    }
                  ]
                },"s3_multipart_uploads_parts": {
                  Row: {
                    "bucket_id": string,"created_at": string,"etag": string,"id": string,"key": string,"owner_id": string | null,"part_number": number,"size": number,"upload_id": string,"version": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bucket_id": string,"created_at"?: string,"etag": string,"id"?: string,"key": string,"owner_id"?: string | null,"part_number": number,"size"?: number,"upload_id": string,"version": string
                  }
                  Update: {
                    "bucket_id"?: string,"created_at"?: string,"etag"?: string,"id"?: string,"key"?: string,"owner_id"?: string | null,"part_number"?: number,"size"?: number,"upload_id"?: string,"version"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
      columns: ["bucket_id"]
isOneToOne: false
      referencedRelation: "buckets"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
      columns: ["upload_id"]
isOneToOne: false
      referencedRelation: "s3_multipart_uploads"
      referencedColumns: ["id"]
    }
                  ]
                },"vector_indexes": {
                  Row: {
                    "bucket_id": string,"created_at": string,"data_type": string,"dimension": number,"distance_metric": string,"id": string,"metadata_configuration": Json | null,"name": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bucket_id": string,"created_at"?: string,"data_type": string,"dimension": number,"distance_metric": string,"id"?: string,"metadata_configuration"?: Json | null,"name": string,"updated_at"?: string
                  }
                  Update: {
                    "bucket_id"?: string,"created_at"?: string,"data_type"?: string,"dimension"?: number,"distance_metric"?: string,"id"?: string,"metadata_configuration"?: Json | null,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "vector_indexes_bucket_id_fkey"
      columns: ["bucket_id"]
isOneToOne: false
      referencedRelation: "buckets_vectors"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "allow_any_operation":
{ Args: { "expected_operations": (string)[] }; Returns: boolean
                           },
"allow_only_operation":
{ Args: { "expected_operation": string }; Returns: boolean
                           },
"can_insert_object":
{ Args: { "bucketid": string,"metadata": Json,"name": string,"owner": string }; Returns: undefined
                           },
"extension":
{ Args: { "name": string }; Returns: string
                           },
"filename":
{ Args: { "name": string }; Returns: string
                           },
"foldername":
{ Args: { "name": string }; Returns: (string)[]
                           },
"get_common_prefix":
{ Args: { "p_delimiter": string,"p_key": string,"p_prefix": string }; Returns: string
                           },
"get_size_by_bucket":
{ Args: { "delete_markers"?: string,"noncurrent_versions"?: string }; Returns: {
              "bucket_id": string,"size": number
            }[]
                           },
"list_multipart_uploads_with_delimiter":
{ Args: { "bucket_id": string,"delimiter_param": string,"max_keys"?: number,"next_key_token"?: string,"next_upload_token"?: string,"prefix_param": string,"raw_prefix_param"?: string }; Returns: {
              "created_at": string,"id": string,"key": string
            }[]
                           },
"list_objects_with_delimiter":
{ Args: { "_bucket_id": string,"delete_markers"?: string,"delimiter_param": string,"max_keys"?: number,"next_token"?: string,"next_token_archived_at"?: string,"next_token_version"?: string,"noncurrent_versions"?: string,"prefix_param": string,"sort_order"?: string,"start_after"?: string }; Returns: {
              "archived_at": string,"created_at": string,"id": string,"is_delete_marker": boolean,"is_versioned": boolean,"last_accessed_at": string,"metadata": Json,"name": string,"updated_at": string,"version": string
            }[]
                           },
"operation":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"search":
{ Args: { "bucketname": string,"delete_markers"?: string,"levels"?: number,"limits"?: number,"noncurrent_versions"?: string,"offsets"?: number,"prefix": string,"search"?: string,"sortcolumn"?: string,"sortorder"?: string }; Returns: {
              "archived_at": string,"created_at": string,"id": string,"is_delete_marker": boolean,"is_versioned": boolean,"last_accessed_at": string,"metadata": Json,"name": string,"updated_at": string,"version": string
            }[]
                           },
"search_by_timestamp":
{ Args: { "delete_markers"?: string,"noncurrent_versions"?: string,"p_bucket_id": string,"p_level": number,"p_limit": number,"p_prefix": string,"p_sort_column": string,"p_sort_column_after": string,"p_sort_order": string,"p_start_after": string,"p_start_after_version"?: string }; Returns: {
              "archived_at": string,"created_at": string,"id": string,"is_delete_marker": boolean,"is_versioned": boolean,"key": string,"last_accessed_at": string,"metadata": Json,"name": string,"updated_at": string,"version": string
            }[]
                           },
"search_v2":
{ Args: { "bucket_name": string,"delete_markers"?: string,"levels"?: number,"limits"?: number,"noncurrent_versions"?: string,"prefix": string,"sort_column"?: string,"sort_column_after"?: string,"sort_order"?: string,"start_after"?: string,"start_after_archived_at"?: string,"start_after_is_continuation"?: boolean,"start_after_version"?: string }; Returns: {
              "archived_at": string,"created_at": string,"id": string,"is_delete_marker": boolean,"is_versioned": boolean,"key": string,"last_accessed_at": string,"metadata": Json,"name": string,"updated_at": string,"version": string
            }[]
                           }
          }
          Enums: {
            "buckettype": "STANDARD"|"ANALYTICS"|"VECTOR"
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
            "announcement_audience": ["all", "program", "user"],"announcement_kind": ["info", "success", "warning", "urgent"],"discount_type": ["percent", "flat"],"enrollment_source": ["paid", "manual", "coupon_free"],"enrollment_status": ["active", "refunded", "revoked"],"live_platform": ["zoom", "meet", "youtube", "other"],"order_status": ["created", "paid", "failed", "refunded"],"program_category": ["emotional", "mental", "academic", "personal"],"program_status": ["draft", "published", "live", "completed", "archived"],"program_type": ["challenge", "course"],"session_status": ["scheduled", "live", "ended"],"user_role": ["admin", "staff", "student"],"video_status": ["uploading", "queued", "transcoding", "ready", "failed"]
          }
        },"storage": {
          Enums: {
            "buckettype": ["STANDARD", "ANALYTICS", "VECTOR"]
          }
        }
} as const
