import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  Users, Search, Plus, ChevronRight, MessageCircle, 
  Calendar, BarChart3, Settings, Filter, SortAsc
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { AnimatedCard } from "@/components/ui/animated-card";

export default function ClientManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const allClients = [
    { id: 1, name: "Sarah Johnson", progress: 85, lastActivity: "2 hours ago", status: "active", joinDate: "Jan 2025", plan: "Premium" },
    { id: 2, name: "Mike Chen", progress: 92, lastActivity: "1 day ago", status: "excellent", joinDate: "Dec 2024", plan: "Basic" },
    { id: 3, name: "Emma Davis", progress: 68, lastActivity: "3 hours ago", status: "needs-attention", joinDate: "Feb 2025", plan: "Premium" },
    { id: 4, name: "James Wilson", progress: 78, lastActivity: "5 hours ago", status: "active", joinDate: "Jan 2025", plan: "Premium" },
    { id: 5, name: "Lisa Rodriguez", progress: 95, lastActivity: "1 hour ago", status: "excellent", joinDate: "Nov 2024", plan: "Premium" },
    { id: 6, name: "David Kim", progress: 72, lastActivity: "6 hours ago", status: "active", joinDate: "Feb 2025", plan: "Basic" },
    { id: 7, name: "Rachel Green", progress: 58, lastActivity: "2 days ago", status: "needs-attention", joinDate: "Jan 2025", plan: "Basic" },
    { id: 8, name: "Tom Anderson", progress: 88, lastActivity: "4 hours ago", status: "excellent", joinDate: "Dec 2024", plan: "Premium" }
  ];

  const filteredClients = allClients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || client.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-orange-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-900 via-red-900 to-black rounded-3xl p-8 mb-8 border border-orange-400/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-300 via-yellow-300 to-red-300 bg-clip-text text-transparent mb-2">
              Client Management
            </h1>
            <p className="text-orange-300 text-lg">Manage and track all your clients' progress</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-900/50 border-gray-600 text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              onClick={() => setFilterStatus("all")}
              className="bg-orange-500 hover:bg-orange-600"
            >
              All Clients
            </Button>
            <Button
              variant={filterStatus === "active" ? "default" : "outline"}
              onClick={() => setFilterStatus("active")}
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              Active
            </Button>
            <Button
              variant={filterStatus === "excellent" ? "default" : "outline"}
              onClick={() => setFilterStatus("excellent")}
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              Excellent
            </Button>
            <Button
              variant={filterStatus === "needs-attention" ? "default" : "outline"}
              onClick={() => setFilterStatus("needs-attention")}
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              Needs Attention
            </Button>
          </div>
        </div>

        {/* Client Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {filteredClients.map((client) => (
            <AnimatedCard key={client.id} className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border-orange-400/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {client.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{client.name}</h3>
                      <p className="text-gray-400 text-sm">Joined: {client.joinDate}</p>
                      <Badge variant={client.plan === 'Premium' ? 'default' : 'secondary'} className="mt-1">
                        {client.plan} Plan
                      </Badge>
                    </div>
                  </div>
                  <Badge variant={client.status === 'excellent' ? 'default' : client.status === 'needs-attention' ? 'destructive' : 'secondary'}>
                    {client.status}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300 text-sm">Progress</span>
                      <span className="text-orange-400 font-medium">{client.progress}%</span>
                    </div>
                    <Progress value={client.progress} className="h-3" />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Last active: {client.lastActivity}</span>
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button size="sm" variant="outline" className="flex-1 bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700/50">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700/50">
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700/50">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analytics
                    </Button>
                  </div>
                </div>
              </CardContent>
            </AnimatedCard>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border-orange-400/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Plus className="w-5 h-5 mr-2 text-orange-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/create-plan">
                <Button className="w-full h-16 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white">
                  <Plus className="w-5 h-5 mr-2" />
                  Add New Client
                </Button>
              </Link>
              <Button className="w-full h-16 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white">
                <MessageCircle className="w-5 h-5 mr-2" />
                Send Bulk Message
              </Button>
              <Button className="w-full h-16 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white">
                <BarChart3 className="w-5 h-5 mr-2" />
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}