import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  Shield, 
  TrendingUp, 
  DollarSign, 
  Activity,
  Plus,
  Search,
  Filter,
  Download,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Ban,
  UserCheck,
  LogOut
} from "lucide-react";
import { AnimatedPage } from "@/components/ui/animated-page";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { ProgressBar } from "@/components/ui/progress-bar";

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);

  // Fetch admin stats
  const { data: adminStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    retry: false,
  });

  // Fetch users list
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

  // Fetch coaches list
  const { data: coaches = [] } = useQuery({
    queryKey: ["/api/admin/coaches"],
    retry: false,
  });

  // Fetch subscription stats
  const { data: subscriptionStats } = useQuery({
    queryKey: ["/api/admin/subscriptions"],
    retry: false,
  });

  // Fetch system reports
  const { data: reports = [] } = useQuery({
    queryKey: ["/api/admin/reports"],
    retry: false,
  });

  // Create admin mutation
  const createAdminMutation = useMutation({
    mutationFn: async (data: {
      username: string;
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
      role: 'admin' | 'super_admin';
    }) => {
      return await apiRequest("/api/admin/create-admin", "POST", data);
    },
    onSuccess: () => {
      setIsCreateAdminOpen(false);
      toast({
        title: "Admin created successfully",
        description: "New admin account has been created",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create admin",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user status mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      return await apiRequest(`/api/admin/users/${userId}/status`, "PUT", { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User status updated",
        description: "User status has been changed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update user status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (reportType: string) => {
      return await apiRequest("/api/admin/generate-report", "POST", { reportType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      toast({
        title: "Report generated",
        description: "New report has been generated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate report",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    try {
      await apiRequest("/api/admin/logout", "POST", {});
      window.location.href = "/admin/login";
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  // Download report function
  const downloadReport = async (report: any) => {
    try {
      const response = await apiRequest(`/api/admin/reports/${report.id}/download`, "GET");
      const data = await response.json();
      
      // Create CSV content based on report type
      let csvContent = '';
      const timestamp = new Date().toISOString().split('T')[0];
      
      if (report.reportType === 'user_stats') {
        csvContent = generateUserStatsCSV(data.data, users as any[]);
      } else if (report.reportType === 'revenue') {
        csvContent = generateRevenueCSV(data.data, users as any[]);
      } else if (report.reportType === 'subscription_stats') {
        csvContent = generateSubscriptionCSV(data.data, users as any[]);
      }
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${report.reportType}_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Report downloaded",
        description: `${report.reportType.replace('_', ' ')} report has been downloaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download report",
        variant: "destructive",
      });
    }
  };

  // Generate User Stats CSV
  const generateUserStatsCSV = (reportData: any, userData: any[]) => {
    const headers = ['User ID', 'Email', 'First Name', 'Last Name', 'User Type', 'Subscription Status', 'Created Date', 'Last Login'];
    const rows = userData.map(user => [
      user.id || '',
      user.email || '',
      user.firstName || '',
      user.lastName || '',
      user.userType || 'individual',
      user.subscriptionStatus || 'trial',
      user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
      user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'
    ]);
    
    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  };

  // Generate Revenue CSV
  const generateRevenueCSV = (reportData: any, userData: any[]) => {
    const headers = ['User ID', 'Email', 'Subscription Type', 'Status', 'Monthly Revenue', 'Total Revenue', 'Start Date'];
    const activeUsers = userData.filter(user => user.subscriptionStatus === 'active');
    const rows = activeUsers.map(user => [
      user.id,
      user.email || '',
      user.subscriptionStatus,
      'Active',
      '$29.99', // Assuming standard subscription price
      user.subscriptionStatus === 'active' ? '$29.99' : '$0.00',
      new Date(user.createdAt).toLocaleDateString()
    ]);
    
    // Add summary row
    const totalRevenue = activeUsers.length * 29.99;
    rows.push(['', '', '', 'TOTAL', `$${totalRevenue.toFixed(2)}`, `$${totalRevenue.toFixed(2)}`, '']);
    
    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  };

  // Generate Subscription CSV
  const generateSubscriptionCSV = (reportData: any, userData: any[]) => {
    const headers = ['Subscription Status', 'Count', 'Percentage'];
    const statusCounts = userData.reduce((acc: any, user) => {
      const status = user.subscriptionStatus || 'trial';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    const total = userData.length;
    const rows = Object.entries(statusCounts).map(([status, count]: [string, any]) => [
      status,
      count,
      `${((count / total) * 100).toFixed(1)}%`
    ]);
    
    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  };

  const stats = adminStats as any || {
    totalUsers: 0,
    totalCoaches: 0,
    activeSubscriptions: 0,
    trialUsers: 0,
    monthlyRevenue: 0,
    annualRevenue: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
    conversionRate: 0,
    pendingVerifications: 0,
    totalVerifications: 0,
    averageRevenuePerUser: 0,
  };

  const filteredUsers = Array.isArray(users) ? users.filter((user: any) => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = userFilter === "all" || user.userType === userFilter;
    return matchesSearch && matchesFilter;
  }) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "trial": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "expired": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const tabsData = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <AnimatedCard>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                    <p className="text-xs text-green-600">+{stats.newUsersThisWeek} this week</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </AnimatedCard>

            <AnimatedCard>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Coaches</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalCoaches}</p>
                  </div>
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </AnimatedCard>

            <AnimatedCard>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </AnimatedCard>

            <AnimatedCard>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">${stats.monthlyRevenue}</p>
                    <p className="text-xs text-green-600">Annual: ${stats.annualRevenue}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </AnimatedCard>

            <AnimatedCard>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Trial Users</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.trialUsers}</p>
                    <p className="text-xs text-blue-600">{stats.conversionRate}% convert</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </AnimatedCard>

            <AnimatedCard>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Coach Verifications</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.pendingVerifications}</p>
                    <p className="text-xs text-orange-600">Pending review</p>
                  </div>
                  <Shield className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </AnimatedCard>
          </div>

          {/* Additional Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AnimatedCard>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">New Users This Month</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.newUsersThisMonth}</p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </AnimatedCard>

            <AnimatedCard>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Revenue Per User</p>
                    <p className="text-2xl font-bold text-gray-900">${stats.averageRevenuePerUser}</p>
                  </div>
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </AnimatedCard>

            <AnimatedCard>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Verifications</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalVerifications}</p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
              </CardContent>
            </AnimatedCard>
          </div>

          {/* Charts and Quick Actions */}
          <div className="grid lg:grid-cols-2 gap-6">
            <AnimatedCard>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>User registration over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <TrendingUp className="h-16 w-16 opacity-50" />
                  <p className="ml-4">Chart visualization would go here</p>
                </div>
              </CardContent>
            </AnimatedCard>

            <AnimatedCard>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common admin tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AnimatedButton 
                  className="w-full justify-start"
                  onClick={() => generateReportMutation.mutate("user_stats")}
                  loading={generateReportMutation.isPending}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Generate User Report
                </AnimatedButton>
                <AnimatedButton 
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => generateReportMutation.mutate("subscription_stats")}
                >
                  <Activity className="mr-2 h-4 w-4" />
                  Generate Subscription Report
                </AnimatedButton>
                <Dialog open={isCreateAdminOpen} onOpenChange={setIsCreateAdminOpen}>
                  <DialogTrigger asChild>
                    <AnimatedButton className="w-full justify-start" variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Admin Account
                    </AnimatedButton>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Admin</DialogTitle>
                      <DialogDescription>
                        Create a new administrator account with system access privileges.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" placeholder="John" />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" placeholder="Doe" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" placeholder="johndoe" />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="john@example.com" />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" placeholder="••••••••" />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <AnimatedButton className="w-full">
                        Create Admin
                      </AnimatedButton>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </AnimatedCard>
          </div>
        </div>
      )
    },
    {
      id: "users",
      label: "Users",
      content: (
        <div className="space-y-6">
          {/* User Management Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <p className="text-gray-600">Manage user accounts and subscriptions</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="individual">Individuals</SelectItem>
                  <SelectItem value="coach">Coaches</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Users Table */}
          <AnimatedCard>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {user.firstName?.charAt(0) || user.email?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.userType === "coach" ? "default" : "secondary"}>
                          {user.userType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.subscriptionStatus)}>
                          {user.subscriptionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateUserStatusMutation.mutate({ 
                              userId: user.id, 
                              status: user.subscriptionStatus === "active" ? "cancelled" : "active" 
                            })}
                          >
                            {user.subscriptionStatus === "active" ? <Ban className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </AnimatedCard>
        </div>
      )
    },
    {
      id: "reports",
      label: "Reports",
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">System Reports</h2>
              <p className="text-gray-600">View and generate system reports</p>
            </div>
            <div className="flex space-x-2">
              <AnimatedButton onClick={() => generateReportMutation.mutate("revenue")}>
                <Download className="mr-2 h-4 w-4" />
                Generate Revenue Report
              </AnimatedButton>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <AnimatedCard>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(reports) && reports.length > 0 ? reports.map((report: any) => (
                    <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{report.reportType.replace('_', ' ').toUpperCase()}</p>
                        <p className="text-sm text-gray-500">
                          Generated {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => downloadReport(report)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  )) : (
                    <p className="text-gray-500 text-center py-4">No reports generated yet</p>
                  )}
                </div>
              </CardContent>
            </AnimatedCard>
          </div>
        </div>
      )
    }
  ];

  return (
    <AnimatedPage className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">ACTIV System Management</p>
              </div>
            </div>
            <AnimatedButton variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </AnimatedButton>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatedTabs tabs={tabsData} defaultTab="overview" />
      </main>
    </AnimatedPage>
  );
}