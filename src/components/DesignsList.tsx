import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import DesignGallery from './DesignGallery.tsx';
import { LogOut } from 'lucide-react';
import { Database } from '../lib/database.types';

type Design = Database['public']['Tables']['designs']['Row'];

const DesignsList: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [designs, setDesigns] = useState<Design[]>([]);

  useEffect(() => {
    const loadDesigns = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/landing');
          return;
        }

        const { data, error } = await supabase
          .from('designs')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setDesigns(data || []);
      } catch (error) {
        console.error('Error loading designs:', error);
        setDesigns([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDesigns();
  }, [navigate]);

  const handleDeleteDesign = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error: deleteError } = await supabase
        .from('designs')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await supabase.storage
        .from('designs')
        .remove([
          `${user.id}/previews/${id}_preview.jpg`,
          `${user.id}/designs/${id}_full.png`
        ]);

      setDesigns(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      console.error('Error deleting design:', error);
      alert('Failed to delete design. Please try again.');
    }
  };

  const handleDuplicateDesign = async (design: Design) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const newId = crypto.randomUUID();
      const duplicateData = {
        ...design.data,
        metadata: {
          ...design.data.metadata,
          id: newId,
          name: `${design.data.metadata.name} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      const { data, error } = await supabase
        .from('designs')
        .insert({
          id: newId,
          user_id: user.id,
          name: duplicateData.metadata.name,
          data: duplicateData
        })
        .select()
        .single();

      if (error) throw error;

      setDesigns(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error duplicating design:', error);
      alert('Failed to duplicate design. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      localStorage.removeItem('isAuthenticated');
      navigate('/landing');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="w-16 h-16 border-4 border-indigo-400 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="absolute top-4 right-4">
        <button
          onClick={handleLogout}
          className="flex items-center px-4 py-2 space-x-2 text-gray-600 transition-colors bg-white rounded-lg shadow-sm hover:bg-gray-50"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
      <DesignGallery
        designs={designs}
        onLoadDesign={(design) => {
          console.log('Loading design:', design);
          console.log('Design ID:', design.id);
          navigate(`/editor/${design.id}`);
        }}
        onDeleteDesign={handleDeleteDesign}
        onDuplicateDesign={handleDuplicateDesign}
        onCreateNew={() => navigate('/editor/new')}
      />
    </div>
  );
};

export { DesignsList };