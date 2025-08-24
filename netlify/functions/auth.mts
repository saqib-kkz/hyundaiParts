import type { Context, Config } from "@netlify/functions";

// Mock user database for production
const mockUsers = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@hyundai-sa.com',
    password: 'admin123',
    role: 'admin',
    permissions: ['*'],
    avatar: undefined
  },
  {
    id: '2',
    name: 'Manager User',
    email: 'manager@hyundai-sa.com',
    password: 'manager123',
    role: 'manager',
    permissions: [
      'dashboard.read',
      'requests.read',
      'requests.update',
      'whatsapp.send',
      'users.read'
    ]
  },
  {
    id: '3',
    name: 'Agent User',
    email: 'agent@hyundai-sa.com',
    password: 'agent123',
    role: 'agent',
    permissions: [
      'dashboard.read',
      'requests.read',
      'whatsapp.send'
    ]
  }
];

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api/auth', '');

  try {
    if (req.method === 'POST' && path === '/login') {
      const body = await req.json();
      const { email, password } = body;

      if (!email || !password) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Email and password are required'
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const user = mockUsers.find(u => u.email === email && u.password === password);

      if (!user) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid email or password'
        }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      const { password: _, ...userWithoutPassword } = user;

      return new Response(JSON.stringify({
        success: true,
        data: userWithoutPassword,
        message: 'Login successful'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (req.method === 'GET' && path === '/me') {
      const mockUser = {
        id: '1',
        name: 'Admin User',
        email: 'admin@hyundai-sa.com',
        role: 'admin',
        permissions: ['*']
      };

      return new Response(JSON.stringify({
        success: true,
        data: mockUser
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (req.method === 'POST' && path === '/logout') {
      return new Response(JSON.stringify({
        success: true,
        message: 'Logout successful'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Endpoint not found'
    }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('Auth error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Authentication failed'
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config: Config = {
  path: "/api/auth/*"
};
