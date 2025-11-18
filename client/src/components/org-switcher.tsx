import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, User, ChevronDown, Check, Plus } from "lucide-react";

interface Organization {
  id: number;
  name: string;
  logoUrl?: string | null;
  role: "owner" | "coach" | "client";
}

export function OrgSwitcher() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch user's organizations
  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ["/api/user/organizations"],
    enabled: !!user,
  });

  // Switch to different organization or individual mode
  const switchModeMutation = useMutation({
    mutationFn: async (payload: { mode: "individual" | "organization"; orgId?: number }) => {
      const response = await fetch("/api/auth/switch-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error("Failed to switch mode");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Refresh auth state
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Redirect to appropriate dashboard
      if (data.userType === "org_owner") {
        setLocation("/org-owner-dashboard");
      } else if (data.userType === "coach") {
        setLocation("/coach-org-dashboard");
      } else if (data.userType === "org_client") {
        setLocation("/org-client-dashboard");
      } else {
        setLocation("/");
      }
      
      setIsOpen(false);
    },
  });

  // Don't show switcher if user has no organizations
  if (!user || organizations.length === 0) {
    return null;
  }

  const currentMode = (user as any)?.userType === "individual" ? "individual" : "organization";
  const currentOrgId = (user as any)?.currentOrgId;
  const currentOrg = organizations.find((org: Organization) => org.id === currentOrgId);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 min-w-[200px] justify-between"
        >
          <div className="flex items-center gap-2">
            {currentMode === "individual" ? (
              <>
                <User className="h-4 w-4" />
                <span>Individual Mode</span>
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4" />
                <span className="truncate max-w-[150px]">
                  {currentOrg?.name || "Organization"}
                </span>
              </>
            )}
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[250px]">
        <DropdownMenuLabel>Switch Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Individual Mode Option */}
        <DropdownMenuItem
          onClick={() => switchModeMutation.mutate({ mode: "individual" })}
          disabled={switchModeMutation.isPending}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Individual Mode</span>
          </div>
          {currentMode === "individual" && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        
        {/* Organization Options */}
        {organizations.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organizations
            </DropdownMenuLabel>
            {organizations.map((org: Organization) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => switchModeMutation.mutate({ mode: "organization", orgId: org.id })}
                disabled={switchModeMutation.isPending}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="truncate max-w-[150px]">{org.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {org.role}
                    </span>
                  </div>
                </div>
                {currentOrgId === org.id && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        {/* Create Organization Option */}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setLocation("/create-organization")}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Organization</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default OrgSwitcher;