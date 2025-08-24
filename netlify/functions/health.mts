import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    // Test database connection if available
    let databaseStatus = 'not_configured';
    let databaseError = null;

    try {
      if (process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL) {
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL);
        await sql('SELECT 1 as test');
        databaseStatus = 'connected';
      }
    } catch (error) {
      databaseStatus = 'error';
      databaseError = error instanceof Error ? error.message : 'Unknown database error';
    }

    const healthInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: databaseStatus,
        error: databaseError
      },
      version: '1.0.0'
    };

    return new Response(JSON.stringify(healthInfo), {
      status: 200,
      headers
    });

  } catch (error) {
    const errorInfo = {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return new Response(JSON.stringify(errorInfo), {
      status: 500,
      headers
    });
  }
};

export const config: Config = {
  path: "/api/health"
};
