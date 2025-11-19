import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentRoute } from "@/hooks/useCurrentRoute";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import ProfileSetup from "@/pages/profile-setup";
import ProfileSettings from "@/pages/profile-settings";
import CoachOrgDashboard from "@/pages/coach-org-dashboard";
import UserHome from "@/pages/user-home";
import Recipes from "@/pages/recipes";
import Community from "@/pages/community";
import ClientManagement from "@/pages/client-management";
import AuthLogin from "@/pages/auth-login";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminCoachVerifications from "@/pages/admin-coach-verifications";
import Subscription from "@/pages/subscription";
import SubscriptionSuccess from "@/pages/subscription-success";
import OrgSubscription from "@/pages/org-subscription";
import OrgSubscriptionSuccess from "@/pages/org-subscription-success";
import Messages from "@/pages/messages";
import TermsAndDisclaimer from "@/pages/terms-and-disclaimer";
import MockLogin from "@/pages/mock-login";
import LandingWithLogin from "@/pages/landing-with-login";
import MobileApp from "@/pages/mobile-app";
import CreatePlan from "@/pages/create-plan";
import Analytics from "@/pages/analytics";
import CalendarView from "@/pages/calendar";
import Notifications from "@/pages/notifications";
import SettingsPage from "@/pages/settings";
import MealPlanDashboard from "@/pages/MealPlanDashboard";
import WorkoutsPage from "@/pages/workouts";
import TrackWorkout from "@/pages/track-workout";
import OrgOwnerDashboard from "@/pages/org-owner-dashboard";
import OrgClientDashboard from "@/pages/org-client-dashboard";
import OrgMessages from "@/pages/org-messages";
import CreateOrganization from "@/pages/create-organization";
import OrgMemberLogin from "@/pages/org-member-login";
import OrgMemberSettings from "@/pages/org-member-settings";
import OrgOwnerSettings from "@/pages/org-owner-settings";
import OrgTrackWorkout from "@/pages/org-track-workout";
import OrgTrackMeals from "@/pages/org-track-meals";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import FitnessGPT from "@/pages/fitness-gpt";
import SupplementsSuggest from "@/pages/supplements-suggest";
import AIHub from "@/pages/ai-hub";
import PurchaseHistory from "@/pages/purchase-history";

// ProtectedRoute component to enforce user type-based access control
interface ProtectedRouteProps {
  component: React.ComponentType;
  allowedUserTypes?: string[];
  requiresOrgMembership?: boolean;
}



function ProtectedRoute({ component: Component, allowedUserTypes, requiresOrgMembership }: ProtectedRouteProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();  
  const userType = (user as any)?.userType || 'individual';
  const currentOrgId = (user as any)?.currentOrgId;
  
  // Check if user type is allowed
  if (allowedUserTypes && !allowedUserTypes.includes(userType)) {
    // Redirect to appropriate dashboard based on user type
    switch (userType) {
      case 'org_owner':
        setLocation('/org-owner-dashboard');
        break;
      case 'org_client':
        setLocation('/org-client-dashboard');
        break;
      case 'coach':
        setLocation('/coach-org-dashboard');
        break;
      default:
        setLocation('/user-home');
    }
    return null;
  }
  
  // Check if user needs to be in an organization
  if (requiresOrgMembership && !currentOrgId) {
    setLocation('/user-home');
    return null;
  }
  
  return <Component />;
}

