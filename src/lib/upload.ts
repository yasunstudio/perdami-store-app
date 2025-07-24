// Client-side upload utilities (no direct Cloudinary import)

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

export interface UploadOptions {
  folder?: string;
  transformation?: any;
  allowedFormats?: string[];
  maxFileSize?: number; // in MB
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
}

// Client-side upload function that calls the API route
export async function uploadToCloudinary(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { folder = 'perdami-store' } = options;

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload file');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload image');
  }
}

// Client-side delete function that calls the API route
export async function deleteFromCloudinary(imageUrl: string): Promise<{ success: boolean; error?: string; result?: any; message?: string }> {
  try {
    const response = await fetch('/api/admin/upload', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to delete file' };
    }

    return result;
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete file' };
  }
}

export function optimizeImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}
): string {
  const { width, height, quality = 80, format = 'auto' } = options;
  
  if (!url.includes('cloudinary.com')) {
    return url; // Not a Cloudinary URL, return as-is
  }

  const transformations = [];
  
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);
  
  if (transformations.length === 0) return url;
  
  const transformString = transformations.join(',');
  return url.replace('/upload/', `/upload/${transformString}/`);
}

// Validate file type and size
export function validateFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { isValid: boolean; error?: string } {
  const { maxSizeMB = 10, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] } = options;

  // Check file size
  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return { isValid: true };
}

// Extract public ID from Cloudinary URL
export function extractPublicIdFromUrl(url: string): string {
  // Extract public ID from Cloudinary URL
  
  if (!url.includes('cloudinary.com')) {
    throw new Error('Not a valid Cloudinary URL');
  }

  try {
    // Extract the public ID from Cloudinary URL
    // Format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{transformations}/{public_id}.{format}
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) {
      throw new Error('Invalid Cloudinary URL format');
    }

    // Get everything after 'upload'
    const pathAfterUpload = urlParts.slice(uploadIndex + 1).join('/');
    // Get path after upload prefix
    
    // Split by '/' to handle folder structure
    const pathParts = pathAfterUpload.split('/');
    
    // Check if first part contains transformations (has commas, w_, h_, etc.)
    let publicIdPath = pathAfterUpload;
    if (pathParts.length > 1) {
      const firstPart = pathParts[0];
      // Common transformation patterns: w_100, h_100, c_fill, q_auto, f_auto, etc.
      if (firstPart.includes(',') || /^[a-z]_/.test(firstPart)) {
        // Skip transformation part
        publicIdPath = pathParts.slice(1).join('/');
      }
    }
    
    // Remove file extension
    const publicId = publicIdPath.replace(/\.[^/.]+$/, '');
    
    // Return extracted public ID
    return publicId;
  } catch (error) {
    console.error('Failed to extract public ID:', error);
    throw new Error('Failed to extract public ID from URL');
  }
}

// Convert File to base64 for upload (Node.js compatible)
export async function fileToBase64(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'application/octet-stream';
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    throw new Error('Failed to convert file to base64');
  }
}

// Wrapper function to handle File objects directly
export async function uploadFileToCloudinary(
  file: File,
  folder: string = 'perdami-store'
): Promise<UploadResult> {
  // Validate file type (allow images and PDFs)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File must be an image (JPG, PNG) or PDF')
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size must be less than 5MB')
  }

  try {
    // Use the updated uploadToCloudinary function that accepts File objects
    const resourceType = file.type === 'application/pdf' ? 'raw' : 'auto'
    return await uploadToCloudinary(file, { folder, resourceType })
  } catch (error) {
    console.error('File upload error:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to upload file')
  }
}
