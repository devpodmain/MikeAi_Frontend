import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, XCircle, Clock, AlertCircle, Eye, FileText, Award, MessageSquare, User } from "lucide-react";
import { AnimatedPage } from "@/components/ui/animated-page";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AdminCoachVerifications() {
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: verifications = [], isLoading } = useQuery({
    queryKey: ['/api/coach/verifications'],
    queryFn: async () => {
      return await apiRequest("/api/coach/verifications", "GET");
    },
  });

  const updateVerificationMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes: string }) => {
      return await apiRequest(`/api/coach/verification/${id}`, "PUT", {
        verificationStatus: status,
        reviewNotes: notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coach/verifications'] });
      toast({
        title: "Verification Updated",
        description: "Coach verification status has been updated successfully.",
      });
      setSelectedVerification(null);
      setReviewNotes("");
      setNewStatus("");
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update verification status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="w-4 h-4" />;
      case "conditional": return <AlertCircle className="w-4 h-4" />;
      case "rejected": return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "text-green-600 bg-green-50";
      case "conditional": return "text-yellow-600 bg-yellow-50";
      case "rejected": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getCategoryBadge = (category: string) => {
    const isHighlyQualified = category === "highly_qualified";
    return (
      <Badge variant={isHighlyQualified ? "default" : "outline"}>
        {isHighlyQualified ? "Highly Qualified" : "Moderate Coach"}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <AnimatedPage className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coach Verifications</h1>
            <p className="text-gray-600 mt-1">Manage and review coach verification applications</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          {['pending', 'approved', 'conditional', 'rejected'].map(status => {
            const count = verifications.filter((v: any) => v.verificationStatus === status).length;
            return (
              <AnimatedCard key={status}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 capitalize">{status}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                    {getStatusIcon(status)}
                  </div>
                </CardContent>
              </AnimatedCard>
            );
          })}
        </div>

        {/* Verifications Table */}
        <AnimatedCard>
          <CardHeader>
            <CardTitle>Coach Verifications</CardTitle>
            <CardDescription>Manage and review coach verification applications</CardDescription>
          </CardHeader>
          <CardContent>
            {verifications.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Verifications Yet</h3>
                <p className="text-gray-500">Coach verification applications will appear here once submitted.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 font-semibold text-gray-700">Coach Name</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Email</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Category</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Score</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Submitted</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verifications.map((verification: any) => (
                      <tr key={verification.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-600" />
                            <span className="font-medium">{verification.fullName}</span>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-gray-600">{verification.email}</td>
                        <td className="p-3">
                          {getCategoryBadge(verification.coachCategory)}
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(verification.verificationStatus)}>
                            {getStatusIcon(verification.verificationStatus)}
                            <span className="ml-1 capitalize">{verification.verificationStatus}</span>
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className="font-medium">
                            {verification.validationReport?.score || 0}%
                          </span>
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {new Date(verification.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Coach Verification Details</DialogTitle>
                                  <DialogDescription>
                                    Complete information for {verification.fullName}
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="space-y-6">
                                  {/* Basic Information */}
                                  <div>
                                    <h4 className="font-semibold mb-3">Basic Information</h4>
                                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                                      <div><span className="font-medium">Name:</span> {verification.fullName}</div>
                                      <div><span className="font-medium">Email:</span> {verification.email}</div>
                                      <div><span className="font-medium">Phone:</span> {verification.phone}</div>
                                      <div><span className="font-medium">Category:</span> {verification.coachCategory.replace("_", " ")}</div>
                                    </div>
                                  </div>

                                  {/* Certification */}
                                  <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                      <Award className="w-4 h-4" />
                                      Certification
                                    </h4>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                      <p className="text-sm whitespace-pre-wrap">{verification.certification}</p>
                                    </div>
                                  </div>

                                  {/* Validation Report */}
                                  {verification.validationReport && (
                                    <div>
                                      <h4 className="font-semibold mb-3">Validation Report</h4>
                                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                                          <div><span className="font-medium">Score:</span> {verification.validationReport.score}%</div>
                                          <div><span className="font-medium">Status:</span> {verification.validationReport.validationStatus}</div>
                                          <div><span className="font-medium">Category:</span> {verification.validationReport.category}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedVerification(verification);
                                setNewStatus(verification.verificationStatus);
                                setReviewNotes(verification.reviewNotes || "");
                              }}
                            >
                              Review
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </AnimatedCard>

        {/* Review Dialog */}
        {selectedVerification && (
          <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Review Verification</DialogTitle>
                <DialogDescription>
                  Update the status for {selectedVerification.fullName}'s verification
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">New Status</label>
                  <Select onValueChange={setNewStatus} value={newStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="conditional">Conditional Approval</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="pending">Pending Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Review Notes</label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about your review decision..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedVerification(null);
                      setReviewNotes("");
                      setNewStatus("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedVerification && newStatus) {
                        updateVerificationMutation.mutate({
                          id: selectedVerification.id,
                          status: newStatus,
                          notes: reviewNotes,
                        });
                      }
                    }}
                    disabled={updateVerificationMutation.isPending || !newStatus}
                  >
                    {updateVerificationMutation.isPending ? "Updating..." : "Update Status"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AnimatedPage>
  );
}