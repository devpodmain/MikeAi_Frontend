import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, 
  User, 
  Utensils, 
  Users, 
  MessageCircle, 
  Settings,
  Menu,
  Bell,
  Heart,
  TrendingUp,
  Calendar,
  Search,
  Plus,
  LogOut,
  Crown
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import logoImage from "@assets/1_1753425387748.png";

export function MobileNavigation() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    queryClient.clear();
    window.location.href = "/api/logout";
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName) return "U";
    return `${firstName[0]}${lastName?.[0] || ""}`.toUpperCase();
  };

  const navItems = [
    { href: "/", icon: Home, label: "Dashboard", badge: null },
    { href: "/recipes", icon: Utensils, label: "Recipes", badge: null },
    { href: "/community", icon: Users, label: "Community", badge: "3" },
    { href: "/messages", icon: MessageCircle, label: "Messages", badge: "2" },
    { href: "/profile-setup", icon: Settings, label: "Settings", badge: null },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16">
        <div className="flex items-center justify-between px-4 h-full">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img 
                src={logoImage} 
                alt="MikeAI Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-lg font-bold text-gray-900">MikeAI</span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-red-500">
                3
              </Badge>
            </Button>
            
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <div className="flex flex-col h-full">
                  {/* Profile Section */}
                  <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12 border-2 border-white/20">
                        <AvatarImage src={(user as any)?.profileImageUrl || ""} />
                        <AvatarFallback className="bg-white/20 text-white">
                          {getInitials((user as any)?.firstName, (user as any)?.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {(user as any)?.firstName} {(user as any)?.lastName}
                        </h3>
                        <p className="text-sm opacity-90">{(user as any)?.email}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {user?.userType === "org_owner" ? "Org Owner" : user?.userType === "coach" ? "Coach" : user?.userType === "org_client" ? "Client" : "Individual"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Items */}
                  <nav className="flex-1 p-4">
                    <div className="space-y-2">
                      {navItems.map((item) => (
                        <Link key={item.href} href={item.href}>
                          <Button
                            variant={location === item.href ? "default" : "ghost"}
                            className="w-full justify-start h-12 text-left"
                            onClick={() => setIsOpen(false)}
                          >
                            <item.icon className="w-5 h-5 mr-3" />
                            <span className="flex-1">{item.label}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </Button>
                        </Link>
                      ))}
                    </div>
                    
                    {/* Profile Section */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="space-y-2">
                        <Link href="/profile-settings">
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-12 text-left"
                            onClick={() => setIsOpen(false)}
                          >
                            <Settings className="w-5 h-5 mr-3" />
                            <span className="flex-1">Profile Settings</span>
                          </Button>
                        </Link>
                        
                        <Link href="/messages">
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-12 text-left"
                            onClick={() => setIsOpen(false)}
                          >
                            <MessageCircle className="w-5 h-5 mr-3" />
                            <span className="flex-1">Messages</span>
                            <Badge variant="secondary" className="text-xs">3</Badge>
                          </Button>
                        </Link>
                        
                        <Link href="/subscription">
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-12 text-left"
                            onClick={() => setIsOpen(false)}
                          >
                            <Crown className="w-5 h-5 mr-3" />
                            <span className="flex-1">Subscription</span>
                            <Badge variant="outline" className="text-xs">Pro</Badge>
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-500 mb-3">Quick Actions</h4>
                      <div className="space-y-2">
                        <Button variant="ghost" className="w-full justify-start h-10">
                          <Plus className="w-4 h-4 mr-3" />
                          Add Meal
                        </Button>
                        <Button variant="ghost" className="w-full justify-start h-10">
                          <Search className="w-4 h-4 mr-3" />
                          Find Recipe
                        </Button>
                        <Button variant="ghost" className="w-full justify-start h-10">
                          <TrendingUp className="w-4 h-4 mr-3" />
                          View Progress
                        </Button>
                      </div>
                    </div>
                  </nav>

                  {/* Bottom Actions */}
                  <div className="p-4 border-t border-gray-200">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 h-16">
        <div className="flex items-center justify-around h-full px-2">
          {navItems.slice(0, 4).map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center space-y-1 h-12 w-16 relative ${
                  location === item.href ? "text-blue-600" : "text-gray-500"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
                {item.badge && (
                  <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center text-xs bg-red-500">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            </Link>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center space-y-1 h-12 w-16 text-gray-500"
            onClick={() => setIsOpen(true)}
          >
            <Menu className="w-5 h-5" />
            <span className="text-xs">More</span>
          </Button>
        </div>
      </nav>

      {/* Spacer for fixed navigation */}
      <div className="lg:hidden h-16" />
      <div className="lg:hidden h-16" />
    </>
  );
}