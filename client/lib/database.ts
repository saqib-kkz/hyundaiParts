import { SparePartRequest, SparePartFormData, DashboardStats, RequestStatus } from "@shared/types";

// Database service using actual API endpoints
export class DatabaseService {
  private static readonly API_BASE = "/api";

  // Submit new spare part request
  static async submitRequest(formData: SparePartFormData, photoFile?: File): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare form data for upload
      const submitData = new FormData();
      submitData.append('data', JSON.stringify({
        ...formData,
        request_id: requestId
      }));
      
      if (photoFile) {
        submitData.append('photo', photoFile);
      }

      const response = await fetch(`${this.API_BASE}/requests`, {
        method: 'POST',
        body: submitData
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        // If response is not JSON (e.g., HTML error page), throw a more descriptive error
        throw new Error(`API returned non-JSON response (${response.status}). This usually means the API endpoint is not found or returning an HTML error page.`);
      }

      if (!response.ok) {
        throw new Error(result.error || `API Error (${response.status}): ${result.message || 'Failed to submit request'}`);
      }

      return {
        success: true,
        requestId: result.data?.request_id || requestId
      };
    } catch (error) {
      console.error('Request submission error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit request'
      };
    }
  }

  // Get all requests with filtering
  static async getRequests(params?: {
    search?: string;
    status?: RequestStatus | 'all';
    payment_status?: string;
    date_from?: string;
    date_to?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data?: SparePartRequest[]; error?: string }> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== 'all') {
            searchParams.append(key, value.toString());
          }
        });
      }

      const url = `${this.API_BASE}/requests${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch requests');
      }

      return {
        success: true,
        data: result.data || []
      };
    } catch (error) {
      console.error('Get requests error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch requests'
      };
    }
  }

  // Update request
  static async updateRequest(requestId: string, updates: Partial<SparePartRequest>): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update request');
      }

      return { success: true };
    } catch (error) {
      console.error('Update request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update request'
      };
    }
  }

  // Get single request
  static async getRequest(requestId: string): Promise<{ success: boolean; data?: SparePartRequest; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/requests/${requestId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch request');
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Get request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch request'
      };
    }
  }

  // Delete request
  static async deleteRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/requests/${requestId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete request');
      }

      return { success: true };
    } catch (error) {
      console.error('Delete request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete request'
      };
    }
  }

  // Get dashboard statistics
  static async getDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/dashboard/stats`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch stats');
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Get stats error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stats'
      };
    }
  }

  // User authentication
  static async login(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      return {
        success: true,
        user: result.data
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  // Export data
  static async exportData(format: 'csv' | 'pdf' | 'excel', params?: any): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/exports/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params || {})
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Export failed');
      }

      // Handle blob response for file download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      return {
        success: true,
        url
      };
    } catch (error) {
      console.error('Export error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      };
    }
  }
}

// Keep the old BigQueryService for backward compatibility, but use DatabaseService
export class BigQueryService extends DatabaseService {
  // Alias for backward compatibility
}

export default DatabaseService;
