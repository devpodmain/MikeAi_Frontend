import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Menu, 
  Home, 
  ChefHat, 
  Users, 
  Settings, 
  LogOut,
  BarChart3,
  User,
  MessageCircle,
  Crown,
  Building2,
  Sparkles,
  Receipt
} from "lucide-react";
import logoImage from "@assets/1_1753425387748.png";

export function Navigation() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();

  const isCoach = user?.userType === "coach";
  const isOrgOwner = user?.userType === "org_owner";
  const isOrgClient = user?.userType === "org_client";
  const isCoachInOrg = isCoach && ((user as any)?.currentOrgId || (user as any)?.organizationName);

  const navigationItems = [
    { 
      label: isOrgClient ? "Dashboard" : isOrgOwner ? "Organization" : isCoach ? "Coach Dashboard" : "Home", 
      href: isOrgClient ? "/org-client-dashboard" : isOrgOwner ? "/org-owner-dashboard" : isCoach ? "/coach-org-dashboard" : "/", 
      icon: isOrgClient ? Home : isOrgOwner ? Building2 : isCoach ? BarChart3 : Home 
    },
    { label: "Recipes", href: "/recipes", icon: ChefHat },
    // Community only for individual users, not org members
    ...(!isCoach && !isOrgOwner && !isOrgClient ? [
      { label: "Community", href: "/community", icon: Users }
    ] : []),
    // Org members (owners, coaches, clients) get Messages in header
    ...(isOrgOwner || isCoach || isOrgClient ? [
      { label: "Messages", href: "/messages", icon: MessageCircle }
    ] : []),
    // Individual users get AI Hub
    ...(!isCoach && !isOrgOwner && !isOrgClient ? [{ label: "AI Hub", href: "/ai-hub", icon: Sparkles }] : [])
  ];

  const handleNavigation = (href: string) => {
    setLocation(href);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    // Clear all query cache to ensure fresh state after logout
    queryClient.clear();
    
    // Redirect to logout endpoint
    window.location.href = "/api/logout";
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName) return "U";
    return `${firstName[0]}${lastName?.[0] || ""}`.toUpperCase();
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleNavigation(isOrgClient ? "/org-client-dashboard" : isOrgOwner ? "/org-owner-dashboard" : isCoach ? "/coach-org-dashboard" : "/")}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <img 
                  src={logoImage} 
                  alt="MikeAI Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">MikeAI</span>
                <span className="text-xs text-gray-500">Nutrition & Fitness</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                onClick={() => handleNavigation(item.href)}
                className="flex items-center space-x-2 text-gray-600 hover:text-primary hover:bg-primary/10"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || ""} />
                    <AvatarFallback className="bg-primary text-white">
                      {getInitials(user?.firstName || undefined, user?.lastName || undefined)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user?.firstName && (
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                    )}
                    {user?.email && (
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                    {(isOrgOwner || isCoach || isOrgClient) && (user as any)?.organizationName && (
                      <div className="flex items-center gap-1 mt-1">
                        <Building2 className="h-3 w-3 text-primary" />
                        <p className="w-[200px] truncate text-xs font-medium text-primary">
                          {(user as any).organizationName}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                {(isOrgClient || isCoachInOrg) && (
                  <DropdownMenuItem onClick={() => handleNavigation("/org-member-settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleNavigation("/profile-settings")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                {(isOrgClient || isCoachInOrg) && (
                  <DropdownMenuItem onClick={() => handleNavigation("/messages")}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    <span>Messages</span>
                  </DropdownMenuItem>
                )}
                {!isCoach && !isOrgOwner && !isOrgClient && (
                  <DropdownMenuItem onClick={() => handleNavigation("/ai-hub")}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span>AI Hub</span>
                  </DropdownMenuItem>
                )}
                {isOrgOwner && (
                  <DropdownMenuItem onClick={() => handleNavigation("/org-subscription")}>
                    <Crown className="mr-2 h-4 w-4" />
                    <span>Subscription</span>
                  </DropdownMenuItem>
                )}
                {!isOrgOwner && !isCoachInOrg && !isOrgClient && (
                  <>
                    <DropdownMenuItem onClick={() => handleNavigation("/subscription")}>
                      <Crown className="mr-2 h-4 w-4" />
                      <span>Subscription</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleNavigation("/purchase-history")}>
                      <Receipt className="mr-2 h-4 w-4" />
                      <span>Purchase History</span>
                    </DropdownMenuItem>
                  </>
                )}
                {!isOrgOwner && !isCoachInOrg && !isOrgClient && (
                  <DropdownMenuItem onClick={() => handleNavigation("/create-organization")}>
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>Create Organization</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col space-y-4">
                  <div className="flex items-center space-x-2 pb-4 border-b">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <img 
                          src={logoImage} 
                          alt="MikeAI Logo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xl font-bold text-gray-900">MikeAI</span>
                        <span className="text-xs text-gray-500">Nutrition & Fitness</span>
                      </div>
                    </div>
                  </div>
                  
                  {navigationItems.map((item) => (
                    <Button
                      key={item.href}
                      variant="ghost"
                      onClick={() => handleNavigation(item.href)}
                      className="justify-start space-x-2 text-gray-600 hover:text-primary hover:bg-primary/10"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Button>
                  ))}
                  
                  <div className="pt-4 border-t">
                    <Button
                      variant="ghost"
                      onClick={() => handleNavigation("/profile-settings")}
                      className="justify-start space-x-2 text-gray-600 hover:text-primary hover:bg-primary/10 w-full"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Profile Settings</span>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleNavigation("/messages")}
                      className="justify-start space-x-2 text-gray-600 hover:text-primary hover:bg-primary/10 w-full"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Messages</span>
                    </Button>
                    {!isOrgOwner && !isCoachInOrg && !isOrgClient && (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() => handleNavigation("/subscription")}
                          className="justify-start space-x-2 text-gray-600 hover:text-primary hover:bg-primary/10 w-full"
                        >
                          <Crown className="h-4 w-4" />
                          <span>Subscription</span>
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleNavigation("/purchase-history")}
                          className="justify-start space-x-2 text-gray-600 hover:text-primary hover:bg-primary/10 w-full"
                        >
                          <Receipt className="h-4 w-4" />
                          <span>Purchase History</span>
                        </Button>
                      </>
                    )}
                    {!isOrgOwner && !isCoachInOrg && !isOrgClient && (
                      <Button
                        variant="ghost"
                        onClick={() => handleNavigation("/create-organization")}
                        className="justify-start space-x-2 text-gray-600 hover:text-primary hover:bg-primary/10 w-full"
                      >
                        <Building2 className="h-4 w-4" />
                        <span>Create Organization</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="justify-start space-x-2 text-gray-600 hover:text-destructive hover:bg-destructive/10 w-full mt-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log out</span>
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navigation;
