// Cleaned excerpt of src/types/index.ts
// Remove any stray copilot/feature/main tokens and keep only valid TypeScript definitions.

export interface FeatureFlags {
  tenant_id: string;
  tracking_enabled: boolean;
  wallet_enabled: boolean;
  loyalty_enabled: boolean;
  coupons_enabled: boolean;
  returns_enabled: boolean;
  refunds_enabled: boolean;
  subscriptions_enabled: boolean;
  prescription_required_enabled: boolean;
  multi_warehouse_enabled: boolean;
  whatsapp_notifications_enabled: boolean;
  push_notifications_enabled: boolean;

  // Additional flags
  social_login_enabled: boolean;
  customer_support_enabled: boolean;
  analytics_enabled: boolean;
  marketing_enabled: boolean;
  personalization_enabled: boolean;
  recommendations_enabled: boolean;
  advanced_search_enabled: boolean;
  product_gallery_enabled: boolean;
  product_videos_enabled: boolean;
  address_book_enabled: boolean;
  delivery_slots_enabled: boolean;
  cart_sync_enabled: boolean;
  wishlist_enabled: boolean;
  order_timeline_enabled: boolean;
  invoice_download_enabled: boolean;
  sms_notifications_enabled: boolean;
  email_notifications_enabled: boolean;
  customer_dashboard_enabled: boolean;
  prescription_archive_enabled: boolean;
  chat_support_enabled: boolean;
  help_center_enabled: boolean;
  pharmacy_license_display_enabled: boolean;
  privacy_controls_enabled: boolean;
  accessibility_mode_enabled: boolean;
  banner_ads_enabled: boolean;
  marketing_campaigns_enabled: boolean;
  mobile_app_banner_enabled: boolean;
  deep_linking_enabled: boolean;
  push_segmentation_enabled: boolean;
  analytics_dashboard_enabled: boolean;
  customer_insights_enabled: boolean;
  audit_logging_enabled: boolean;
  bulk_invite_enabled: boolean;
  created_at: string;
  updated_at: string;
}
