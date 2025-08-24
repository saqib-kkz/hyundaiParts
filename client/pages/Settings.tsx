import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings as SettingsIcon, 
  Users, 
  Database, 
  MessageCircle, 
  Shield, 
  Key, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff
} from "lucide-react";
import { Link } from "react-router-dom";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "agent";
  status: "active" | "inactive";
  lastLogin?: string;
  createdAt: string;
}

interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken: string;
  isConnected: boolean;
}

interface BigQueryConfig {
  projectId: string;
  datasetId: string;
  tableId: string;
  serviceAccountKey: string;
  isConnected: boolean;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "Admin User",
      email: "admin@hyundai-sa.com",
      role: "admin",
      status: "active",
      lastLogin: "2024-01-15T10:30:00Z",
      createdAt: "2024-01-01T00:00:00Z"
    },
    {
      id: "2", 
      name: "Manager User",
      email: "manager@hyundai-sa.com",
      role: "manager",
      status: "active",
      lastLogin: "2024-01-14T15:20:00Z",
      createdAt: "2024-01-05T00:00:00Z"
    }
  ]);

  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig>({
    accessToken: "",
    phoneNumberId: "",
    businessAccountId: "",
    webhookVerifyToken: "",
    isConnected: false
  });

  const [bigqueryConfig, setBigqueryConfig] = useState<BigQueryConfig>({
    projectId: "",
    datasetId: "spare_parts",
    tableId: "requests",
    serviceAccountKey: "",
    isConnected: false
  });

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "agent" as const,
    password: "",
    confirmPassword: ""
  });

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const handleAddUser = async () => {
    if (newUser.password !== newUser.confirmPassword) {
      alert("Passwords don't match");
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: "active",
      createdAt: new Date().toISOString()
    };

    setUsers(prev => [...prev, user]);
    setNewUser({ name: "", email: "", role: "agent", password: "", confirmPassword: "" });
    setIsAddUserOpen(false);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId 
        ? { ...u, status: u.status === "active" ? "inactive" : "active" } 
        : u
    ));
  };

  const testWhatsAppConnection = async () => {
    setTestingConnection(true);
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));
      setWhatsappConfig(prev => ({ ...prev, isConnected: true }));
    } catch (error) {
      setWhatsappConfig(prev => ({ ...prev, isConnected: false }));
    } finally {
      setTestingConnection(false);
    }
  };

  const testBigQueryConnection = async () => {
    setTestingConnection(true);
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));
      setBigqueryConfig(prev => ({ ...prev, isConnected: true }));
    } catch (error) {
      setBigqueryConfig(prev => ({ ...prev, isConnected: false }));
    } finally {
      setTestingConnection(false);
    }
  };

  const saveWhatsAppConfig = async () => {
    try {
      // Save configuration to backend
      const response = await fetch('/api/settings/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whatsappConfig)
      });
      
      if (response.ok) {
        alert("WhatsApp configuration saved successfully");
      }
    } catch (error) {
      alert("Failed to save WhatsApp configuration");
    }
  };

  const saveBigQueryConfig = async () => {
    try {
      // Save configuration to backend
      const response = await fetch('/api/settings/bigquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bigqueryConfig)
      });

      if (response.ok) {
        alert("BigQuery configuration saved successfully");
      }
    } catch (error) {
      alert("Failed to save BigQuery configuration");
    }
  };

  // Data management functions
  const handleClearSampleData = async () => {
    if (confirm("Are you sure you want to delete all sample data? This action cannot be undone.")) {
      try {
        const response = await fetch('/api/admin/clear-sample-data', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          alert("Sample data cleared successfully");
        } else {
          alert("Failed to clear sample data");
        }
      } catch (error) {
        alert("Error clearing sample data");
      }
    }
  };

  const handleClearAllRequests = async () => {
    const confirmText = "DELETE ALL REQUESTS";
    const userInput = prompt(`This will delete ALL requests permanently. Type "${confirmText}" to confirm:`);

    if (userInput === confirmText) {
      try {
        const response = await fetch('/api/admin/clear-all-requests', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          alert("All requests cleared successfully");
        } else {
          alert("Failed to clear all requests");
        }
      } catch (error) {
        alert("Error clearing requests");
      }
    }
  };

  const handleDatabaseReset = async () => {
    const confirmText = "RESET DATABASE";
    const userInput = prompt(`This will completely reset the database. Type "${confirmText}" to confirm:`);

    if (userInput === confirmText) {
      try {
        const response = await fetch('/api/admin/reset-database', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          alert("Database reset successfully");
          window.location.reload();
        } else {
          alert("Failed to reset database");
        }
      } catch (error) {
        alert("Error resetting database");
      }
    }
  };

  const viewSampleData = () => {
    // Navigate to dashboard with sample data filter
    window.open('/dashboard?filter=sample', '_blank');
  };

  const exportAllData = async () => {
    try {
      const response = await fetch('/api/admin/export-all');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `hyundai-data-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert("Failed to export data");
    }
  };

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
                <h1 className="text-2xl font-bold text-white">Settings & Administration</h1>
                <p className="text-blue-100 text-sm">System Configuration Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="text-blue-100 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                ← Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data Management
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="bigquery" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              BigQuery
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              General
            </TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      Manage system users, roles, and permissions
                    </CardDescription>
                  </div>
                  <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-hyundai-blue hover:bg-hyundai-dark-blue">
                        <Plus className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>
                          Create a new user account with appropriate permissions
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={newUser.name}
                            onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter full name"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Enter email address"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="role">Role</Label>
                          <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value as any }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin - Full access</SelectItem>
                              <SelectItem value="manager">Manager - Limited admin access</SelectItem>
                              <SelectItem value="agent">Agent - Basic access</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              value={newUser.password}
                              onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                              placeholder="Enter password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={newUser.confirmPassword}
                            onChange={(e) => setNewUser(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="Confirm password"
                          />
                        </div>
                        
                        <Button onClick={handleAddUser} className="w-full bg-hyundai-blue hover:bg-hyundai-dark-blue">
                          Create User
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === "active" ? "default" : "secondary"}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleUserStatus(user.id)}
                            >
                              {user.status === "active" ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management Tab */}
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Database className="h-5 w-5" />
                  Data Management
                </CardTitle>
                <CardDescription>
                  Manage system data, clear sample data, and reset the database
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> These operations cannot be undone. Please proceed with caution.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  {/* Sample Data Management */}
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Sample Data</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Remove all sample/demo requests to start with a clean database
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleClearSampleData()}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        Clear Sample Data
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => viewSampleData()}
                      >
                        View Sample Data
                      </Button>
                    </div>
                  </div>

                  {/* Request Data Management */}
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Request Data</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Manage all spare part requests in the system
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => exportAllData()}
                      >
                        Export All Data
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleClearAllRequests()}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        Clear All Requests
                      </Button>
                    </div>
                  </div>

                  {/* Database Reset */}
                  <div className="p-4 border rounded-lg border-red-200 bg-red-50">
                    <h4 className="font-medium mb-2 text-red-800">Database Reset</h4>
                    <p className="text-sm text-red-700 mb-4">
                      Complete database reset - removes ALL data and resets to initial state
                    </p>
                    <Button
                      variant="destructive"
                      onClick={() => handleDatabaseReset()}
                    >
                      Reset Database
                    </Button>
                  </div>

                  {/* Data Statistics */}
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-2">Current Data Statistics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Requests</p>
                        <p className="font-semibold text-lg">156</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Sample Requests</p>
                        <p className="font-semibold text-lg text-yellow-600">2</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Real Requests</p>
                        <p className="font-semibold text-lg text-green-600">154</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Database Size</p>
                        <p className="font-semibold text-lg">2.4 MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp Business API Configuration
                </CardTitle>
                <CardDescription>
                  Configure WhatsApp Business API for customer notifications
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                  {whatsappConfig.isConnected ? (
                    <>
                      <Wifi className="h-5 w-5 text-green-500" />
                      <span className="text-green-700 font-medium">Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-5 w-5 text-red-500" />
                      <span className="text-red-700 font-medium">Not Connected</span>
                    </>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accessToken">Access Token</Label>
                    <Input
                      id="accessToken"
                      type="password"
                      value={whatsappConfig.accessToken}
                      onChange={(e) => setWhatsappConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                      placeholder="Enter WhatsApp access token"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                    <Input
                      id="phoneNumberId"
                      value={whatsappConfig.phoneNumberId}
                      onChange={(e) => setWhatsappConfig(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                      placeholder="Enter phone number ID"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="businessAccountId">Business Account ID</Label>
                    <Input
                      id="businessAccountId"
                      value={whatsappConfig.businessAccountId}
                      onChange={(e) => setWhatsappConfig(prev => ({ ...prev, businessAccountId: e.target.value }))}
                      placeholder="Enter business account ID"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="webhookVerifyToken">Webhook Verify Token</Label>
                    <Input
                      id="webhookVerifyToken"
                      value={whatsappConfig.webhookVerifyToken}
                      onChange={(e) => setWhatsappConfig(prev => ({ ...prev, webhookVerifyToken: e.target.value }))}
                      placeholder="Enter webhook verify token"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <Button
                    onClick={testWhatsAppConnection}
                    disabled={testingConnection}
                    variant="outline"
                  >
                    {testingConnection ? "Testing..." : "Test Connection"}
                  </Button>
                  
                  <Button
                    onClick={saveWhatsAppConfig}
                    className="bg-hyundai-blue hover:bg-hyundai-dark-blue"
                  >
                    Save Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BigQuery Tab */}
          <TabsContent value="bigquery" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  BigQuery Database Configuration
                </CardTitle>
                <CardDescription>
                  Configure BigQuery connection for data storage
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                  {bigqueryConfig.isConnected ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-green-700 font-medium">Connected to BigQuery</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <span className="text-red-700 font-medium">Not Connected</span>
                    </>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="projectId">Project ID</Label>
                    <Input
                      id="projectId"
                      value={bigqueryConfig.projectId}
                      onChange={(e) => setBigqueryConfig(prev => ({ ...prev, projectId: e.target.value }))}
                      placeholder="your-gcp-project-id"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="datasetId">Dataset ID</Label>
                    <Input
                      id="datasetId"
                      value={bigqueryConfig.datasetId}
                      onChange={(e) => setBigqueryConfig(prev => ({ ...prev, datasetId: e.target.value }))}
                      placeholder="spare_parts"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tableId">Table ID</Label>
                    <Input
                      id="tableId"
                      value={bigqueryConfig.tableId}
                      onChange={(e) => setBigqueryConfig(prev => ({ ...prev, tableId: e.target.value }))}
                      placeholder="requests"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="serviceAccountKey">Service Account Key (JSON)</Label>
                  <Textarea
                    id="serviceAccountKey"
                    value={bigqueryConfig.serviceAccountKey}
                    onChange={(e) => setBigqueryConfig(prev => ({ ...prev, serviceAccountKey: e.target.value }))}
                    placeholder="Paste your service account JSON key here..."
                    rows={6}
                  />
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security Note:</strong> Service account keys are sensitive credentials. 
                    Ensure your BigQuery service account has only the necessary permissions.
                  </AlertDescription>
                </Alert>
                
                <div className="flex gap-4">
                  <Button
                    onClick={testBigQueryConnection}
                    disabled={testingConnection}
                    variant="outline"
                  >
                    {testingConnection ? "Testing..." : "Test Connection"}
                  </Button>
                  
                  <Button
                    onClick={saveBigQueryConfig}
                    className="bg-hyundai-blue hover:bg-hyundai-dark-blue"
                  >
                    Save Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Configure system security and access controls
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="2fa">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Require 2FA for all admin users</p>
                    </div>
                    <Switch id="2fa" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sessionTimeout">Auto Logout</Label>
                      <p className="text-sm text-muted-foreground">Automatically logout inactive users</p>
                    </div>
                    <Switch id="sessionTimeout" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auditLog">Audit Logging</Label>
                      <p className="text-sm text-muted-foreground">Log all admin actions</p>
                    </div>
                    <Switch id="auditLog" defaultChecked />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="sessionDuration">Session Duration (minutes)</Label>
                  <Input
                    id="sessionDuration"
                    type="number"
                    defaultValue="480"
                    placeholder="480"
                  />
                </div>
                
                <Button className="bg-hyundai-blue hover:bg-hyundai-dark-blue">
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Configure general system settings
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    defaultValue="Hyundai Saudi Arabia"
                    placeholder="Enter company name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    defaultValue="support@hyundai-sa.com"
                    placeholder="Enter support email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="timezone">Default Timezone</Label>
                  <Select defaultValue="Asia/Riyadh">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Riyadh">Asia/Riyadh (UTC+3)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="language">Default Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button className="bg-hyundai-blue hover:bg-hyundai-dark-blue">
                  Save General Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
