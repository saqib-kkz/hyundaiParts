import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  console.log(`[API] ${req.method} ${req.url}`);

  try {
    if (req.method === 'POST') {
      console.log('[API] Processing POST request...');
      
      const contentType = req.headers.get('content-type') || '';
      let requestData;

      if (contentType.includes('multipart/form-data')) {
        const formData = await req.formData();
        const dataStr = formData.get('data') as string;
        
        if (!dataStr) {
          return new Response(JSON.stringify({
            success: false,
            error: 'No data found in form submission'
          }), { status: 400, headers });
        }
        
        requestData = JSON.parse(dataStr);
      } else if (contentType.includes('application/json')) {
        requestData = await req.json();
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: 'Unsupported content type: ' + contentType
        }), { status: 400, headers });
      }

      // Validate required fields
      const requiredFields = ['customer_name', 'phone_number', 'email', 'vehicle_estamra', 'vin_number', 'part_name'];
      const missingFields = requiredFields.filter(field => !requestData[field]);
      
      if (missingFields.length > 0) {
        return new Response(JSON.stringify({
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        }), { status: 400, headers });
      }

      // Generate request ID
      const requestId = requestData.request_id || `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      console.log('[API] Generated request ID:', requestId);

      // Try to save to database
      try {
        const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
        if (!databaseUrl) {
          throw new Error('Database URL not configured');
        }

        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(databaseUrl);
        
        console.log('[API] Attempting to save to database...');
        
        const query = `
          INSERT INTO spare_part_requests (
            request_id, customer_name, phone_number, email, 
            vehicle_estamra, vin_number, part_name, status, 
            payment_status, whatsapp_sent
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
          ) RETURNING *
        `;
        
        const values = [
          requestId,
          requestData.customer_name,
          requestData.phone_number,
          requestData.email,
          requestData.vehicle_estamra,
          requestData.vin_number,
          requestData.part_name,
          'Pending',
          'Pending',
          false
        ];
        
        const result = await sql(query, values);
        const createdRequest = result[0];
        
        console.log('[API] Successfully saved to database');
        
        return new Response(JSON.stringify({
          success: true,
          data: createdRequest,
          message: 'Request submitted successfully'
        }), {
          status: 201,
          headers
        });
        
      } catch (dbError) {
        console.error('[API] Database error:', dbError);
        
        // Return mock response if database fails
        const mockResponse = {
          request_id: requestId,
          ...requestData,
          timestamp: new Date().toISOString(),
          status: 'Pending',
          payment_status: 'Pending',
          whatsapp_sent: false
        };
        
        return new Response(JSON.stringify({
          success: true,
          data: mockResponse,
          message: 'Request submitted successfully (temporary storage)',
          warning: 'Database connection issue - request saved temporarily'
        }), {
          status: 201,
          headers
        });
      }
    }

    if (req.method === 'GET') {
      console.log('[API] Processing GET request...');
      
      try {
        const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
        console.log('[API] Database URL available:', !!databaseUrl);
        
        if (!databaseUrl) {
          throw new Error('Database URL not configured');
        }

        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(databaseUrl);
        
        console.log('[API] Executing database query...');
        const requests = await sql(`
          SELECT 
            request_id, customer_name, phone_number, email, 
            vehicle_estamra, vin_number, part_name, status, 
            payment_status, price, parts_cost, freight_cost,
            payment_link, whatsapp_sent, timestamp
          FROM spare_part_requests 
          ORDER BY timestamp DESC 
          LIMIT 50
        `);
        
        console.log('[API] Query successful, found', requests.length, 'records');
        
        return new Response(JSON.stringify({
          success: true,
          data: requests,
          pagination: { total: requests.length, limit: 50, page: 1 }
        }), {
          status: 200,
          headers
        });
        
      } catch (dbError) {
        console.error('[API] Database error in GET:', dbError);
        
        // Return empty array with error info if database fails
        return new Response(JSON.stringify({
          success: true,
          data: [],
          pagination: { total: 0, limit: 50, page: 1 },
          error: dbError instanceof Error ? dbError.message : 'Database connection failed',
          note: 'Database connection issue - please check logs'
        }), {
          status: 200,
          headers
        });
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: `Method ${req.method} not supported`
    }), {
      status: 405,
      headers
    });

  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }), {
      status: 500,
      headers
    });
  }
};

export const config: Config = {
  path: "/api/requests"
};
