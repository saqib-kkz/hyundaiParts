import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Truck,
  Calendar as CalendarIcon,
  Download,
  FileText,
  PieChart,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Equal
} from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";

interface MetricsData {
  overview: {
    total_revenue: number;
    total_orders: number;
    average_order_value: number;
    success_rate: number;
    growth_rate: number;
  };
  revenue_breakdown: {
    parts_revenue: number;
    freight_revenue: number;
    total_revenue: number;
  };
  status_distribution: {
    pending: number;
    available: number;
    payment_sent: number;
    paid: number;
    processing: number;
    dispatched: number;
    not_available: number;
  };
  top_customers: Array<{
    name: string;
    orders: number;
    revenue: number;
    last_order: string;
  }>;
  top_parts: Array<{
    part_name: string;
    quantity: number;
    revenue: number;
    avg_price: number;
  }>;
  daily_stats: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  monthly_trends: Array<{
    month: string;
    orders: number;
    revenue: number;
    growth: number;
  }>;
}

// Mock data for demonstration
const mockMetricsData: MetricsData = {
  overview: {
    total_revenue: 45600.00,
    total_orders: 156,
    average_order_value: 292.31,
    success_rate: 94.2,
    growth_rate: 15.7
  },
  revenue_breakdown: {
    parts_revenue: 38200.00,
    freight_revenue: 7400.00,
    total_revenue: 45600.00
  },
  status_distribution: {
    pending: 23,
    available: 12,
    payment_sent: 8,
    paid: 15,
    processing: 21,
    dispatched: 89,
    not_available: 6
  },
  top_customers: [
    { name: "Ahmed Al-Rashid", orders: 8, revenue: 2340.00, last_order: "2024-01-15" },
    { name: "Fatima Al-Zahra", orders: 6, revenue: 1890.00, last_order: "2024-01-14" },
    { name: "Mohammed Hassan", orders: 5, revenue: 1650.00, last_order: "2024-01-13" },
    { name: "Sara Al-Mahmoud", orders: 4, revenue: 1280.00, last_order: "2024-01-12" },
    { name: "Khalid Al-Otaibi", orders: 7, revenue: 2100.00, last_order: "2024-01-11" }
  ],
  top_parts: [
    { part_name: "Brake Pads - Front", quantity: 24, revenue: 4800.00, avg_price: 200.00 },
    { part_name: "Air Filter", quantity: 18, revenue: 2700.00, avg_price: 150.00 },
    { part_name: "Side Mirror Assembly", quantity: 15, revenue: 6750.00, avg_price: 450.00 },
    { part_name: "Headlight Assembly", quantity: 12, revenue: 4800.00, avg_price: 400.00 },
    { part_name: "Oil Filter", quantity: 20, revenue: 2000.00, avg_price: 100.00 }
  ],
  daily_stats: [
    { date: "2024-01-10", orders: 3, revenue: 890.00 },
    { date: "2024-01-11", orders: 5, revenue: 1450.00 },
    { date: "2024-01-12", orders: 2, revenue: 640.00 },
    { date: "2024-01-13", orders: 4, revenue: 1200.00 },
    { date: "2024-01-14", orders: 6, revenue: 1780.00 },
    { date: "2024-01-15", orders: 8, revenue: 2340.00 },
    { date: "2024-01-16", orders: 3, revenue: 920.00 }
  ],
  monthly_trends: [
    { month: "Oct 2023", orders: 45, revenue: 13200.00, growth: 8.5 },
    { month: "Nov 2023", orders: 52, revenue: 15800.00, growth: 15.5 },
    { month: "Dec 2023", orders: 48, revenue: 14600.00, growth: -7.6 },
    { month: "Jan 2024", orders: 67, revenue: 19500.00, growth: 33.6 }
  ]
};

interface MetricsReportProps {
  className?: string;
}

