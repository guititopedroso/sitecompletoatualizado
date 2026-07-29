// Cloudinary Upload Utility for Royal Coast
const CLOUDINARY_CLOUD_NAME = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string) || 'dw86u43e6';
const CLOUDINARY_UPLOAD_PRESET = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string) || 'ml_default';

/**
 * Uploads a file directly to Cloudinary.
 * Returns the secure CDN URL if configured, or null if Cloudinary upload fails (falling back to server upload).
 */
export async function uploadToCloudinary(file: File, folder: string = 'royalcoast'): Promise<string | null> {
  const cloudName = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string) || CLOUDINARY_CLOUD_NAME;
  const uploadPreset = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string) || CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.warn("⚠️ Cloudinary não configurado. A usar upload do servidor.");
    return null;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);

  try {
    console.log(`📤 A enviar foto para Cloudinary (${cloudName} / preset: ${uploadPreset})...`);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error('❌ Erro no Cloudinary:', errData);
      if (errData?.error?.message?.includes('unsigned')) {
        console.warn(`⚠️ ATENÇÃO: No painel do Cloudinary (Settings -> Upload -> Upload presets), edite o preset '${uploadPreset}' e mude "Signing Mode" para "Unsigned"!`);
      }
      return null;
    }

    const data = await res.json();
    const uploadedUrl = data.secure_url || data.url || null;
    if (uploadedUrl) {
      console.log('✅ Foto carregada com sucesso no Cloudinary:', uploadedUrl);
    }
    return uploadedUrl;
  } catch (err) {
    console.error('❌ Falha na ligação ao Cloudinary:', err);
    return null;
  }
}
