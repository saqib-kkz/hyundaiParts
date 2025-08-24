import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  Settings, 
  Key, 
  Bell, 
  Shield, 
  Camera,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useAuth, getRoleDisplayName, getRoleColor } from "@/lib/auth";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";

export default function Profile() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    department: "Spare Parts Department"
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    whatsappNotifications: true,
    systemAlerts: true,
    requestUpdates: true,
    paymentNotifications: true
  });

  const handleProfileUpdate = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsEditing(false);
      alert("Profile updated successfully");
    } catch (error) {
      alert("Failed to update profile");
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords don't match");
      return;
    }
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      alert("Password changed successfully");
    } catch (error) {
      alert("Failed to change password");
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("Notification preferences updated");
    } catch (error) {
      alert("Failed to update preferences");
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="h-8 w-8 text-hyundai-blue" />
              <div>
                <h1 className="text-2xl font-bold text-hyundai-dark-gray">Profile Settings</h1>
                <p className="text-sm text-muted-foreground">Manage your account settings and preferences</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Link 
                to="/dashboard" 
                className="text-hyundai-blue hover:text-hyundai-dark-blue"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Summary Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-lg">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0"
                    >
                      <Camera className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <h3 className="mt-4 text-lg font-semibold">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  
                  <Badge className={`mt-2 ${getRoleColor(user.role)}`}>
                    {getRoleDisplayName(user.role)}
                  </Badge>
                  
                  <div className="mt-4 w-full space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Login:</span>
                      <span>Today, 10:30 AM</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="text-green-600 flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Active
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={logout}
                    className="mt-4 w-full"
                  >
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>
                          Update your personal information and contact details
                        </CardDescription>
                      </div>
                      <Button
                        variant={isEditing ? "default" : "outline"}
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        {isEditing ? "Cancel" : "Edit"}
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profileData.name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+966 5X XXX XXXX"
                          disabled={!isEditing}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          value={profileData.department}
                          onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    
                    {isEditing && (
                      <div className="flex gap-2">
                        <Button onClick={handleProfileUpdate} className="bg-hyundai-blue hover:bg-hyundai-dark-blue">
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security Settings
                    </CardTitle>
                    <CardDescription>
                      Manage your password and security preferences
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Change Password</h4>
                      
                      <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            placeholder="Enter current password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            placeholder="Enter new password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="Confirm new password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <Button onClick={handlePasswordChange} className="bg-hyundai-blue hover:bg-hyundai-dark-blue">
                        Change Password
                      </Button>
                    </div>
                    
                    <div className="border-t pt-6">
                      <h4 className="font-medium mb-4">Two-Factor Authentication</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-900">Enable 2FA for additional security</p>
                          <p className="text-xs text-gray-500">Protect your account with an additional verification step</p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription>
                      Choose how you want to be notified about system updates
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Email Notifications</p>
                          <p className="text-xs text-gray-500">Receive notifications via email</p>
                        </div>
                        <Switch
                          checked={notifications.emailNotifications}
                          onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailNotifications: checked }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">WhatsApp Notifications</p>
                          <p className="text-xs text-gray-500">Receive notifications via WhatsApp</p>
                        </div>
                        <Switch
                          checked={notifications.whatsappNotifications}
                          onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, whatsappNotifications: checked }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">System Alerts</p>
                          <p className="text-xs text-gray-500">Important system updates and alerts</p>
                        </div>
                        <Switch
                          checked={notifications.systemAlerts}
                          onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, systemAlerts: checked }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Request Updates</p>
                          <p className="text-xs text-gray-500">Notifications about spare part request changes</p>
                        </div>
                        <Switch
                          checked={notifications.requestUpdates}
                          onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, requestUpdates: checked }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Payment Notifications</p>
                          <p className="text-xs text-gray-500">Notifications about payment status changes</p>
                        </div>
                        <Switch
                          checked={notifications.paymentNotifications}
                          onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, paymentNotifications: checked }))}
                        />
                      </div>
                    </div>
                    
                    <Button onClick={handleNotificationUpdate} className="bg-hyundai-blue hover:bg-hyundai-dark-blue">
                      Save Preferences
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Permissions Tab */}
              <TabsContent value="permissions">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Account Permissions
                    </CardTitle>
                    <CardDescription>
                      View your current permissions and access levels
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Role</p>
                          <p className="text-sm text-gray-500">Your assigned role in the system</p>
                        </div>
                        <Badge className={getRoleColor(user.role)}>
                          {getRoleDisplayName(user.role)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="font-medium">Permissions:</p>
                        {user.permissions.includes('*') ? (
                          <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
                            <CheckCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm">Full System Access (Administrator)</span>
                          </div>
                        ) : (
                          user.permissions.map((permission) => (
                            <div key={permission} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">{permission}</span>
                            </div>
                          ))
                        )}
                      </div>
                      
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          If you need additional permissions, please contact your system administrator.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
