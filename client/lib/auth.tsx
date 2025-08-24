import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'agent';
  permissions: string[];
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  canAccess: (requiredRole: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users database
const mockUsers: (User & { password: string })[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@hyundai-sa.com',
    password: 'admin123',
    role: 'admin',
    permissions: ['*'], // Admin has all permissions
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

const roleHierarchy = {
  admin: 3,
  manager: 2,
  agent: 1
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for saved authentication on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('hyundai_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('hyundai_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (result.success && result.data) {
        setUser(result.data);
        localStorage.setItem('hyundai_user', JSON.stringify(result.data));
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hyundai_user');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.permissions.includes('*')) return true;
    
    return user.permissions.includes(permission);
  };

  const canAccess = (requiredRole: string): boolean => {
    if (!user) return false;
    
    const userRoleLevel = roleHierarchy[user.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
    
    return userRoleLevel >= requiredRoleLevel;
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    hasPermission,
    canAccess
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: string,
  requiredPermission?: string
) {
  return function AuthenticatedComponent(props: P) {
    const { user, canAccess, hasPermission } = useAuth();
    
    if (!user) {
      return <LoginRedirect />;
    }
    
    if (requiredRole && !canAccess(requiredRole)) {
      return <AccessDenied message={`This page requires ${requiredRole} role or higher.`} />;
    }
    
    if (requiredPermission && !hasPermission(requiredPermission)) {
      return <AccessDenied message="You don't have permission to access this page." />;
    }
    
    return <Component {...props} />;
  };
}

function LoginRedirect() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Authentication Required
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please log in to access this page
          </p>
        </div>
      </div>
    </div>
  );
}

function AccessDenied({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-red-600">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

// Get user role display name
export function getRoleDisplayName(role: string): string {
  switch (role) {
    case 'admin': return 'Administrator';
    case 'manager': return 'Manager';
    case 'agent': return 'Agent';
    default: return 'User';
  }
}

// Get user role color
export function getRoleColor(role: string): string {
  switch (role) {
    case 'admin': return 'bg-red-100 text-red-800';
    case 'manager': return 'bg-blue-100 text-blue-800';
    case 'agent': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
