import { Router } from 'express';
import { SparePartRequest, RequestStatus } from '@shared/types';

const router = Router();

// Get Neon connection from environment
const getConnectionString = () => {
  return process.env.DATABASE_URL || 
         process.env.NEON_DATABASE_URL || 
         'postgresql://neondb_owner:npg_gx3ioyU7shQY@ep-autumn-union-ad9g7flq-pooler.c-2.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';
};

// Mock database operations (until we can use pg library)
const mockDatabase = {
  requests: [] as SparePartRequest[],
  
  async query(sql: string, params: any[] = []): Promise<any> {
    console.log('SQL Query:', sql, 'Params:', params);
    
    // Mock implementation for now
    if (sql.includes('SELECT') && sql.includes('spare_part_requests')) {
      return { rows: this.requests };
    }
    
    if (sql.includes('INSERT INTO spare_part_requests')) {
      const newRequest: SparePartRequest = {
        request_id: params[0] || `REQ-${Date.now()}`,
        timestamp: new Date().toISOString(),
        customer_name: params[1] || '',
        phone_number: params[2] || '',
        email: params[3] || '',
        vehicle_estamra: params[4] || '',
        vin_number: params[5] || '',
        part_name: params[6] || '',
        status: 'Pending' as RequestStatus,
        payment_status: 'Pending',
        whatsapp_sent: false
      };
      this.requests.push(newRequest);
      return { rows: [newRequest] };
    }
    
    if (sql.includes('UPDATE spare_part_requests')) {
      // Find and update request
      const requestId = params[params.length - 1];
      const index = this.requests.findIndex(r => r.request_id === requestId);
      if (index !== -1) {
        // Update fields based on SQL
        if (sql.includes('status')) {
          this.requests[index].status = params[0];
        }
        if (sql.includes('price')) {
          this.requests[index].price = params[0];
        }
        return { rows: [this.requests[index]] };
      }
    }
    
    if (sql.includes('DELETE FROM spare_part_requests')) {
      const requestId = params[0];
      this.requests = this.requests.filter(r => r.request_id !== requestId);
      return { rows: [] };
    }
    
    return { rows: [] };
  }
};

// Initialize with sample data
mockDatabase.requests = [
  {
    request_id: "REQ-2024-001",
    timestamp: "2024-01-15T10:30:00Z",
    customer_name: "Ahmed Al-Rashid",
    phone_number: "+966551234567",
    email: "ahmed@example.com",
    vehicle_estamra: "ABC123",
    vin_number: "KMHXX00XXXX000001",
    part_name: "Front brake pads for Hyundai Sonata 2022",
    status: "Pending" as RequestStatus,
    payment_status: "Pending",
    whatsapp_sent: false,
  },
  {
    request_id: "REQ-2024-002", 
    timestamp: "2024-01-15T14:20:00Z",
    customer_name: "Fatima Al-Zahra",
    phone_number: "+966559876543",
    email: "fatima@example.com",
    vehicle_estamra: "XYZ789",
    vin_number: "KMHXX00XXXX000002",
    part_name: "Side mirror assembly - passenger side",
    status: "Available" as RequestStatus,
    price: 450.00,
    parts_cost: 380.00,
    freight_cost: 70.00,
    payment_link: "https://pay.example.com/abc123",
    payment_status: "Pending",
    whatsapp_sent: true,
  }
];

/**
 * Create a new spare part request
 */
router.post('/', async (req, res) => {
  try {
    let requestData;
    
    // Handle both JSON and form-data submissions
    if (req.body.data) {
      // Form data with file upload
      requestData = JSON.parse(req.body.data);
    } else {
      // Direct JSON submission
      requestData = req.body;
    }

    // Validate required fields
    const requiredFields = ['customer_name', 'phone_number', 'email', 'vehicle_estamra', 'vin_number', 'part_name'];
    for (const field of requiredFields) {
      if (!requestData[field]) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
      }
    }

    // Generate request ID if not provided
    if (!requestData.request_id) {
      requestData.request_id = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    }

    // Insert into database
    const sql = `
      INSERT INTO spare_part_requests 
      (request_id, customer_name, phone_number, email, vehicle_estamra, vin_number, part_name, part_photo_url) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `;
    
    const params = [
      requestData.request_id,
      requestData.customer_name,
      requestData.phone_number,
      requestData.email,
      requestData.vehicle_estamra,
      requestData.vin_number,
      requestData.part_name,
      requestData.part_photo_url || null
    ];

    const result = await mockDatabase.query(sql, params);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Request submitted successfully'
    });

  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create request'
    });
  }
});

