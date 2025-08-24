import { SparePartRequest, SparePartFormData, DashboardStats, RequestStatus } from "@shared/types";

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// API endpoints
export const API_ENDPOINTS = {
  // Stripe endpoints
  STRIPE_CREATE: `${API_BASE_URL}/api/stripe/create`,
  STRIPE_STATUS: (sessionId: string) => `${API_BASE_URL}/api/stripe/status/${sessionId}`,
  STRIPE_CONFIG: `${API_BASE_URL}/api/stripe/config`,
  STRIPE_WEBHOOK: `${API_BASE_URL}/api/stripe/webhook`,
  
  // Legacy payment endpoints
  PAYMENTS_CREATE: `${API_BASE_URL}/api/payments/create`,
  PAYMENTS_STATUS: (paymentId: string) => `${API_BASE_URL}/api/payments/status/${paymentId}`,
  PAYMENTS_BREAKDOWN: `${API_BASE_URL}/api/payments/breakdown`,
  
  // Request endpoints
  REQUESTS: `${API_BASE_URL}/api/requests`,
  REQUEST_BY_ID: (requestId: string) => `${API_BASE_URL}/api/requests/${requestId}`,
  
  // Dashboard endpoints
  DASHBOARD_STATS: `${API_BASE_URL}/api/dashboard/stats`,
  
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  
  // Health check
  HEALTH: `${API_BASE_URL}/api/health`,
};

// Helper function to make API calls
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(endpoint, {
        headers: {
      'Content-Type': 'application/json',
      ...options.headers,
        },
    ...options,
      });

      if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Export the base URL for use in other parts of the app
export { API_BASE_URL };
