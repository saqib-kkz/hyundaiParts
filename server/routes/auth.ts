import { Router } from 'express';

const router = Router();

// Mock user database (in production, this would use real PostgreSQL)
const mockUsers = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@hyundai-sa.com',
    password: 'admin123', // In production, this would be hashed
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

/**
 * User login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user (in production, this would query PostgreSQL)
    const user = mockUsers.find(u => u.email === email && u.password === password);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

/**
 * Get current user
 */
router.get('/me', async (req, res) => {
  try {
    // In production, this would verify JWT token and get user from database
    // For now, return a mock user
    const mockUser = {
      id: '1',
      name: 'Admin User',
      email: 'admin@hyundai-sa.com',
      role: 'admin',
      permissions: ['*']
    };

    res.json({
      success: true,
      data: mockUser
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
});

/**
 * User logout
 */
router.post('/logout', async (req, res) => {
  try {
    // In production, this would invalidate JWT token
    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

/**
 * Verify token (middleware)
 */
router.get('/verify', async (req, res) => {
  try {
    // In production, this would verify JWT token
    res.json({
      success: true,
      valid: true
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      valid: false,
      error: 'Invalid token'
    });
  }
});

export default router;
