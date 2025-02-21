
import { supabase } from './supabase';

interface DesignVersion {
  id: string;
  design_id: string;
  version_number: number;
  content: any;
  created_at: string;
  created_by: string;
  description?: string;
}

export class VersionControl {
  static async createVersion(
    designId: string, 
    content: any, 
    description?: string
  ): Promise<{ data: DesignVersion | null; error: any }> {
    // Get the current highest version number
    const { data: latestVersion } = await supabase
      .from('design_versions')
      .select('version_number')
      .eq('design_id', designId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const versionNumber = (latestVersion?.version_number || 0) + 1;

    const { data, error } = await supabase
      .from('design_versions')
      .insert({
        design_id: designId,
        version_number: versionNumber,
        content,
        description,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    return { data, error };
  }

  static async getVersions(designId: string): Promise<{ data: DesignVersion[] | null; error: any }> {
    const { data, error } = await supabase
      .from('design_versions')
      .select('*')
      .eq('design_id', designId)
      .order('version_number', { ascending: false });

    return { data, error };
  }

  static async getVersion(
    designId: string, 
    versionNumber: number
  ): Promise<{ data: DesignVersion | null; error: any }> {
    const { data, error } = await supabase
      .from('design_versions')
      .select('*')
      .eq('design_id', designId)
      .eq('version_number', versionNumber)
      .single();

    return { data, error };
  }

  static async rollbackToVersion(
    designId: string, 
    versionNumber: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the version content
      const { data: version, error: versionError } = await this.getVersion(designId, versionNumber);
      if (versionError || !version) {
        return { success: false, error: 'Version not found' };
      }

      // Update the current design with the version content
      const { error: updateError } = await supabase
        .from('designs')
        .update({ 
          content: version.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', designId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Create a new version for the rollback
      await this.createVersion(
        designId, 
        version.content, 
        `Rolled back to version ${versionNumber}`
      );

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Rollback failed' 
      };
    }
  }

  static compareVersions(version1: any, version2: any): {
    added: any[];
    removed: any[];
    modified: any[];
  } {
    const v1Elements = version1.elements || [];
    const v2Elements = version2.elements || [];
    
    const v1Map = new Map(v1Elements.map((el: any) => [el.id, el]));
    const v2Map = new Map(v2Elements.map((el: any) => [el.id, el]));

    const added = v2Elements.filter((el: any) => !v1Map.has(el.id));
    const removed = v1Elements.filter((el: any) => !v2Map.has(el.id));
    const modified = v2Elements.filter((el: any) => {
      const v1El = v1Map.get(el.id);
      return v1El && JSON.stringify(v1El) !== JSON.stringify(el);
    });

    return { added, removed, modified };
  }
}