function Router() {
  const { isAuthenticated, isLoading, user, error } = useAuth();
  const currentRoute = useCurrentRoute();

  // Show loading only for the initial request, not for 401 errors
  if (isLoading && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Debug logging
  console.log('Auth state:', { isAuthenticated, isLoading, error: error?.message });
  console.log('User data:', user);
  console.log('User type:', (user as any)?.userType);
  console.log('Will show:', (user as any)?.userType === 'org_client' ? 'OrgClientDashboard' :
    (user as any)?.userType === 'org_owner' ? 'OrgOwnerDashboard' : 
    (user as any)?.userType === 'coach' ? 'CoachOrgDashboard'
      : 'UserHome');

  return (
    <>
      <Switch>
        {/* Admin routes - accessible regardless of regular user authentication */}
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/coach-verifications" component={AdminCoachVerifications} />
        
        {/* Organization member login - accessible to everyone */}
        <Route path="/org-member-login" component={OrgMemberLogin} />
        
        {isAuthenticated ? (
          <>
            {/* Different home pages based on user type */}
            <Route path="/" component={
              (user as any)?.userType === 'org_client' ? OrgClientDashboard :
              (user as any)?.userType === 'org_owner' ? OrgOwnerDashboard :
              (user as any)?.userType === 'coach' ? CoachOrgDashboard
                : UserHome
            } />
            <Route path="/profile-setup" component={ProfileSetup} />
            <Route path="/profile-settings" component={ProfileSettings} />
            <Route path="/user-home" component={UserHome} />
            <Route path="/coach-org-dashboard">
              <ProtectedRoute component={CoachOrgDashboard} allowedUserTypes={['coach']} requiresOrgMembership={true} />
            </Route>
            <Route path="/org-owner-dashboard">
              <ProtectedRoute component={OrgOwnerDashboard} allowedUserTypes={['org_owner']} />
            </Route>
            <Route path="/org-client-dashboard">
              <ProtectedRoute component={OrgClientDashboard} allowedUserTypes={['org_client']} />
            </Route>
            <Route path="/recipes" component={Recipes} />
            <Route path="/community" component={Community} />
            <Route path="/client-management" component={ClientManagement} />
            <Route path="/messages" component={Messages} />
            <Route path="/org-messages">
              <ProtectedRoute component={OrgMessages} requiresOrgMembership={true} />
            </Route>
            <Route path="/subscription" component={Subscription} />
            <Route path="/subscription-success" component={SubscriptionSuccess} />
            <Route path="/org-subscription">
              <ProtectedRoute component={OrgSubscription} allowedUserTypes={['org_owner']} />
            </Route>
            <Route path="/org-subscription-success" component={OrgSubscriptionSuccess} />
            <Route path="/org/subscription-success" component={OrgSubscriptionSuccess} />
            <Route path="/purchase-history" component={PurchaseHistory} />
            <Route path="/terms" component={TermsAndDisclaimer} />
            <Route path="/mobile" component={MobileApp} />
            <Route path="/create-plan" component={CreatePlan} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/calendar" component={CalendarView} />
            <Route path="/notifications" component={Notifications} />
            <Route path="/settings" component={SettingsPage} />
            <Route path="/meal-plan" component={MealPlanDashboard} />
            <Route path="/workouts" component={WorkoutsPage} />
            <Route path="/track-workout">
              <ProtectedRoute component={TrackWorkout} allowedUserTypes={['individual']} />
            </Route>
            <Route path="/create-organization" component={CreateOrganization} />
            <Route path="/org-member-settings">
              <ProtectedRoute component={OrgMemberSettings} allowedUserTypes={['coach', 'org_client']} />
            </Route>
            <Route path="/org-owner-settings">
              <ProtectedRoute component={OrgOwnerSettings} allowedUserTypes={['org_owner']} />
            </Route>
            <Route path="/org-track-workout">
              <ProtectedRoute component={OrgTrackWorkout} allowedUserTypes={['org_client', 'coach']} requiresOrgMembership={true} />
            </Route>
            <Route path="/org-track-meals">
              <ProtectedRoute component={OrgTrackMeals} allowedUserTypes={['org_client', 'coach']} requiresOrgMembership={true} />
            </Route>
            <Route path="/fitness-gpt">
              <ProtectedRoute component={FitnessGPT} allowedUserTypes={['individual']} />
            </Route>
            <Route path="/supplements-suggest">
              <ProtectedRoute component={SupplementsSuggest} allowedUserTypes={['individual']} />
            </Route>
            <Route path="/ai-hub">
              <ProtectedRoute component={AIHub} allowedUserTypes={['individual']} />
            </Route>
          </>
        ) : (
          <>
            <Route path="/" component={Landing} />
            <Route path="/login" component={MockLogin} />
            <Route path="/landing" component={Landing} />
            <Route path="/landing-old" component={LandingWithLogin} />
            <Route path="/recipes" component={Recipes} />
            <Route path="/auth/login" component={AuthLogin} />
            <Route path="/signin" component={AuthLogin} />
            <Route path="/forgot-password" component={ForgotPassword} />
            <Route path="/reset-password" component={ResetPassword} />
            <Route path="/subscription" component={Subscription} />
            <Route path="/terms" component={TermsAndDisclaimer} />
            <Route path="/mobile" component={MobileApp} />
            <Route path="/workouts" component={WorkoutsPage} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
