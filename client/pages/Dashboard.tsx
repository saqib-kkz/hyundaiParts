import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import PaymentManagementDialog from "@/components/PaymentManagementDialog";
import WhatsAppConfigDialog from "@/components/WhatsAppConfigDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Car,
  Search,
  Filter,
  Edit,
  Download,
  BarChart3,
  Clock,
  CreditCard,
  Truck,
  MessageSquare,
  DollarSign,
  Settings as SettingsIcon,
  Calendar as CalendarIcon,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Banknote,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw
} from "lucide-react";
import { SparePartRequest, RequestStatus, PaymentStatus, DashboardStats } from "@shared/types";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { DatabaseService } from "@/lib/database";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

// This component now loads real data from the database instead of using mock data

// Enhanced stats with revenue tracking
interface EnhancedDashboardStats extends DashboardStats {
  total_revenue: number;
  parts_revenue: number;
  freight_revenue: number;
  average_order_value: number;
  revenue_growth: number;
  orders_today: number;
  orders_this_week: number;
  orders_this_month: number;
}

// Default stats structure for initialization
const defaultStats: EnhancedDashboardStats = {
  total_requests: 0,
  pending_requests: 0,
  pending_payments: 0,
  dispatched_orders: 0,
  total_revenue: 0,
  parts_revenue: 0,
  freight_revenue: 0,
  average_order_value: 0,
  revenue_growth: 0,
  orders_today: 0,
  orders_this_week: 0,
  orders_this_month: 0
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState<SparePartRequest[]>([]);
  const [stats, setStats] = useState<EnhancedDashboardStats>(defaultStats);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | "all">("all");
  const [selectedRequest, setSelectedRequest] = useState<SparePartRequest | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isWhatsAppConfigOpen, setIsWhatsAppConfigOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortBy, setSortBy] = useState<string>("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(false);

  // Load data from database
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Reload data when sort changes
  useEffect(() => {
    if (requests.length > 0) { // Only reload if we have initial data
      loadFilteredData();
    }
  }, [sortBy, sortOrder, statusFilter, paymentStatusFilter, searchTerm]);

  const loadFilteredData = async () => {
    try {
      const requestsResult = await DatabaseService.getRequests({
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        payment_status: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: 100
      });

      if (requestsResult.success && requestsResult.data) {
        setRequests(requestsResult.data);
      }
    } catch (error) {
      console.error('Failed to load filtered data:', error);
    }
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load requests
      const requestsResult = await DatabaseService.getRequests({
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: 100
      });

      if (requestsResult.success && requestsResult.data) {
        setRequests(requestsResult.data);
      }

      // Load stats
      const statsResult = await DatabaseService.getDashboardStats();
      if (statsResult.success && statsResult.data) {
        // Calculate enhanced stats from the real data
        const validRequests = Array.isArray(requests) ? requests : [];
        const totalRevenue = validRequests.reduce((sum, req) => sum + (req.price || 0), 0);
        const partsRevenue = totalRevenue * 0.85; // Assuming 85% is parts cost
        const freightRevenue = totalRevenue * 0.15; // Assuming 15% is freight
        const paidOrders = validRequests.filter(req => req.payment_status === 'Paid');
        const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

        setStats({
          ...defaultStats,
          ...statsResult.data,
          total_revenue: totalRevenue,
          parts_revenue: partsRevenue,
          freight_revenue: freightRevenue,
          average_order_value: avgOrderValue,
          revenue_growth: 0, // Would need historical data to calculate
          orders_today: 0, // Would need to filter by today's date
          orders_this_week: 0, // Would need to filter by this week
          orders_this_month: 0 // Would need to filter by this month
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort requests - add safety check
  const validRequests = Array.isArray(requests) ? requests : [];
  const filteredAndSortedRequests = validRequests
    .filter(request => {
      const matchesSearch = 
        request.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.vin_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.request_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.phone_number.includes(searchTerm);
      
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      const matchesPaymentStatus = paymentStatusFilter === "all" || request.payment_status === paymentStatusFilter;
      
      let matchesDateRange = true;
      if (dateRange?.from && dateRange?.to) {
        const requestDate = new Date(request.timestamp);
        matchesDateRange = requestDate >= dateRange.from && requestDate <= dateRange.to;
      }
      
      return matchesSearch && matchesStatus && matchesPaymentStatus && matchesDateRange;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "customer_name":
          aValue = a.customer_name;
          bValue = b.customer_name;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "price":
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        case "timestamp":
        default:
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
      }
      
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortOrder === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
    });

  // Calculate filtered stats - add safety checks
  const safeFilteredRequests = Array.isArray(filteredAndSortedRequests) ? filteredAndSortedRequests : [];
  const filteredStats = {
    total: safeFilteredRequests.length,
    pending: safeFilteredRequests.filter(r => r?.status === "Pending").length,
    available: safeFilteredRequests.filter(r => r?.status === "Available").length,
    paymentSent: safeFilteredRequests.filter(r => r?.status === "Payment Sent").length,
    paid: safeFilteredRequests.filter(r => r?.status === "Paid").length,
    processing: safeFilteredRequests.filter(r => r?.status === "Processing").length,
    dispatched: safeFilteredRequests.filter(r => r?.status === "Dispatched").length,
    notAvailable: safeFilteredRequests.filter(r => r?.status === "Not Available").length,
    totalRevenue: safeFilteredRequests.reduce((sum, r) => sum + (r?.price || 0), 0),
    avgOrderValue: safeFilteredRequests.length > 0 ?
      safeFilteredRequests.reduce((sum, r) => sum + (r?.price || 0), 0) /
      Math.max(1, safeFilteredRequests.filter(r => r?.price).length) : 0
  };

  const getStatusBadgeVariant = (status: RequestStatus) => {
    switch (status) {
      case "Pending": return "secondary";
      case "Available": return "default";
      case "Not Available": return "destructive";
      case "Payment Sent": return "outline";
      case "Paid": return "default";
      case "Processing": return "outline";
      case "Dispatched": return "default";
      default: return "secondary";
    }
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case "Pending": return "text-yellow-600";
      case "Available": return "text-blue-600";
      case "Not Available": return "text-red-600";
      case "Payment Sent": return "text-purple-600";
      case "Paid": return "text-green-600";
      case "Processing": return "text-orange-600";
      case "Dispatched": return "text-emerald-600";
      default: return "text-gray-600";
    }
  };

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case "Pending": return <Clock className="h-4 w-4" />;
      case "Available": return <CheckCircle className="h-4 w-4" />;
      case "Not Available": return <XCircle className="h-4 w-4" />;
      case "Payment Sent": return <CreditCard className="h-4 w-4" />;
      case "Paid": return <Banknote className="h-4 w-4" />;
      case "Processing": return <Package className="h-4 w-4" />;
      case "Dispatched": return <Truck className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const handleUpdateRequest = async (requestId: string, updates: Partial<SparePartRequest>) => {
    try {
      const result = await DatabaseService.updateRequest(requestId, updates);
      if (result.success) {
        // Update local state
        setRequests(prev => prev.map(req => {
          if (req.request_id === requestId) {
            return { ...req, ...updates };
          }
          return req;
        }));
      } else {
        console.error('Failed to update request:', result.error);
        alert('Failed to update request: ' + result.error);
      }
    } catch (error) {
      console.error('Update request error:', error);
      alert('Failed to update request');
    }
  };

  const handleWhatsAppConfigSave = async (config: any) => {
    try {
      // Save WhatsApp configuration to localStorage for now
      // In production, this would be saved to the database
      localStorage.setItem('whatsapp_config', JSON.stringify(config));
      
      console.log('WhatsApp configuration saved:', config);
      alert('WhatsApp configuration saved successfully!');
    } catch (error) {
      console.error('Error saving WhatsApp config:', error);
      alert('Failed to save WhatsApp configuration');
    }
  };

  const sendWhatsAppMessage = (request: SparePartRequest) => {
    console.log(`Sending WhatsApp to ${request.phone_number}`, {
      customer_name: request.customer_name,
      part_name: request.part_name,
      payment_link: request.payment_link,
      status: request.status
    });
    
    setRequests(prev => prev.map(req => 
      req.request_id === request.request_id ? { ...req, whatsapp_sent: true } : req
    ));
  };

  const exportToCSV = () => {
    const csv = [
      ["Request ID", "Date", "Customer", "Phone", "Email", "VIN", "Part", "Status", "Price", "Payment Status"],
      ...filteredAndSortedRequests.map(req => [
        req.request_id,
        new Date(req.timestamp).toLocaleDateString(),
        req.customer_name,
        req.phone_number,
        req.email,
        req.vin_number,
        req.part_name,
        req.status,
        req.price || "",
        req.payment_status
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spare-parts-requests-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const resetScorecard = (type: string) => {
    if (confirm(`Are you sure you want to reset the ${type} scorecard? This action cannot be undone.`)) {
      // Implementation would depend on backend API
      console.log(`Resetting ${type} scorecard`);
    }
  };

  const refreshData = async () => {
    await loadDashboardData();
  };

  // Show loading state if still loading
  if (isLoading && validRequests.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Dual Logo Branding */}
              <div className="flex items-center space-x-4">
                <div className="bg-white rounded-lg p-2 shadow-md">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2F7bb87cd5bb024b629afd2d6c4ad7eecb%2F89209ad27c684dbc9b90f452ff107a5b?format=webp&width=800"
                    alt="Hyundai"
                    className="h-8 w-auto"
                  />
                </div>
                <div className="text-white/60 text-lg">×</div>
                <div className="bg-white rounded-lg p-2 shadow-md">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2F7bb87cd5bb024b629afd2d6c4ad7eecb%2F6bea580910924f218a7dc8e31190ff81?format=webp&width=800"
                    alt="Wallan Group"
                    className="h-8 w-auto"
                  />
                </div>
              </div>
              <div className="border-l border-white/20 pl-4">
                <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
                <p className="text-blue-100 text-sm">Comprehensive Parts Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={refreshData}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Link
                to="/whatsapp"
                className="text-blue-100 hover:text-white flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </Link>
              
              <Button
                onClick={() => setIsWhatsAppConfigOpen(true)}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">WhatsApp Config</span>
              </Button>
              
              <Link
                to="/settings"
                className="text-blue-100 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <span className="hidden sm:inline">Settings</span>
                <SettingsIcon className="h-4 w-4 sm:hidden" />
              </Link>
              
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-white/10 hover:bg-white/20">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback className="bg-blue-500 text-white">
                        {user?.name?.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Revenue Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Total Revenue</CardTitle>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetScorecard('revenue')}
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{stats.total_revenue.toLocaleString()} SAR</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +{stats.revenue_growth}% from last month
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Parts Revenue</CardTitle>
              <div className="flex items-center space-x-2">
                <Car className="h-4 w-4 text-blue-600" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetScorecard('parts')}
                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats.parts_revenue.toLocaleString()} SAR</div>
              <p className="text-xs text-blue-600">
                {stats.total_revenue > 0 ? ((stats.parts_revenue / stats.total_revenue) * 100).toFixed(1) : '0'}% of total
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Freight Revenue</CardTitle>
              <div className="flex items-center space-x-2">
                <Truck className="h-4 w-4 text-purple-600" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetScorecard('freight')}
                  className="h-6 w-6 p-0 text-purple-600 hover:text-purple-800"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{stats.freight_revenue.toLocaleString()} SAR</div>
              <p className="text-xs text-purple-600">
                {stats.total_revenue > 0 ? ((stats.freight_revenue / stats.total_revenue) * 100).toFixed(1) : '0'}% of total
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Avg Order Value</CardTitle>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-orange-600" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetScorecard('avg-order')}
                  className="h-6 w-6 p-0 text-orange-600 hover:text-orange-800"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{(Number(stats.average_order_value) || 0).toFixed(0)} SAR</div>
              <p className="text-xs text-orange-600">Per completed order</p>
            </CardContent>
          </Card>
        </div>

        {/* Status Scorecards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          {[
            {
              label: "Pending",
              count: filteredStats.pending,
              icon: Clock,
              bgClass: "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200",
              iconClass: "h-4 w-4 text-yellow-600",
              buttonClass: "h-6 w-6 p-0 text-yellow-600 hover:text-yellow-800",
              countClass: "text-2xl font-bold text-yellow-900",
              labelClass: "text-xs text-yellow-600 font-medium"
            },
            {
              label: "Available",
              count: filteredStats.available,
              icon: CheckCircle,
              bgClass: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
              iconClass: "h-4 w-4 text-blue-600",
              buttonClass: "h-6 w-6 p-0 text-blue-600 hover:text-blue-800",
              countClass: "text-2xl font-bold text-blue-900",
              labelClass: "text-xs text-blue-600 font-medium"
            },
            {
              label: "Payment Sent",
              count: filteredStats.paymentSent,
              icon: CreditCard,
              bgClass: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200",
              iconClass: "h-4 w-4 text-purple-600",
              buttonClass: "h-6 w-6 p-0 text-purple-600 hover:text-purple-800",
              countClass: "text-2xl font-bold text-purple-900",
              labelClass: "text-xs text-purple-600 font-medium"
            },
            {
              label: "Paid",
              count: filteredStats.paid,
              icon: Banknote,
              bgClass: "bg-gradient-to-br from-green-50 to-green-100 border-green-200",
              iconClass: "h-4 w-4 text-green-600",
              buttonClass: "h-6 w-6 p-0 text-green-600 hover:text-green-800",
              countClass: "text-2xl font-bold text-green-900",
              labelClass: "text-xs text-green-600 font-medium"
            },
            {
              label: "Processing",
              count: filteredStats.processing,
              icon: Package,
              bgClass: "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200",
              iconClass: "h-4 w-4 text-orange-600",
              buttonClass: "h-6 w-6 p-0 text-orange-600 hover:text-orange-800",
              countClass: "text-2xl font-bold text-orange-900",
              labelClass: "text-xs text-orange-600 font-medium"
            },
            {
              label: "Dispatched",
              count: filteredStats.dispatched,
              icon: Truck,
              bgClass: "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200",
              iconClass: "h-4 w-4 text-emerald-600",
              buttonClass: "h-6 w-6 p-0 text-emerald-600 hover:text-emerald-800",
              countClass: "text-2xl font-bold text-emerald-900",
              labelClass: "text-xs text-emerald-600 font-medium"
            },
            {
              label: "Not Available",
              count: filteredStats.notAvailable,
              icon: XCircle,
              bgClass: "bg-gradient-to-br from-red-50 to-red-100 border-red-200",
              iconClass: "h-4 w-4 text-red-600",
              buttonClass: "h-6 w-6 p-0 text-red-600 hover:text-red-800",
              countClass: "text-2xl font-bold text-red-900",
              labelClass: "text-xs text-red-600 font-medium"
            },
          ].map((item) => (
            <Card key={item.label} className={`${item.bgClass} hover:shadow-lg transition-shadow`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <item.icon className={item.iconClass} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resetScorecard(item.label.toLowerCase())}
                    className={item.buttonClass}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className={item.countClass}>{item.count}</div>
                <p className={item.labelClass}>{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Advanced Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RequestStatus | "all")}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Not Available">Not Available</SelectItem>
                    <SelectItem value="Payment Sent">Payment Sent</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Dispatched">Dispatched</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-status">Payment Status</Label>
                <Select value={paymentStatusFilter} onValueChange={(value) => setPaymentStatusFilter(value as PaymentStatus | "all")}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Payment Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payment Statuses</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort-by">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="timestamp">Date</SelectItem>
                    <SelectItem value="customer_name">Customer</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort-order">Order</Label>
                <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as "asc" | "desc")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {filteredAndSortedRequests.length} of {requests.length} requests
                {filteredStats.totalRevenue > 0 && (
                  <span className="ml-2 font-medium">
                    • Total Value: {filteredStats.totalRevenue.toLocaleString()} SAR
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPaymentStatusFilter("all");
                  setDateRange(undefined);
                  setSortBy("timestamp");
                  setSortOrder("desc");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <PieChart className="h-5 w-5 text-blue-600" />
                <span>Spare Parts Requests</span>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {filteredAndSortedRequests.length} results
              </Badge>
            </CardTitle>
            <CardDescription>
              Comprehensive order management with revenue tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Part</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price Breakdown</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedRequests.map((request) => (
                    <TableRow key={request.request_id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(request.status)}
                          <span>{request.request_id}</span>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(request.timestamp).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.customer_name}</div>
                          <div className="text-sm text-muted-foreground">{request.phone_number}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium">{request.vehicle_estamra}</div>
                          <div className="text-xs text-muted-foreground">{request.vin_number}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-48">
                        <div className="truncate" title={request.part_name}>
                          {request.part_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(request.status)} className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.price && Number(request.price) > 0 ? (
                          <div className="text-sm">
                            <div className="font-medium">{Number(request.price).toFixed(2)} SAR</div>
                            <div className="text-xs text-muted-foreground">
                              Parts: {(Number(request.price) * 0.85).toFixed(2)} • Freight: {(Number(request.price) * 0.15).toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={request.payment_status === "Paid" ? "default" : "outline"}
                          className={request.payment_status === "Paid" ? "text-green-600" : ""}
                        >
                          {request.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.whatsapp_sent ? (
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Sent
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendWhatsAppMessage(request)}
                            className="h-6 px-2 text-xs"
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Send
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsPaymentDialogOpen(true);
                          }}
                          title="Manage Payment"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredAndSortedRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No requests found matching your filters</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Payment Management Dialog */}
      <PaymentManagementDialog
        request={selectedRequest}
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        onUpdateRequest={handleUpdateRequest}
      />

      {/* WhatsApp Configuration Dialog */}
      <WhatsAppConfigDialog
        isOpen={isWhatsAppConfigOpen}
        onClose={() => setIsWhatsAppConfigOpen(false)}
        onSave={handleWhatsAppConfigSave}
        currentConfig={null}
      />
    </div>
  );
}
