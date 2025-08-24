import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Car, 
  BarChart3, 
  Clock, 
  CreditCard, 
  Truck, 
  Users,
  Shield,
  Settings as SettingsIcon,
  LogOut,
  Eye,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { SparePartRequest, DashboardStats } from "@shared/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Mock data for quick overview
const mockStats: DashboardStats = {
  total_requests: 156,
  pending_requests: 23,
  pending_payments: 12,
  dispatched_orders: 89,
};

const mockRecentRequests: SparePartRequest[] = [
  {
    request_id: "REQ-2024-001",
    timestamp: "2024-01-15T10:30:00Z",
    customer_name: "Ahmed Al-Rashid",
    phone_number: "+966551234567",
    email: "ahmed@example.com",
    vehicle_estamra: "ABC123",
    vin_number: "KMHXX00XXXX000001",
    part_name: "Front brake pads for Hyundai Sonata 2022",
    status: "Pending",
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
    status: "Available",
    price: 450.00,
    payment_link: "https://pay.example.com/abc123",
    payment_status: "Pending",
    whatsapp_sent: true,
  },
  {
    request_id: "REQ-2024-003",
    timestamp: "2024-01-15T09:15:00Z",
    customer_name: "Mohammed Hassan",
    phone_number: "+966502345678",
    email: "mohammed@example.com",
    vehicle_estamra: "DEF456",
    vin_number: "KMHXX00XXXX000003",
    part_name: "Air filter replacement",
    status: "Paid",
    price: 180.00,
    payment_status: "Paid",
    whatsapp_sent: true,
  }
];

export default function Index() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [recentRequests, setRecentRequests] = useState<SparePartRequest[]>(mockRecentRequests);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Pending": return "secondary";
      case "Available": return "default";
      case "Not Available": return "destructive";
      case "Payment Sent": return "outline";
      case "Paid": return "default";
      case "Dispatched": return "default";
      default: return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "text-yellow-600";
      case "Available": return "text-blue-600";
      case "Not Available": return "text-red-600";
      case "Payment Sent": return "text-purple-600";
      case "Paid": return "text-green-600";
      case "Dispatched": return "text-emerald-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Dual Logo Branding */}
              <div className="flex items-center space-x-4">
                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-white/20">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2F7bb87cd5bb024b629afd2d6c4ad7eecb%2F89209ad27c684dbc9b90f452ff107a5b?format=webp&width=800"
                    alt="Hyundai"
                    className="h-8 w-auto"
                  />
                </div>
                <div className="text-white/60 text-lg">×</div>
                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-white/20">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2F7bb87cd5bb024b629afd2d6c4ad7eecb%2F6bea580910924f218a7dc8e31190ff81?format=webp&width=800"
                    alt="Wallan Group"
                    className="h-8 w-auto"
                  />
                </div>
              </div>
              
              <div className="border-l border-white/20 pl-6">
                <h1 className="text-3xl font-bold text-white">Admin Portal</h1>
                <p className="text-blue-100 text-sm">Spare Parts Management System</p>
              </div>
            </div>
            
            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                      {user?.name?.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  <Badge variant="outline" className="mt-2 w-fit">
                    {user?.role === 'admin' ? 'Administrator' : user?.role === 'manager' ? 'Manager' : 'Agent'}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">Profile Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-gray-600">
            Here's an overview of your spare parts management system.
          </p>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Requests</CardTitle>
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{stats.total_requests}</div>
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700">Pending Requests</CardTitle>
              <Clock className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-900">{stats.pending_requests}</div>
              <p className="text-xs text-yellow-600">Awaiting review</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Pending Payments</CardTitle>
              <CreditCard className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{stats.pending_payments}</div>
              <p className="text-xs text-purple-600">Awaiting payment</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Dispatched</CardTitle>
              <Truck className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{stats.dispatched_orders}</div>
              <p className="text-xs text-green-600">Completed orders</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Main Actions */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>Quick Actions</span>
              </CardTitle>
              <CardDescription>
                Access main system functions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/dashboard">
                <Button className="w-full justify-start bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Full Dashboard
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
              
              {user?.role === 'admin' && (
                <Link to="/settings">
                  <Button variant="outline" className="w-full justify-start border-2 hover:bg-gray-50">
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    System Settings
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
              )}
              
              <Link to="/whatsapp">
                <Button variant="outline" className="w-full justify-start border-2 hover:bg-green-50 hover:border-green-200">
                  <Users className="h-4 w-4 mr-2" />
                  WhatsApp Center
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* User Role Information */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <span>Your Access Level</span>
              </CardTitle>
              <CardDescription>
                Current permissions and capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Role:</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {user?.role === 'admin' ? 'Administrator' : user?.role === 'manager' ? 'Manager' : 'Agent'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Permissions:</p>
                <div className="flex flex-wrap gap-2">
                  {user?.permissions.includes('*') ? (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      Full Access
                    </Badge>
                  ) : (
                    user?.permissions.map((permission, index) => (
                      <Badge key={index} variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
                        {permission}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Requests Overview */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <span>Recent Requests</span>
                </CardTitle>
                <CardDescription>
                  Latest spare parts requests submitted
                </CardDescription>
              </div>
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="border-2">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRequests.slice(0, 5).map((request) => (
                <div key={request.request_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium text-gray-900">{request.customer_name}</p>
                        <p className="text-sm text-gray-600">{request.part_name}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{request.request_id}</p>
                      <p className="text-xs text-gray-500">{new Date(request.timestamp).toLocaleDateString()}</p>
                    </div>
                    
                    <Badge variant={getStatusBadgeVariant(request.status)} className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {recentRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent requests found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
