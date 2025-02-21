const handleSaveDesign = async () => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data?.user) {
      throw new Error('User not authenticated');
    }

    const designData = {
      user_id: user.data.user.id,
      name: designName || 'Untitled Design',
      content: JSON.stringify(editorState),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('designs')
      .upsert(designData, { 
        onConflict: 'id',
        returning: true 
      });

    if (error) throw error;
    
    console.log('Design saved successfully:', data);
    // Add success notification here if needed
  } catch (error) {
    console.error('Error saving design:', error);
    // Add error notification here if needed
  }
}; 