/**
 * Get all requests with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const {
      search,
      status,
      payment_status,
      date_from,
      date_to,
      sort_by = 'timestamp',
      sort_order = 'desc',
      page = 1,
      limit = 50
    } = req.query;

    let sql = 'SELECT * FROM spare_part_requests WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    // Add search filter
    if (search) {
      paramCount++;
      sql += ` AND (customer_name ILIKE $${paramCount} OR vin_number ILIKE $${paramCount} OR part_name ILIKE $${paramCount} OR request_id ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Add status filter
    if (status && status !== 'all') {
      paramCount++;
      sql += ` AND status = $${paramCount}`;
      params.push(status);
    }

    // Add payment status filter
    if (payment_status && payment_status !== 'all') {
      paramCount++;
      sql += ` AND payment_status = $${paramCount}`;
      params.push(payment_status);
    }

    // Add date range filter
    if (date_from) {
      paramCount++;
      sql += ` AND timestamp >= $${paramCount}`;
      params.push(date_from);
    }

    if (date_to) {
      paramCount++;
      sql += ` AND timestamp <= $${paramCount}`;
      params.push(date_to);
    }

    // Add sorting
    const validSortFields = ['timestamp', 'customer_name', 'status', 'price'];
    const sortField = validSortFields.includes(sort_by as string) ? sort_by : 'timestamp';
    const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${sortField} ${sortDirection}`;

    // Add pagination
    const offset = (Number(page) - 1) * Number(limit);
    paramCount++;
    sql += ` LIMIT $${paramCount}`;
    params.push(Number(limit));
    
    paramCount++;
    sql += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await mockDatabase.query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.rows.length
      }
    });

  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests'
    });
  }
});

/**
 * Get single request by ID
 */
router.get('/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;

    const sql = 'SELECT * FROM spare_part_requests WHERE request_id = $1';
    const result = await mockDatabase.query(sql, [requestId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch request'
    });
  }
});

/**
 * Update request
 */
router.patch('/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const updateFields = [];
    const params = [];
    let paramCount = 0;

    const allowedFields = [
      'status', 'price', 'parts_cost', 'freight_cost', 'payment_link', 
      'payment_status', 'notes', 'whatsapp_sent', 'dispatched_on', 
      'tracking_number', 'estimated_delivery'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        params.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    // Add last_updated field
    paramCount++;
    updateFields.push(`last_updated = $${paramCount}`);
    params.push(new Date().toISOString());

    // Add WHERE clause
    paramCount++;
    params.push(requestId);

    const sql = `
      UPDATE spare_part_requests 
      SET ${updateFields.join(', ')} 
      WHERE request_id = $${paramCount} 
      RETURNING *
    `;

    const result = await mockDatabase.query(sql, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Request updated successfully'
    });

  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update request'
    });
  }
});

/**
 * Delete request
 */
router.delete('/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;

    const sql = 'DELETE FROM spare_part_requests WHERE request_id = $1 RETURNING request_id';
    const result = await mockDatabase.query(sql, [requestId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    res.json({
      success: true,
      message: 'Request deleted successfully'
    });

  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete request'
    });
  }
});

/**
 * Get dashboard statistics
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    const statsSQL = `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN payment_status = 'Pending' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN status = 'Dispatched' THEN 1 END) as dispatched_orders,
        COALESCE(SUM(price), 0) as total_revenue,
        COALESCE(AVG(price), 0) as average_order_value
      FROM spare_part_requests
    `;

    const result = await mockDatabase.query(statsSQL);
    const stats = result.rows[0] || {};

    // Mock enhanced stats for now
    const enhancedStats = {
      total_requests: stats.total_requests || 2,
      pending_requests: stats.pending_requests || 1,
      pending_payments: stats.pending_payments || 1,
      dispatched_orders: stats.dispatched_orders || 0,
      total_revenue: stats.total_revenue || 450.00,
      parts_revenue: (stats.total_revenue || 450.00) * 0.85,
      freight_revenue: (stats.total_revenue || 450.00) * 0.15,
      average_order_value: stats.average_order_value || 450.00,
      revenue_growth: 15.7,
      orders_today: 1,
      orders_this_week: 2,
      orders_this_month: 2
    };

    res.json({
      success: true,
      data: enhancedStats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
});

export default router;
