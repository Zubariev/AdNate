
import { supabase } from './supabase';
import { Database } from './database.types';

type Tables = Database['public']['Tables'];
type Design = Tables['designs']['Row'];
type DesignInsert = Tables['designs']['Insert'];
type DesignUpdate = Tables['designs']['Update'];
type Comment = Tables['comments']['Row'];
type CommentInsert = Tables['comments']['Insert'];

export class DatabaseOperations {
  // Design operations
  static async createDesign(design: DesignInsert): Promise<{ data: Design | null; error: any }> {
    const { data, error } = await supabase
      .from('designs')
      .insert(design)
      .select()
      .single();
    
    return { data, error };
  }

  static async getUserDesigns(userId: string): Promise<{ data: Design[] | null; error: any }> {
    const { data, error } = await supabase
      .from('designs')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    return { data, error };
  }

  static async getDesign(id: string): Promise<{ data: Design | null; error: any }> {
    const { data, error } = await supabase
      .from('designs')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  }

  static async updateDesign(id: string, updates: DesignUpdate): Promise<{ data: Design | null; error: any }> {
    const { data, error } = await supabase
      .from('designs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  }

  static async deleteDesign(id: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('designs')
      .delete()
      .eq('id', id);
    
    return { error };
  }

  // Comment operations
  static async createComment(comment: CommentInsert): Promise<{ data: Comment | null; error: any }> {
    const { data, error } = await supabase
      .from('comments')
      .insert(comment)
      .select()
      .single();
    
    return { data, error };
  }

  static async getPostComments(postId: string): Promise<{ data: Comment[] | null; error: any }> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    
    return { data, error };
  }

  static async updateComment(id: string, content: string): Promise<{ data: Comment | null; error: any }> {
    const { data, error } = await supabase
      .from('comments')
      .update({ content })
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  }

  static async deleteComment(id: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);
    
    return { error };
  }

  // Test RLS policies
  static async testRLSPolicies(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      // Test unauthorized access to designs
      const { data: unauthorizedDesigns } = await supabase
        .from('designs')
        .select('*')
        .limit(1);
      
      if (unauthorizedDesigns && unauthorizedDesigns.length > 0) {
        errors.push('RLS policy failure: Unauthorized access to designs allowed');
      }
    } catch (error) {
      // This is expected when RLS is working
    }

    return {
      success: errors.length === 0,
      errors
    };
  }
}
