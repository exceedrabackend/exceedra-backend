const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const uploadImage = async (buffer, fileName) => {
  try {
    // Get file extension
    const fileExt = fileName.split('.').pop().toLowerCase();

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substr(2, 9);
    const uniqueFileName = `${timestamp}-${randomString}.${fileExt}`;

    // Create file path
    const filePath = `damage-reports/${uniqueFileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('damage-images')
      .upload(filePath, buffer, {
        contentType: `image/${fileExt}`,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('damage-images')
      .getPublicUrl(filePath);

    return {
      secure_url: publicUrlData.publicUrl,
      public_id: filePath,
      original_filename: fileName
    };
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

const deleteImage = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from('damage-images')
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }

    return { result: 'ok' };
  } catch (error) {
    console.error('Error deleting from Supabase:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

const getImageUrl = (filePath, transformations = {}) => {
  try {
    const { data } = supabase.storage
      .from('damage-images')
      .getPublicUrl(filePath);

    let url = data.publicUrl;

    // Add basic transformations as query parameters if needed
    // Note: Supabase doesn't have built-in image transformations like Cloudinary
    // You might want to implement client-side resizing or use a separate service
    if (transformations.width || transformations.height) {
      const params = new URLSearchParams();
      if (transformations.width) params.set('width', transformations.width);
      if (transformations.height) params.set('height', transformations.height);
      url += `?${params.toString()}`;
    }

    return url;
  } catch (error) {
    console.error('Error getting image URL:', error);
    return null;
  }
};

// Test connection function
const testConnection = async () => {
  try {
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }

    console.log('Supabase connection successful. Available buckets:', data.map(b => b.name));
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};

module.exports = {
  uploadImage,
  deleteImage,
  getImageUrl,
  testConnection,
  supabase
};