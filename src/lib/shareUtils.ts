
import { supabase } from './supabase';
import { DatabaseOperations } from './database';

interface ShareToken {
  id: string;
  design_id: string;
  token: string;
  permissions: 'view' | 'edit';
  expires_at?: string;
  created_by: string;
  created_at: string;
}

export class ShareUtils {
  static generateShareToken(): string {
    return crypto.randomUUID().replace(/-/g, '');
  }

  static async createShareLink(
    designId: string,
    permissions: 'view' | 'edit' = 'view',
    expiresIn?: number // hours
  ): Promise<{ data: ShareToken | null; error: any; shareUrl?: string }> {
    const token = this.generateShareToken();
    const expiresAt = expiresIn 
      ? new Date(Date.now() + expiresIn * 60 * 60 * 1000).toISOString()
      : undefined;

    const { data, error } = await supabase
      .from('design_shares')
      .insert({
        design_id: designId,
        token,
        permissions,
        expires_at: expiresAt,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    const shareUrl = `${window.location.origin}/shared/${token}`;
    return { data, error: null, shareUrl };
  }

  static async getSharedDesign(
    token: string
  ): Promise<{ data: any; error: any; permissions?: 'view' | 'edit' }> {
    // Validate the share token
    const { data: shareData, error: shareError } = await supabase
      .from('design_shares')
      .select('*')
      .eq('token', token)
      .single();

    if (shareError || !shareData) {
      return { data: null, error: 'Invalid or expired share link' };
    }

    // Check if token has expired
    if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
      return { data: null, error: 'Share link has expired' };
    }

    // Get the design data
    const { data: design, error: designError } = await supabase
      .from('designs')
      .select('*')
      .eq('id', shareData.design_id)
      .single();

    if (designError || !design) {
      return { data: null, error: 'Design not found' };
    }

    return { 
      data: design, 
      error: null, 
      permissions: shareData.permissions 
    };
  }

  static async revokeShareLink(token: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('design_shares')
      .delete()
      .eq('token', token);

    return { success: !error, error: error?.message };
  }

  static async getDesignShares(designId: string): Promise<{ data: ShareToken[] | null; error: any }> {
    const { data, error } = await supabase
      .from('design_shares')
      .select('*')
      .eq('design_id', designId)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  static async updateSharePermissions(
    token: string,
    permissions: 'view' | 'edit'
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('design_shares')
      .update({ permissions })
      .eq('token', token);

    return { success: !error, error: error?.message };
  }
}