export default function MetricsReport({ className }: MetricsReportProps) {
  const [metricsData, setMetricsData] = useState<MetricsData>(mockMetricsData);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [reportType, setReportType] = useState<"overview" | "detailed" | "export">("overview");
  const [isLoading, setIsLoading] = useState(false);

  const refreshMetrics = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const exportReport = async (exportFormat: "csv" | "pdf" | "excel") => {
    try {
      const exportData = {
        format: exportFormat,
        date_range: dateRange,
        include_revenue: true,
        include_customer_details: true,
        metrics: metricsData
      };

      // In production, this would make an API call to generate the report
      console.log('Exporting report:', exportData);

      // Simulate file download
      const fileName = `hyundai-parts-report-${exportFormat}-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;
      alert(`Report "${fileName}" would be downloaded in production.`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report');
    }
  };

  const getTrendIcon = (growth: number) => {
    if (growth > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (growth < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Equal className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (growth: number) => {
    if (growth > 0) return "text-green-600";
    if (growth < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
          <p className="text-gray-600">Comprehensive metrics and performance insights</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={reportType} onValueChange={(value) => setReportType(value as any)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="detailed">Detailed</SelectItem>
              <SelectItem value="export">Export</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4" />
                <span>
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM dd, yyyy")
                    )
                  ) : (
                    "Pick a date range"
                  )}
                </span>
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

          <Button
            onClick={refreshMetrics}
            variant="outline"
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <BarChart3 className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {metricsData.overview.total_revenue.toLocaleString()} SAR
            </div>
            <div className={`flex items-center text-xs mt-1 ${getTrendColor(metricsData.overview.growth_rate)}`}>
              {getTrendIcon(metricsData.overview.growth_rate)}
              <span className="ml-1">+{metricsData.overview.growth_rate}% vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {metricsData.overview.total_orders}
            </div>
            <div className="flex items-center text-xs text-blue-600 mt-1">
              <Package className="h-3 w-3 mr-1" />
              <span>All time orders</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Avg Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {(Number(metricsData.overview.average_order_value) || 0).toFixed(0)} SAR
            </div>
            <div className="flex items-center text-xs text-purple-600 mt-1">
              <Target className="h-3 w-3 mr-1" />
              <span>Per completed order</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {metricsData.overview.success_rate}%
            </div>
            <div className="flex items-center text-xs text-orange-600 mt-1">
              <CheckCircle className="h-3 w-3 mr-1" />
              <span>Completed orders</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-700">Growth Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-900">
              +{metricsData.overview.growth_rate}%
            </div>
            <div className="flex items-center text-xs text-indigo-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>Month over month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              <span>Revenue Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Parts Revenue</span>
                <div className="text-right">
                  <div className="font-medium">{metricsData.revenue_breakdown.parts_revenue.toLocaleString()} SAR</div>
                  <div className="text-xs text-gray-500">
                    {metricsData.revenue_breakdown.total_revenue > 0 ? ((metricsData.revenue_breakdown.parts_revenue / metricsData.revenue_breakdown.total_revenue) * 100).toFixed(1) : '0'}%
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Freight Revenue</span>
                <div className="text-right">
                  <div className="font-medium">{metricsData.revenue_breakdown.freight_revenue.toLocaleString()} SAR</div>
                  <div className="text-xs text-gray-500">
                    {metricsData.revenue_breakdown.total_revenue > 0 ? ((metricsData.revenue_breakdown.freight_revenue / metricsData.revenue_breakdown.total_revenue) * 100).toFixed(1) : '0'}%
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center font-bold">
                <span>Total Revenue</span>
                <span className="text-green-600">{metricsData.revenue_breakdown.total_revenue.toLocaleString()} SAR</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <span>Order Status Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metricsData.status_distribution).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 capitalize">
                    {status.replace('_', ' ')}
                  </span>
                  <Badge variant="outline" className="font-medium">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>Monthly Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metricsData.monthly_trends.slice(-4).map((month, index) => (
                <div key={month.month} className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">{month.month}</div>
                    <div className="text-xs text-gray-500">{month.orders} orders</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{month.revenue.toLocaleString()} SAR</div>
                    <div className={`text-xs flex items-center ${getTrendColor(month.growth)}`}>
                      {getTrendIcon(month.growth)}
                      <span className="ml-1">{month.growth > 0 ? '+' : ''}{month.growth}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Top Customers</span>
            </CardTitle>
            <CardDescription>Highest spending customers this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metricsData.top_customers.map((customer, index) => (
                <div key={customer.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.orders} orders</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{customer.revenue.toLocaleString()} SAR</div>
                    <div className="text-xs text-gray-500">Last: {format(new Date(customer.last_order), 'MMM dd')}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <span>Top Selling Parts</span>
            </CardTitle>
            <CardDescription>Most popular parts by quantity and revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metricsData.top_parts.map((part, index) => (
                <div key={part.part_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-yellow-600">#{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-medium">{part.part_name}</div>
                      <div className="text-sm text-gray-500">Qty: {part.quantity} • Avg: {part.avg_price} SAR</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{part.revenue.toLocaleString()} SAR</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      {reportType === "export" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-blue-600" />
              <span>Export Reports</span>
            </CardTitle>
            <CardDescription>Download comprehensive reports in various formats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => exportReport("csv")}
                variant="outline"
                className="flex items-center space-x-2 h-20 flex-col"
              >
                <FileText className="h-6 w-6 text-green-600" />
                <span className="font-medium">CSV Report</span>
                <span className="text-xs text-gray-500">Excel compatible</span>
              </Button>
              
              <Button
                onClick={() => exportReport("pdf")}
                variant="outline"
                className="flex items-center space-x-2 h-20 flex-col"
              >
                <FileText className="h-6 w-6 text-red-600" />
                <span className="font-medium">PDF Report</span>
                <span className="text-xs text-gray-500">Formatted document</span>
              </Button>
              
              <Button
                onClick={() => exportReport("excel")}
                variant="outline"
                className="flex items-center space-x-2 h-20 flex-col"
              >
                <FileText className="h-6 w-6 text-blue-600" />
                <span className="font-medium">Excel Report</span>
                <span className="text-xs text-gray-500">Advanced analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-indigo-600" />
            <span>Daily Performance</span>
          </CardTitle>
          <CardDescription>Orders and revenue for the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {metricsData.daily_stats.map((day) => (
              <div key={day.date} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">
                  {format(new Date(day.date), 'MMM dd')}
                </div>
                <div className="text-lg font-bold text-indigo-600 mb-1">
                  {day.orders}
                </div>
                <div className="text-xs text-gray-600">
                  {day.revenue.toLocaleString()} SAR
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
