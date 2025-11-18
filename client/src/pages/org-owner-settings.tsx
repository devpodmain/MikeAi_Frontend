import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Lock, User, Mail, Building2, RefreshCw, Copy, Check, ArrowLeft, Trash2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";

const personalPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const commonPasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  sendNotifications: z.boolean().default(false),
});

type PersonalPasswordFormData = z.infer<typeof personalPasswordSchema>;
type CommonPasswordFormData = z.infer<typeof commonPasswordSchema>;

export default function OrgOwnerSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showPersonalPasswordForm, setShowPersonalPasswordForm] = useState(false);
  const [showCommonPasswordForm, setShowCommonPasswordForm] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [pendingCommonPassword, setPendingCommonPassword] = useState<CommonPasswordFormData | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const personalForm = useForm<PersonalPasswordFormData>({
    resolver: zodResolver(personalPasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const commonForm = useForm<CommonPasswordFormData>({
    resolver: zodResolver(commonPasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      sendNotifications: false,
    },
  });

  // Fetch organization members for notification selection
  const { data: membersData, isLoading: membersLoading, isError: membersError } = useQuery<any>({
    queryKey: [`/api/organizations/${user?.organizationId}/members`],
    enabled: !!user?.organizationId && notificationModalOpen,
  });
  
  // Normalize members to always be an array to prevent .map/.filter crashes
  // Backend returns { success: true, members: [...] }
  const members = Array.isArray(membersData?.members) ? membersData.members : [];

  // Fetch organization details
  const { data: orgData } = useQuery<any>({
    queryKey: [`/api/organizations/${user?.organizationId}`],
    enabled: !!user?.organizationId,
  });

  const changePersonalPasswordMutation = useMutation({
    mutationFn: async (data: PersonalPasswordFormData) => {
      return await apiRequest("/api/auth/change-password", "POST", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      toast({
        title: "Personal password updated",
        description: "Your password has been changed successfully",
      });
      personalForm.reset();
      setShowPersonalPasswordForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update password",
        description: error.message || "Please check your current password",
        variant: "destructive",
      });
    },
  });

  const setCommonPasswordMutation = useMutation({
    mutationFn: async (data: { password: string; members: number[]; currentPassword?: string }) => {
      return await apiRequest(`/api/organizations/${user?.organizationId}/set-common-password`, "POST", {
        currentPassword: data.currentPassword,
        newPassword: data.password,
        sendNotifications: data.members.length > 0,
        notifyMembers: data.members,
      });
    },
    onSuccess: () => {
      toast({
        title: "Organization password updated",
        description: selectedMembers.length > 0 
          ? "Password updated and notifications sent" 
          : "Password updated successfully",
      });
      commonForm.reset();
      setShowCommonPasswordForm(false);
      setNotificationModalOpen(false);
      setPendingCommonPassword(null);
      setSelectedMembers([]);
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${user?.organizationId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update organization password",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const generatePasswordMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/organizations/${user?.organizationId}/generate-common-password`, "POST", {});
    },
    onSuccess: (data: any) => {
      setGeneratedPassword(data.password);
      toast({
        title: "Random password generated",
        description: "Copy the password and save it securely",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${user?.organizationId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to generate password",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied to clipboard",
      description: "Password has been copied",
    });
  };

  const onPersonalPasswordSubmit = (data: PersonalPasswordFormData) => {
    changePersonalPasswordMutation.mutate(data);
  };

  const onCommonPasswordSubmit = (data: CommonPasswordFormData) => {
    if (data.sendNotifications) {
      setPendingCommonPassword(data);
      setNotificationModalOpen(true);
    } else {
      setCommonPasswordMutation.mutate({ 
        password: data.newPassword, 
        members: [], 
        currentPassword: data.currentPassword 
      });
    }
  };

  const handleSendNotifications = () => {
    if (pendingCommonPassword) {
      setCommonPasswordMutation.mutate({ 
        password: pendingCommonPassword.newPassword, 
        members: selectedMembers,
        currentPassword: pendingCommonPassword.currentPassword
      });
    }
  };

  const toggleMemberSelection = (memberId: number) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectAll = () => {
    if (Array.isArray(members)) {
      setSelectedMembers(members.map((m: any) => m.id));
    }
  };

  const deselectAll = () => {
    setSelectedMembers([]);
  };

  const selectAllCoaches = () => {
    if (Array.isArray(members)) {
      const coachIds = members.filter((m: any) => m.role === 'coach').map((m: any) => m.id);
      setSelectedMembers(prev => {
        const uniqueIds = new Set([...prev, ...coachIds]);
        return Array.from(uniqueIds);
      });
    }
  };

  const selectAllClients = () => {
    if (Array.isArray(members)) {
      const clientIds = members.filter((m: any) => m.role === 'client').map((m: any) => m.id);
      setSelectedMembers(prev => {
        const uniqueIds = new Set([...prev, ...clientIds]);
        return Array.from(uniqueIds);
      });
    }
  };

  const deleteOrganizationMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/organizations/${user?.organizationId}/delete-and-convert`, "POST", {});
    },
    onSuccess: () => {
      toast({
        title: "Organization deleted",
        description: "Your organization has been deleted and you've been converted to an individual account",
      });
      queryClient.clear();
      // Redirect to individual dashboard
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete organization",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const handleDeleteOrganization = () => {
    if (deleteConfirmText.toLowerCase() === "delete organization") {
      deleteOrganizationMutation.mutate();
      setDeleteConfirmOpen(false);
      setDeleteConfirmText("");
    } else {
      toast({
        title: "Incorrect confirmation",
        description: "Please type 'delete organization' to confirm",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  const hasCommonPassword = orgData?.organization?.hasCommonPassword;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/org-owner-dashboard">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900" data-testid="button-back-org-owner-dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account and organization security</p>
        </div>

        {/* Account Information */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900 mt-1">{user.firstName} {user.lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <p className="text-gray-900 mt-1">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Organization
                </label>
                <p className="text-gray-900 mt-1">{user.organizationName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <Badge className="mt-1 bg-amber-500 hover:bg-amber-600">
                  Organization Owner
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Password Settings */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Lock className="h-5 w-5" />
              Personal Password
            </CardTitle>
            <CardDescription className="text-gray-600">
              Change your personal login password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showPersonalPasswordForm ? (
              <Button 
                onClick={() => setShowPersonalPasswordForm(true)}
                className="bg-amber-500 hover:bg-amber-600"
                data-testid="button-change-personal-password"
              >
                Change Personal Password
              </Button>
            ) : (
              <Form {...personalForm}>
                <form onSubmit={personalForm.handleSubmit(onPersonalPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={personalForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Current Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            className="bg-white border-gray-200"
                            data-testid="input-current-personal-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={personalForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">New Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            className="bg-white border-gray-200"
                            data-testid="input-new-personal-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={personalForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Confirm New Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            className="bg-white border-gray-200"
                            data-testid="input-confirm-personal-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={changePersonalPasswordMutation.isPending}
                      className="bg-amber-500 hover:bg-amber-600"
                      data-testid="button-save-personal-password"
                    >
                      {changePersonalPasswordMutation.isPending ? "Saving..." : "Save Password"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowPersonalPasswordForm(false);
                        personalForm.reset();
                      }}
                      className="border-gray-200"
                      data-testid="button-cancel-personal"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Organization Common Password */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Building2 className="h-5 w-5" />
              Organization Common Password
            </CardTitle>
            <CardDescription className="text-gray-600">
              {hasCommonPassword 
                ? "Shared password used by all organization members. Required before adding members." 
                : "Set a common password before adding coaches or clients to your organization."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Generate Random Password */}
            <div className="space-y-3">
              <div className="flex gap-2 items-center">
                <Button
                  type="button"
                  onClick={() => generatePasswordMutation.mutate()}
                  disabled={generatePasswordMutation.isPending}
                  variant="outline"
                  className="border-gray-200"
                  data-testid="button-generate-password"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${generatePasswordMutation.isPending ? 'animate-spin' : ''}`} />
                  Generate Random Password
                </Button>
                {generatedPassword && (
                  <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-md border border-gray-200">
                    <code className="text-sm font-mono">{generatedPassword}</code>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(generatedPassword)}
                      data-testid="button-copy-generated"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-md">
                <strong>⚠️ Important:</strong> Clicking "Generate Random Password" will <strong>immediately change</strong> your organization's common password in the database. Make sure to copy the generated password and share it with your members, as they will need it to login. Use this feature when you've forgotten the current password and need to reset it.
              </p>
            </div>

            {/* Set/Change Common Password Form */}
            {!showCommonPasswordForm ? (
              <Button 
                onClick={() => setShowCommonPasswordForm(true)}
                className="bg-amber-500 hover:bg-amber-600"
                data-testid="button-set-common-password"
              >
                {hasCommonPassword ? "Change Common Password" : "Set Common Password"}
              </Button>
            ) : (
              <Form {...commonForm}>
                <form onSubmit={commonForm.handleSubmit(onCommonPasswordSubmit)} className="space-y-4">
                  {hasCommonPassword && (
                    <FormField
                      control={commonForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Current Common Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              className="bg-white border-gray-200"
                              data-testid="input-current-common-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={commonForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">New Common Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter password or use generated one"
                            className="bg-white border-gray-200"
                            data-testid="input-new-common-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={commonForm.control}
                    name="sendNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-send-notifications"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-gray-700">
                            Send email notifications to members
                          </FormLabel>
                          <p className="text-sm text-gray-500">
                            Notify coaches and clients about the password change
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={setCommonPasswordMutation.isPending}
                      className="bg-amber-500 hover:bg-amber-600"
                      data-testid="button-save-common-password"
                    >
                      {setCommonPasswordMutation.isPending ? "Saving..." : "Save Password"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCommonPasswordForm(false);
                        commonForm.reset();
                      }}
                      className="border-gray-200"
                      data-testid="button-cancel-common"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-white border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription className="text-gray-600">
              Permanently delete your organization and convert back to individual account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 mb-2">
                <strong>Warning:</strong> This action cannot be undone. Deleting your organization will:
              </p>
              <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                <li>Deactivate the organization permanently</li>
                <li>Convert your account to an individual user</li>
                <li>Coaches and clients will lose access to the organization</li>
                <li>All subscription and billing data will be preserved but inactive</li>
              </ul>
            </div>
            <Button
              variant="destructive"
              onClick={() => setDeleteConfirmOpen(true)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-delete-organization"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Organization
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Organization?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please type "delete organization" to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type 'delete organization'"
              className="border-gray-200"
              data-testid="input-delete-confirm"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDeleteConfirmText("");
              }}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOrganization}
              disabled={deleteOrganizationMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {deleteOrganizationMutation.isPending ? "Deleting..." : "Delete Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Member Selection Modal */}
      <Dialog open={notificationModalOpen} onOpenChange={setNotificationModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Members to Notify</DialogTitle>
            <DialogDescription>
              Choose which coaches and clients should receive the new password via email
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={selectAll}
                  disabled={membersLoading || membersError || members.length === 0}
                  data-testid="button-select-all"
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={deselectAll}
                  disabled={membersLoading || membersError || selectedMembers.length === 0}
                  data-testid="button-deselect-all"
                >
                  Deselect All
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={selectAllCoaches}
                  disabled={membersLoading || membersError || members.filter((m: any) => m.role === 'coach').length === 0}
                  data-testid="button-select-all-coaches"
                  className="text-xs"
                >
                  Select All Coaches
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={selectAllClients}
                  disabled={membersLoading || membersError || members.filter((m: any) => m.role === 'client').length === 0}
                  data-testid="button-select-all-clients"
                  className="text-xs"
                >
                  Select All Clients
                </Button>
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-4">
              {membersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading members...</span>
                </div>
              ) : membersError ? (
                <div className="flex items-center justify-center py-8 text-destructive">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <span className="text-sm">Failed to load members. Please try again.</span>
                </div>
              ) : members.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <span className="text-sm">No members found in this organization.</span>
                </div>
              ) : (
                <>
                  {/* Coaches Section */}
                  {members.filter((m: any) => m.role === 'coach').length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <h4 className="text-sm font-semibold">Coaches</h4>
                        <Badge variant="secondary" className="text-xs">
                          {members.filter((m: any) => m.role === 'coach').length}
                        </Badge>
                      </div>
                      {members
                        .filter((m: any) => m.role === 'coach')
                        .map((member: any) => (
                          <div key={member.id} className="flex items-center space-x-2 pl-2">
                            <Checkbox
                              checked={selectedMembers.includes(member.id)}
                              onCheckedChange={() => toggleMemberSelection(member.id)}
                              data-testid={`checkbox-member-${member.id}`}
                            />
                            <label className="text-sm flex-1 cursor-pointer">
                              {member.firstName || 'Unnamed'} {member.lastName || ''} 
                              <span className="text-muted-foreground ml-1">({member.email})</span>
                            </label>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Clients Section */}
                  {members.filter((m: any) => m.role === 'client').length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <h4 className="text-sm font-semibold">Clients</h4>
                        <Badge variant="secondary" className="text-xs">
                          {members.filter((m: any) => m.role === 'client').length}
                        </Badge>
                      </div>
                      {members
                        .filter((m: any) => m.role === 'client')
                        .map((member: any) => (
                          <div key={member.id} className="flex items-center space-x-2 pl-2">
                            <Checkbox
                              checked={selectedMembers.includes(member.id)}
                              onCheckedChange={() => toggleMemberSelection(member.id)}
                              data-testid={`checkbox-member-${member.id}`}
                            />
                            <label className="text-sm flex-1 cursor-pointer">
                              {member.firstName || 'Unnamed'} {member.lastName || ''} 
                              <span className="text-muted-foreground ml-1">({member.email})</span>
                            </label>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNotificationModalOpen(false);
                setPendingCommonPassword(null);
                setSelectedMembers([]);
              }}
              data-testid="button-cancel-notifications"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendNotifications}
              disabled={setCommonPasswordMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600"
              data-testid="button-send-notifications"
            >
              {setCommonPasswordMutation.isPending ? "Sending..." : `Send to ${selectedMembers.length} members`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
