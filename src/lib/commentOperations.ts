
import { supabase } from './supabase';
import { sanitizeHtml } from './sanitization';
import { validateComment } from './validations';

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  author_name: string;
  created_at: string;
  updated_at: string;
  moderation_status: 'approved' | 'pending' | 'rejected';
}

export interface CommentInput {
  post_id: string;
  content: string;
  author_name?: string;
}

export async function addComment(commentData: CommentInput): Promise<{ success: boolean; error?: string; comment?: Comment }> {
  try {
    // Validate comment data
    const validation = validateComment(commentData);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Must be logged in to comment' };
    }

    // Sanitize content
    const sanitizedContent = sanitizeHtml(commentData.content, 'comment');

    // Create comment object
    const newComment = {
      post_id: commentData.post_id,
      user_id: user.id,
      content: sanitizedContent,
      author_name: commentData.author_name || user.email?.split('@')[0] || 'Anonymous',
      moderation_status: 'approved' as const, // Auto-approve for now
    };

    // Insert comment
    const { data, error } = await supabase
      .from('comments')
      .insert([newComment])
      .select()
      .single();

    if (error) throw error;

    return { success: true, comment: data };
    
  } catch (error) {
    console.error('Error adding comment:', error);
    return { success: false, error: 'Failed to add comment' };
  }
}

export async function getComments(postId: string): Promise<{ success: boolean; comments?: Comment[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { success: true, comments: data || [] };
    
  } catch (error) {
    console.error('Error fetching comments:', error);
    return { success: false, error: 'Failed to load comments' };
  }
}

export async function updateComment(commentId: string, content: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate content
    const validation = validateComment({ post_id: '', content });
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Must be logged in to edit comments' };
    }

    // Sanitize content
    const sanitizedContent = sanitizeHtml(content, 'comment');

    // Update comment (only if user owns it)
    const { error } = await supabase
      .from('comments')
      .update({ 
        content: sanitizedContent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) throw error;

    return { success: true };
    
  } catch (error) {
    console.error('Error updating comment:', error);
    return { success: false, error: 'Failed to update comment' };
  }
}

export async function deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Must be logged in to delete comments' };
    }

    // Delete comment (only if user owns it)
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) throw error;

    return { success: true };
    
  } catch (error) {
    console.error('Error deleting comment:', error);
    return { success: false, error: 'Failed to delete comment' };
  }
}

// Real-time subscription for comments
export function subscribeToComments(postId: string, callback: (comments: Comment[]) => void) {
  const subscription = supabase
    .channel('comments')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`,
      },
      async () => {
        // Refetch comments when there's a change
        const result = await getComments(postId);
        if (result.success && result.comments) {
          callback(result.comments);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}
