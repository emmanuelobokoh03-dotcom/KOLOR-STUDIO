import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET_NAME = 'lead-files';

let supabase: SupabaseClient | null = null;

// Initialize Supabase client
function getSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn('Supabase credentials not configured');
    return null;
  }
  
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }
  
  return supabase;
}

// Ensure bucket exists
export async function ensureBucketExists(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // Check if bucket exists
    const { data: buckets } = await client.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

    if (!bucketExists) {
      // Create the bucket
      const { error } = await client.storage.createBucket(BUCKET_NAME, {
        public: false, // Files require authentication to access
        fileSizeLimit: 52428800, // 50MB limit
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'text/csv',
        ],
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
        return false;
      }
      console.log('Created storage bucket:', BUCKET_NAME);
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    return false;
  }
}

// Upload a file
export async function uploadFile(
  file: Buffer,
  filename: string,
  mimeType: string,
  leadId: string
): Promise<{ url: string; path: string } | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  // Create a unique path: lead-files/leadId/timestamp-filename
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `private/${leadId}/${timestamp}-${sanitizedFilename}`;

  try {
    const { error } = await client.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // Get public URL (signed URL for private bucket)
    const { data: urlData } = await client.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry

    return {
      url: urlData?.signedUrl || '',
      path: filePath,
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return null;
  }
}

// Get a signed URL for downloading
export async function getSignedUrl(filePath: string): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

    if (error) {
      console.error('Signed URL error:', error);
      return null;
    }

    return data?.signedUrl || null;
  } catch (error) {
    console.error('Signed URL exception:', error);
    return null;
  }
}

// Delete a file
export async function deleteFile(filePath: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete exception:', error);
    return false;
  }
}

// Get file type category for icons
export function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'spreadsheet';
  if (mimeType.startsWith('text/')) return 'text';
  return 'file';
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
