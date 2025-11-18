import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Navigation from "@/components/navigation";
import CommentSection from "@/components/comment-section";
import { 
  Heart, 
  Plus, 
  Users, 
  Medal,
  Loader2,
  MessageCircle,
  Trophy
} from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  userId: number;
  firstName: string | null;
  lastName: string | null;
  weeklyPoints: number;
  tier: string;
}

interface MyRank {
  rank: number;
  points: {
    weeklyPoints: number;
  };
}

interface PastWinner {
  userId: number;
  firstName: string | null;
  lastName: string | null;
  weeklyPoints: number;
  weekStartDate: string;
  weekEndDate: string;
}

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newPostContent, setNewPostContent] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());

  // Infinite query for posts with pagination
  const {
    data: postsData,
    isLoading: postsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["/api/community/posts"],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/community/posts?limit=20&offset=${pageParam}`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      // If last page has 20 posts, there might be more
      if (lastPage.length === 20) {
        return allPages.length * 20;
      }
      return undefined;
    },
    initialPageParam: 0,
    retry: false,
  });

  // Flatten all posts from all pages
  const posts = postsData?.pages.flatMap(page => page) ?? [];

  const { data: leaderboardData = [], isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
    retry: false,
  });

  const { data: myRank } = useQuery<MyRank>({
    queryKey: ["/api/points/my-rank"],
    retry: false,
  });

  const { data: pastWinnersData = [], isLoading: pastWinnersLoading } = useQuery<PastWinner[]>({
    queryKey: ["/api/leaderboard/history"],
    retry: false,
  });

  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("/api/community/posts", "POST", { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points/my-rank"] });
      setNewPostContent("");
      setIsShareModalOpen(false);
      toast({
        title: "Post shared! 🎉",
        description: "You earned 10 points for community engagement!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error sharing post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (postId: number) => {
      return await apiRequest(`/api/community/posts/${postId}/like`, "POST", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
    },
  });

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    createPostMutation.mutate(newPostContent);
  };

  const handleToggleLike = (postId: number) => {
    toggleLikeMutation.mutate(postId);
  };

  const toggleComments = (postId: number) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'gold':
        return <span className="text-xl">🥇</span>;
      case 'silver':
        return <span className="text-xl">🥈</span>;
      case 'bronze':
        return <span className="text-xl">🥉</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Community & Support</h1>
          <p className="text-gray-600">
            Connect with like-minded individuals, share your progress, and stay motivated together
          </p>
        </div>

        {/* User Stats Header */}
        {myRank && myRank.points && (
          <Card className="mb-6 bg-gradient-to-r from-primary/10 to-accent/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{myRank.points.weeklyPoints || 0}</div>
                    <div className="text-sm text-gray-600">Weekly Points</div>
                  </div>
                  <div className="h-12 w-px bg-gray-300" />
                  <div className="text-center">
                    <div className="text-3xl font-bold text-accent">#{myRank.rank || '-'}</div>
                    <div className="text-sm text-gray-600">Your Rank</div>
                  </div>
                  <div className="h-12 w-px bg-gray-300" />
                  <div className="text-center flex items-center space-x-2">
                    <div className="text-2xl">
                      {myRank.points.weeklyPoints >= 1000 ? '🥇' : myRank.points.weeklyPoints >= 500 ? '🥈' : '🥉'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">
                        {myRank.points.weeklyPoints >= 1000 ? 'Gold' : myRank.points.weeklyPoints >= 500 ? 'Silver' : 'Bronze'} Tier
                      </div>
                      <div className="text-xs text-gray-600">
                        {myRank.points.weeklyPoints >= 1000 ? 'Elite Status!' : 
                         myRank.points.weeklyPoints >= 500 ? `${1000 - myRank.points.weeklyPoints} to Gold` :
                         `${500 - myRank.points.weeklyPoints} to Silver`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Community Feed */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Community Feed
                  </CardTitle>
                  <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary text-white hover:bg-primary/90" data-testid="button-share-progress">
                        <Plus className="mr-2 h-4 w-4" />
                        Share Progress
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Share Your Progress</DialogTitle>
                        <DialogDescription>
                          Share your fitness and nutrition achievements with the community.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="What's your nutrition win today?"
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                          rows={4}
                          data-testid="input-post-content"
                        />
                        <Button
                          onClick={handleCreatePost}
                          disabled={createPostMutation.isPending}
                          className="w-full bg-primary text-white hover:bg-primary/90"
                          data-testid="button-submit-post"
                        >
                          {createPostMutation.isPending ? "Sharing..." : "Share Post"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-[600px] overflow-y-auto space-y-6" data-testid="feed-container">
                  {postsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                      <p className="text-gray-600 mt-2">Loading posts...</p>
                    </div>
                  ) : !posts || posts.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">No posts yet</h3>
                      <p className="text-gray-600 mb-4">Be the first to share your progress!</p>
                    </div>
                  ) : (
                    <>
                      {posts.map((post: any) => (
                        <div key={post.id} className="border-b border-gray-100 pb-6 last:border-b-0" data-testid={`post-${post.id}`}>
                          <div className="flex items-center space-x-3 mb-4">
                            <Avatar>
                              <AvatarImage src={post.user?.profileImageUrl || ""} />
                              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white">
                                {getInitials(`${post.user?.firstName || 'User'} ${post.user?.lastName || ''}`)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold text-gray-800" data-testid={`text-post-author-${post.id}`}>
                                {post.user?.firstName || 'User'} {post.user?.lastName || ''}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {new Date(post.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-gray-700 mb-4" data-testid={`text-post-content-${post.id}`}>{post.content}</p>
                          
                          {post.imageUrl && (
                            <img 
                              src={post.imageUrl} 
                              alt="Post image" 
                              className="w-full h-48 object-cover rounded-lg mb-4"
                            />
                          )}
                          
                          {post.stats && (
                            <div className="bg-gradient-to-br from-accent/10 to-primary/10 p-4 rounded-lg mb-4">
                              <div className="flex items-center justify-between">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-accent">{post.stats.streak}</div>
                                  <div className="text-sm text-gray-600">Day Streak</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-primary">{post.stats.adherence}%</div>
                                  <div className="text-sm text-gray-600">Adherence</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-success">{post.stats.weightLoss}</div>
                                  <div className="text-sm text-gray-600">Pounds Lost</div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleLike(post.id)}
                                className="flex items-center space-x-2 text-gray-600 hover:text-primary"
                                data-testid={`button-like-post-${post.id}`}
                              >
                                <Heart className="h-4 w-4" />
                                <span data-testid={`text-likes-count-${post.id}`}>{post.likes}</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleComments(post.id)}
                                className="flex items-center space-x-2 text-gray-600 hover:text-primary"
                                data-testid={`button-view-comments-${post.id}`}
                              >
                                <MessageCircle className="h-4 w-4" />
                                <span>{post.comments || 0}</span>
                              </Button>
                            </div>
                            <div className="flex items-center space-x-2">
                              {post.tags && post.tags.map((tag: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <CommentSection 
                            postId={post.id} 
                            isExpanded={expandedComments.has(post.id)} 
                          />
                        </div>
                      ))}
                      
                      {/* Load More Button */}
                      {hasNextPage && (
                        <div className="text-center pt-4">
                          <Button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            variant="outline"
                            className="w-full"
                            data-testid="button-load-more-posts"
                          >
                            {isFetchingNextPage ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading more...
                              </>
                            ) : (
                              'Load More Posts'
                            )}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Medal className="mr-2 h-5 w-5" />
                  Leaderboard
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">This Week's Leaderboard</p>
              </CardHeader>
              <CardContent>
                {leaderboardLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="text-gray-600 text-sm mt-2">Loading leaderboard...</p>
                  </div>
                ) : leaderboardData.length === 0 ? (
                  <div className="text-center py-4">
                    <Medal className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">No rankings yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboardData.map((entry) => (
                      <div 
                        key={entry.userId} 
                        className="flex items-center space-x-3"
                        data-testid={`leaderboard-entry-${entry.rank}`}
                      >
                        <div className={`font-bold text-lg min-w-[24px] ${
                          entry.rank === 1 ? 'text-yellow-500' : 
                          entry.rank === 2 ? 'text-gray-400' :
                          entry.rank === 3 ? 'text-orange-600' :
                          'text-gray-600'
                        }`}>
                          {entry.rank}
                        </div>
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className={`text-xs ${
                            entry.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                            entry.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                            entry.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                            'bg-gradient-to-br from-primary to-primary/80'
                          } text-white`}>
                            {getInitials(`${entry.firstName || 'U'} ${entry.lastName || ''}`)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800 text-sm">
                            {entry.firstName || 'User'} {entry.lastName || ''}
                          </div>
                          <div className="text-xs text-gray-600">
                            {entry.weeklyPoints} points
                          </div>
                        </div>
                        {getTierBadge(entry.tier)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Past Winners */}
            <Card data-testid="section-past-winners">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5" />
                  Past Winners
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pastWinnersLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="text-gray-600 text-sm mt-2">Loading past winners...</p>
                  </div>
                ) : pastWinnersData.length === 0 ? (
                  <div className="text-center py-4">
                    <Trophy className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">No past winners yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastWinnersData.slice(0, 3).map((winner, index) => (
                      <div 
                        key={`${winner.userId}-${winner.weekStartDate}`}
                        className="border-b border-gray-100 pb-3 last:border-b-0"
                        data-testid={`past-winner-${index + 1}`}
                      >
                        <div className="flex items-center space-x-3 mb-1">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs bg-gradient-to-br from-amber-400 to-amber-600 text-white">
                              {getInitials(`${winner.firstName || 'U'} ${winner.lastName || ''}`)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800 text-sm">
                              {winner.firstName || 'User'} {winner.lastName || ''}
                            </div>
                            <div className="text-xs text-gray-600">
                              {winner.weeklyPoints} weekly points
                            </div>
                          </div>
                          <span className="text-xl">👑</span>
                        </div>
                        <div className="text-xs text-gray-500 ml-11">
                          {new Date(winner.weekStartDate).toLocaleDateString()} - {new Date(winner.weekEndDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* How to Earn Points */}
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle className="text-lg">Earn Weekly Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Complete a workout</span>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">+10 pts</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Share a post</span>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">+10 pts</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Complete a habit</span>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">+5 pts</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Log a meal</span>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">+5 pts</Badge>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-600">
                      <div className="font-semibold mb-1">Weekly Tiers:</div>
                      <div>🥉 Bronze: 0-499 pts</div>
                      <div>🥈 Silver: 500-999 pts</div>
                      <div>🥇 Gold: 1000+ pts</div>
                      <div className="mt-2 italic">Points reset each week</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
