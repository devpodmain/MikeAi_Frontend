import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, Bell, MessageCircle, Calendar, TrendingUp,
  User, Clock, CheckCircle2, X, Settings, Filter
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { AnimatedCard } from "@/components/ui/animated-card";

export default function Notifications() {
  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "appointment",
      title: "Upcoming appointment with Sarah Johnson",
      message: "Nutrition consultation scheduled for 2:00 PM today",
      time: "5 minutes ago",
      read: false,
      priority: "high"
    },
    {
      id: 2,
      type: "message",
      title: "New message from Mike Chen",
      message: "Thanks for the meal plan! I have a question about portion sizes.",
      time: "15 minutes ago",
      read: false,
      priority: "medium"
    },
    {
      id: 3,
      type: "progress",
      title: "Client progress update",
      message: "Emma Davis completed her weekly check-in with excellent results",
      time: "1 hour ago",
      read: true,
      priority: "low"
    },
    {
      id: 4,
      type: "appointment",
      title: "Appointment reminder",
      message: "James Wilson's initial consultation is tomorrow at 11:00 AM",
      time: "2 hours ago",
      read: true,
      priority: "medium"
    },
    {
      id: 5,
      type: "system",
      title: "Monthly report ready",
      message: "Your performance analytics for January are now available",
      time: "3 hours ago",
      read: false,
      priority: "low"
    }
  ]);

  const [preferences, setPreferences] = useState({
    appointments: true,
    messages: true,
    progress: true,
    system: false,
    email: true,
    push: true,
    sms: false
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "appointment": return <Calendar className="w-5 h-5 text-blue-400" />;
      case "message": return <MessageCircle className="w-5 h-5 text-green-400" />;
      case "progress": return <TrendingUp className="w-5 h-5 text-purple-400" />;
      case "system": return <Settings className="w-5 h-5 text-orange-400" />;
      default: return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/20 text-red-400 border-red-400/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-400/30";
      case "low": return "bg-blue-500/20 text-blue-400 border-blue-400/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-400/30";
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === "all") return true;
    if (filter === "unread") return !notif.read;
    return notif.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

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
              <h1 className="text-3xl font-bold text-white flex items-center">
                Notifications 
                {unreadCount > 0 && (
                  <Badge className="ml-3 bg-red-500/20 text-red-400 border-red-400/30">
                    {unreadCount} new
                  </Badge>
                )}
              </h1>
              <p className="text-gray-300">Stay updated with your coaching activities</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAsRead}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Notifications List */}
          <div className="lg:col-span-3">
            {/* Filter Tabs */}
            <div className="flex space-x-2 mb-6">
              {["all", "unread", "appointment", "message", "progress", "system"].map((filterType) => (
                <Button
                  key={filterType}
                  variant={filter === filterType ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(filterType)}
                  className={filter === filterType 
                    ? "bg-gradient-to-r from-cyan-500 to-purple-600" 
                    : "border-white/20 text-white hover:bg-white/10"
                  }
                >
                  <Filter className="w-3 h-3 mr-1" />
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </Button>
              ))}
            </div>

            <AnimatedCard className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-0">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-white font-medium mb-2">No notifications</h3>
                    <p className="text-gray-400">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {filteredNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-6 hover:bg-white/5 transition-all ${
                          !notif.read ? 'bg-white/5 border-l-4 border-cyan-400' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="mt-1">
                              {getIcon(notif.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className={`font-medium ${notif.read ? 'text-gray-300' : 'text-white'}`}>
                                  {notif.title}
                                </h4>
                                <Badge variant="outline" className={getPriorityColor(notif.priority)}>
                                  {notif.priority}
                                </Badge>
                              </div>
                              <p className={`text-sm ${notif.read ? 'text-gray-400' : 'text-gray-300'}`}>
                                {notif.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-2 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {notif.time}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {!notif.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notif.id)}
                                className="text-cyan-400 hover:bg-cyan-400/10"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notif.id)}
                              className="text-red-400 hover:bg-red-400/10"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </AnimatedCard>
          </div>

          {/* Notification Preferences */}
          <div>
            <AnimatedCard className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-orange-400" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-white font-medium mb-3">Notification Types</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm">Appointments</p>
                          <p className="text-gray-400 text-xs">Reminders and updates</p>
                        </div>
                        <Switch 
                          checked={preferences.appointments}
                          onCheckedChange={(checked) => 
                            setPreferences({...preferences, appointments: checked})
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm">Client Messages</p>
                          <p className="text-gray-400 text-xs">New messages from clients</p>
                        </div>
                        <Switch 
                          checked={preferences.messages}
                          onCheckedChange={(checked) => 
                            setPreferences({...preferences, messages: checked})
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm">Progress Updates</p>
                          <p className="text-gray-400 text-xs">Client check-ins and achievements</p>
                        </div>
                        <Switch 
                          checked={preferences.progress}
                          onCheckedChange={(checked) => 
                            setPreferences({...preferences, progress: checked})
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm">System Updates</p>
                          <p className="text-gray-400 text-xs">Platform news and reports</p>
                        </div>
                        <Switch 
                          checked={preferences.system}
                          onCheckedChange={(checked) => 
                            setPreferences({...preferences, system: checked})
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-3">Delivery Methods</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm">Email Notifications</p>
                          <p className="text-gray-400 text-xs">Receive notifications via email</p>
                        </div>
                        <Switch 
                          checked={preferences.email}
                          onCheckedChange={(checked) => 
                            setPreferences({...preferences, email: checked})
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm">Push Notifications</p>
                          <p className="text-gray-400 text-xs">Browser and mobile alerts</p>
                        </div>
                        <Switch 
                          checked={preferences.push}
                          onCheckedChange={(checked) => 
                            setPreferences({...preferences, push: checked})
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm">SMS Notifications</p>
                          <p className="text-gray-400 text-xs">Text message alerts</p>
                        </div>
                        <Switch 
                          checked={preferences.sms}
                          onCheckedChange={(checked) => 
                            setPreferences({...preferences, sms: checked})
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </AnimatedCard>
          </div>
        </div>
      </div>
    </div>
  );
}