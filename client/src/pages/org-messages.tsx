import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/navigation";
import { OrgMessaging } from "@/components/org-messaging";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, AlertCircle } from "lucide-react";

export default function OrgMessages() {
  const { user, isLoading } = useAuth();

  // Determine user type - support both org users and regular users
  const getUserType = () => {
    const userType = (user as any)?.userType;
    
    if (userType === 'org_owner' || userType === 'org_client' || userType === 'coach') {
      return userType;
    }
    
    // For regular individual users who might have coach status
    if ((user as any)?.isCoach) {
      return 'coach';
    }
    
    // Default to org_client for safety (most restricted permissions)
    return 'org_client';
  };

  // Get organization ID from user context
  const getOrgId = () => {
    const userData = user as any;
    return userData?.currentOrgId || userData?.organizationId || userData?.orgId;
  };

  const userType = getUserType();
  const orgId = getOrgId();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="h-[calc(100vh-12rem)]">
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <div className="flex h-full">
                  {/* Skeleton for sidebar */}
                  <div className="w-80 border-r p-4 space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-32" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                  {/* Skeleton for main content */}
                  <div className="flex-1 p-4 space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-20 w-96" />
                        </div>
                      </div>
                      <div className="flex gap-3 justify-end">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-20 w-96" />
                        </div>
                        <Skeleton className="h-10 w-10 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto mt-20">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-gray-600">Please log in to access messages.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Check if user is part of an organization
  if (!orgId && userType !== 'individual') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto mt-20">
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Organization Found</h2>
              <p className="text-gray-600">
                You need to be part of an organization to access messages.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // For individual users not in an organization, show a different message
  if (userType === 'individual' || !orgId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto mt-20">
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-3">Organization Messaging</h2>
              <p className="text-gray-600 mb-6">
                This messaging feature is available for organization members only.
              </p>
              <div className="bg-blue-50 rounded-lg p-4 text-left">
                <h3 className="font-medium mb-2">What is Organization Messaging?</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Connect with coaches and other organization members</li>
                  <li>• Receive important announcements and updates</li>
                  <li>• Get personalized support from your assigned coach</li>
                  <li>• Share progress and ask questions in a secure environment</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-2">
            {userType === 'org_owner' 
              ? "Manage organization communications and announcements" 
              : userType === 'coach'
              ? "Connect with your clients and view organization updates"
              : "Stay connected with your coach and organization"}
          </p>
        </div>
        
        <div className="h-[calc(100vh-12rem)]">
          <Card className="h-full shadow-xl border-0 overflow-hidden">
            <CardContent className="p-0 h-full">
              <OrgMessaging 
                userType={userType as 'org_owner' | 'coach' | 'org_client'}
                orgId={orgId}
                embedded={false}
                className="h-full"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}