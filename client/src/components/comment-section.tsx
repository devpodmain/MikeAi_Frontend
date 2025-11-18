import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: number;
  postId: number;
  userId: string;
  content: string;
  parentCommentId: number | null;
  likes: number;
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  replies?: Comment[];
  isLiked?: boolean;
}

interface CommentSectionProps {
  postId: number;
  isExpanded: boolean;
}

function CommentItem({ comment, postId, depth = 0 }: { comment: Comment; postId: number; depth?: number }) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const replyMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest(`/api/community/posts/${postId}/comments`, "POST", {
        content,
        parentCommentId: comment.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts", postId, "comments"] });
      setReplyContent("");
      setShowReplyInput(false);
      toast({
        title: "Reply posted!",
        description: "Your reply has been added.",
      });
    },
    onError: () => {
      toast({
        title: "Error posting reply",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/community/comments/${comment.id}/like`, "POST", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts", postId, "comments"] });
    },
  });

  const handleReply = () => {
    if (!replyContent.trim()) return;
    replyMutation.mutate(replyContent);
  };

  const handleLike = () => {
    likeMutation.mutate();
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  const isNested = depth > 0;

  return (
    <div 
      className={`${isNested ? 'ml-8 pl-4 border-l-2 border-gray-200' : ''}`}
      data-testid={`comment-${comment.id}`}
    >
      <div className="flex space-x-3 mb-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={comment.user.profileImageUrl || ""} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-xs">
            {getInitials(comment.user.firstName, comment.user.lastName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <h5 className="font-semibold text-sm text-gray-800">
              {comment.user.firstName || 'User'} {comment.user.lastName || ''}
            </h5>
            <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
          </div>
          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
            <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className="h-auto p-0 hover:bg-transparent hover:text-primary flex items-center space-x-1"
              data-testid={`button-like-comment-${comment.id}`}
            >
              <Heart className={`h-3 w-3 ${comment.isLiked ? 'fill-primary text-primary' : ''}`} />
              <span>{comment.likes > 0 ? comment.likes : 'Like'}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="h-auto p-0 hover:bg-transparent hover:text-primary flex items-center space-x-1"
              data-testid={`button-reply-${comment.id}`}
            >
              <MessageCircle className="h-3 w-3" />
              <span>Reply</span>
            </Button>
          </div>

          {showReplyInput && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={2}
                className="text-sm"
                data-testid={`input-comment-reply-${comment.id}`}
              />
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={handleReply}
                  disabled={replyMutation.isPending || !replyContent.trim()}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  {replyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'Post Reply'
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowReplyInput(false);
                    setReplyContent("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} postId={postId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ postId, isExpanded }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/community/posts", postId, "comments"],
    enabled: isExpanded,
    retry: false,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest(`/api/community/posts/${postId}/comments`, "POST", {
        content,
        parentCommentId: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      setNewComment("");
      toast({
        title: "Comment posted!",
        description: "Your comment has been added.",
      });
    },
    onError: () => {
      toast({
        title: "Error posting comment",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateComment = () => {
    if (!newComment.trim()) return;
    createCommentMutation.mutate(newComment);
  };

  if (!isExpanded) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            data-testid={`input-add-comment-${postId}`}
          />
          <Button
            onClick={handleCreateComment}
            disabled={createCommentMutation.isPending || !newComment.trim()}
            className="bg-primary text-white hover:bg-primary/90"
          >
            {createCommentMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              'Post Comment'
            )}
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            <p className="text-gray-600 text-sm mt-2">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} postId={postId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
