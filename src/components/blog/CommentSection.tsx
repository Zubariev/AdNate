
import { useState } from "react";
import { useAuth } from "..//auth/AuthProvider";
import { Button } from "..//ui/button";
import { Textarea } from "..//ui/textarea";
import { supabase } from "../../lib/supabase";
import { toast } from "..//ui/use-toast";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_email: string;
}

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to comment",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert([
          {
            post_id: postId,
            content: newComment,
            user_id: user.id,
            user_email: user.email,
          },
        ])
        .select();

      if (error) throw error;

      setComments([...comments, data[0] as Comment]);
      setNewComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <h3 className="text-xl font-semibold">Comments</h3>
      
      {user ? (
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Posting..." : "Post Comment"}
          </Button>
        </form>
      ) : (
        <p className="text-muted-foreground">
          Please sign in to leave a comment.
        </p>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="p-4 rounded-lg bg-secondary/50 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{comment.user_email}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm">{comment.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
