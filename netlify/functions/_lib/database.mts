import { neon } from '@neondatabase/serverless';

// Get database connection
export function getDatabase() {
  const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('Database URL not configured (NETLIFY_DATABASE_URL or DATABASE_URL)');
  }

  return neon(databaseUrl);
}

// Types
export interface SparePartRequest {
  request_id: string;
  timestamp: string;
  customer_name: string;
  phone_number: string;
  email: string;
  vehicle_estamra: string;
  vin_number: string;
  part_name: string;
  status: string;
  payment_status: string;
  price?: number;
  parts_cost?: number;
  freight_cost?: number;
  payment_link?: string;
  whatsapp_sent: boolean;
  created_at?: string;
  updated_at?: string;
}

// Get all requests with filtering
export async function getRequests(params: {
  search?: string;
  status?: string;
  payment_status?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<SparePartRequest[]> {
  const sql = getDatabase();
  
  let query = 'SELECT * FROM spare_part_requests WHERE 1=1';
  const values: any[] = [];
  let valueIndex = 1;

  if (params.search) {
    query += ` AND (
      customer_name ILIKE $${valueIndex} OR 
      vin_number ILIKE $${valueIndex} OR 
      part_name ILIKE $${valueIndex} OR 
      request_id ILIKE $${valueIndex} OR
      phone_number ILIKE $${valueIndex}
    )`;
    values.push(`%${params.search}%`);
    valueIndex++;
  }

  if (params.status && params.status !== 'all') {
    query += ` AND status = $${valueIndex}`;
    values.push(params.status);
    valueIndex++;
  }

  if (params.payment_status && params.payment_status !== 'all') {
    query += ` AND payment_status = $${valueIndex}`;
    values.push(params.payment_status);
    valueIndex++;
  }

  query += ' ORDER BY created_at DESC';

  if (params.limit) {
    query += ` LIMIT $${valueIndex}`;
    values.push(params.limit);
    valueIndex++;
  }

  if (params.offset) {
    query += ` OFFSET $${valueIndex}`;
    values.push(params.offset);
  }

  const result = await sql(query, values);
  return result as SparePartRequest[];
}

// Create new request
export async function createRequest(data: Omit<SparePartRequest, 'created_at' | 'updated_at'>): Promise<SparePartRequest> {
  const sql = getDatabase();
  
  const query = `
    INSERT INTO spare_part_requests (
      request_id, customer_name, phone_number, email, 
      vehicle_estamra, vin_number, part_name, status, 
      payment_status, price, parts_cost, freight_cost, 
      payment_link, whatsapp_sent
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
    ) RETURNING *
  `;

  const values = [
    data.request_id,
    data.customer_name,
    data.phone_number,
    data.email,
    data.vehicle_estamra,
    data.vin_number,
    data.part_name,
    data.status || 'Pending',
    data.payment_status || 'Pending',
    data.price || null,
    data.parts_cost || null,
    data.freight_cost || null,
    data.payment_link || null,
    data.whatsapp_sent || false
  ];

  const result = await sql(query, values);
  return result[0] as SparePartRequest;
}

// Update request
export async function updateRequest(requestId: string, updates: Partial<SparePartRequest>): Promise<SparePartRequest | null> {
  const sql = getDatabase();
  
  const setParts = [];
  const values = [];
  let valueIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (key !== 'request_id' && key !== 'created_at') {
      setParts.push(`${key} = $${valueIndex}`);
      values.push(value);
      valueIndex++;
    }
  }

  if (setParts.length === 0) {
    throw new Error('No valid fields to update');
  }

  const query = `
    UPDATE spare_part_requests 
    SET ${setParts.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE request_id = $${valueIndex}
    RETURNING *
  `;
  
  values.push(requestId);

  const result = await sql(query, values);
  return result[0] as SparePartRequest || null;
}

// Get dashboard statistics
export async function getDashboardStats() {
  const sql = getDatabase();
  
  const statsQuery = `
    SELECT 
      COUNT(*) as total_requests,
      COUNT(*) FILTER (WHERE status = 'Pending') as pending_requests,
      COUNT(*) FILTER (WHERE payment_status = 'Pending') as pending_payments,
      COUNT(*) FILTER (WHERE status = 'Dispatched') as dispatched_orders,
      COALESCE(SUM(price), 0) as total_revenue,
      COALESCE(SUM(parts_cost), 0) as parts_revenue,
      COALESCE(SUM(freight_cost), 0) as freight_revenue,
      COALESCE(AVG(price) FILTER (WHERE price > 0), 0) as average_order_value
    FROM spare_part_requests
  `;

  const result = await sql(statsQuery);
  return result[0];
}

// Get status distribution
export async function getStatusDistribution() {
  const sql = getDatabase();
  
  const query = `
    SELECT 
      status,
      COUNT(*) as count
    FROM spare_part_requests
    GROUP BY status
  `;

  const result = await sql(query);
  return result.reduce((acc: any, row: any) => {
    acc[row.status.toLowerCase().replace(' ', '_')] = parseInt(row.count);
    return acc;
  }, {});
}
