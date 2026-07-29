// Cloudinary Upload Utility for Royal Coast
const CLOUDINARY_CLOUD_NAME = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string) || '';
const CLOUDINARY_UPLOAD_PRESET = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string) || '';

/**
 * Uploads a file directly to Cloudinary.
 * Returns the secure CDN URL if configured, or null if Cloudinary environment variables are not set or upload fails.
 */
export async function uploadToCloudinary(file: File, folder: string = 'royalcoast'): Promise<string | null> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    return null;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error('Cloudinary upload error:', errData);
      return null;
    }

    const data = await res.json();
    return data.secure_url || data.url || null;
  } catch (err) {
    console.error('Failed to upload to Cloudinary:', err);
    return null;
  }
}
