export interface SparePartRequest {
  request_id: string;
  timestamp: string;
  customer_name: string;
  phone_number: string;
  email: string;
  vehicle_estamra: string;
  vin_number: string;
  part_name: string;
  part_photo_url?: string;
  status: RequestStatus;
  price?: number;
  parts_cost?: number;
  freight_cost?: number;
  payment_link?: string;
  payment_status: PaymentStatus;
  notes?: string;
  whatsapp_sent: boolean;
  dispatched_on?: string;
  created_by?: string;
  last_updated?: string;
  estimated_delivery?: string;
  tracking_number?: string;
}

export type RequestStatus =
  | 'Pending'
  | 'Available'
  | 'Not Available'
  | 'Payment Sent'
  | 'Paid'
  | 'Processing'
  | 'Dispatched';

export type PaymentStatus = 
  | 'Pending' 
  | 'Paid' 
  | 'Failed';

export interface SparePartFormData {
  customer_name: string;
  phone_number: string;
  email: string;
  vehicle_estamra: string;
  vin_number: string;
  part_name: string;
  part_photo?: File;
}

export interface DashboardStats {
  total_requests: number;
  pending_requests: number;
  pending_payments: number;
  dispatched_orders: number;
}

export interface EnhancedDashboardStats extends DashboardStats {
  total_revenue: number;
  parts_revenue: number;
  freight_revenue: number;
  average_order_value: number;
  revenue_growth: number;
  orders_today: number;
  orders_this_week: number;
  orders_this_month: number;
  top_selling_parts?: Array<{
    part_name: string;
    quantity: number;
    revenue: number;
  }>;
  revenue_by_month?: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
}

export interface PaymentBreakdown {
  parts_cost: number;
  freight_cost: number;
  total_cost: number;
  currency: string;
}

export interface RevenueMetrics {
  daily_revenue: number;
  weekly_revenue: number;
  monthly_revenue: number;
  yearly_revenue: number;
  growth_rate: number;
  top_customers: Array<{
    customer_name: string;
    total_spent: number;
    order_count: number;
  }>;
}

export interface FilterOptions {
  search: string;
  status: RequestStatus | 'all';
  payment_status: PaymentStatus | 'all';
  date_range: {
    from?: Date;
    to?: Date;
  };
  sort_by: 'timestamp' | 'customer_name' | 'status' | 'price';
  sort_order: 'asc' | 'desc';
}

export interface UserRole {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'agent';
  permissions: string[];
  avatar?: string;
  last_login?: string;
  created_at?: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  status: 'active' | 'inactive';
}

export interface SystemSettings {
  company_name: string;
  default_currency: string;
  tax_rate: number;
  default_freight_percentage: number;
  whatsapp_api_endpoint: string;
  payment_gateway_config: {
    provider: string;
    sandbox_mode: boolean;
    api_key: string;
    webhook_url: string;
  };
  notification_settings: {
    email_notifications: boolean;
    whatsapp_notifications: boolean;
    sms_notifications: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
}

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel';
  date_range?: {
    from: Date;
    to: Date;
  };
  include_revenue: boolean;
  include_customer_details: boolean;
}
