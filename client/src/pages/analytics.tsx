import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, BarChart3, TrendingUp, Users, Target, 
  Calendar, DollarSign, Star, Award, Clock, Activity
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { AnimatedCard } from "@/components/ui/animated-card";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("month");

  const performanceData = {
    totalClients: 45,
    activeClients: 38,
    completedPlans: 156,
    averageRating: 4.8,
    monthlyRevenue: 12400,
    clientRetention: 92
  };

  const clientProgress = [
    { name: "Sarah Johnson", progress: 95, status: "excellent", change: "+12%" },
    { name: "Mike Chen", progress: 88, status: "great", change: "+8%" },
    { name: "Emma Davis", progress: 76, status: "good", change: "+15%" },
    { name: "James Wilson", progress: 82, status: "good", change: "+5%" },
    { name: "Lisa Parker", progress: 91, status: "excellent", change: "+18%" }
  ];

  const monthlyStats = [
    { month: "Jan", clients: 32, revenue: 8900, satisfaction: 4.6 },
    { month: "Feb", clients: 35, revenue: 9800, satisfaction: 4.7 },
    { month: "Mar", clients: 38, revenue: 10500, satisfaction: 4.8 },
    { month: "Apr", clients: 42, revenue: 11200, satisfaction: 4.8 },
    { month: "May", clients: 45, revenue: 12400, satisfaction: 4.9 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/coach-home">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Analytics & Performance</h1>
              <p className="text-gray-300">Track your coaching performance and client progress</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {["week", "month", "quarter", "year"].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
                className={timeRange === range 
                  ? "bg-gradient-to-r from-cyan-500 to-purple-600" 
                  : "border-white/20 text-white hover:bg-white/10"
                }
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Key Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <AnimatedCard className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Total Clients</p>
                <p className="text-3xl font-bold text-cyan-400">{performanceData.totalClients}</p>
                <p className="text-sm text-green-400">+6 this month</p>
              </div>
              <Users className="w-12 h-12 text-cyan-400" />
            </div>
          </AnimatedCard>

          <AnimatedCard className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Monthly Revenue</p>
                <p className="text-3xl font-bold text-emerald-400">${performanceData.monthlyRevenue.toLocaleString()}</p>
                <p className="text-sm text-green-400">+18% from last month</p>
              </div>
              <DollarSign className="w-12 h-12 text-emerald-400" />
            </div>
          </AnimatedCard>

          <AnimatedCard className="bg-white/10 backdrop-blur-sm border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Average Rating</p>
                <p className="text-3xl font-bold text-yellow-400">{performanceData.averageRating}</p>
                <p className="text-sm text-green-400">+0.1 this month</p>
              </div>
              <Star className="w-12 h-12 text-yellow-400" />
            </div>
          </AnimatedCard>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Client Progress Overview */}
          <div className="lg:col-span-2">
            <AnimatedCard className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                  Client Progress Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clientProgress.map((client, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {client.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{client.name}</h4>
                          <p className="text-sm text-gray-300">Overall Progress</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <Progress value={client.progress} className="w-24 h-2" />
                            <span className="text-sm font-medium text-cyan-400">{client.progress}%</span>
                          </div>
                          <p className="text-xs text-green-400 mt-1">{client.change} this month</p>
                        </div>
                        <Badge 
                          variant={client.status === 'excellent' ? 'default' : 'secondary'}
                          className={client.status === 'excellent' 
                            ? 'bg-green-500/20 text-green-400 border-green-400/30' 
                            : 'bg-blue-500/20 text-blue-400 border-blue-400/30'
                          }
                        >
                          {client.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </AnimatedCard>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-6">
            {/* Monthly Growth */}
            <AnimatedCard className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                  Monthly Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyStats.slice(-3).map((stat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-300">{stat.month}</span>
                      <div className="text-right">
                        <p className="text-white font-medium">{stat.clients} clients</p>
                        <p className="text-sm text-emerald-400">${stat.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </AnimatedCard>

            {/* Performance Summary */}
            <AnimatedCard className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Award className="w-5 h-5 mr-2 text-yellow-400" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Client Retention</span>
                    <span className="text-green-400 font-bold">{performanceData.clientRetention}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Plans Completed</span>
                    <span className="text-cyan-400 font-bold">{performanceData.completedPlans}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Active Clients</span>
                    <span className="text-purple-400 font-bold">{performanceData.activeClients}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Success Rate</span>
                    <span className="text-emerald-400 font-bold">94%</span>
                  </div>
                </div>
              </CardContent>
            </AnimatedCard>

            {/* Quick Actions */}
            <AnimatedCard className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border-purple-400/30">
              <CardContent className="p-6">
                <h4 className="text-white font-semibold mb-3 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-pink-400" />
                  Quick Insights
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">• Top performing client: Sarah Johnson (95%)</p>
                  <p className="text-gray-300">• Most popular plan: High Protein (32 clients)</p>
                  <p className="text-gray-300">• Best month: May 2025 (+18% revenue)</p>
                  <p className="text-gray-300">• Client satisfaction increased by 0.2 points</p>
                </div>
              </CardContent>
            </AnimatedCard>
          </div>
        </div>
      </div>
    </div>
  );
}