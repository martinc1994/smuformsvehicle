import { FotoComprimida } from '../types';

/**
 * Convierte y comprime cualquier imagen capturada por cámara o galería a formato WebP liviano
 * (máx 1280px de lado mayor, calidad 0.72, típicamente entre 35 KB y 95 KB) para no saturar Supabase Storage.
 */
export async function compressImageToWebP(
  file: File,
  slot: 'frontal' | 'lateral' | 'posterior',
  label: string,
  maxDimension = 1280,
  quality = 0.74
): Promise<FotoComprimida> {
  const originalSizeKB = Math.round((file.size / 1024) * 10) / 10;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen no válido.'));
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el motor de compresión Canvas.'));
          return;
        }

        // Fondo blanco por si es un PNG transparente
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Intentar WebP primero; fallback a JPEG si el navegador no soporta encode WebP
        let format: 'image/webp' | 'image/jpeg' = 'image/webp';
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          format = 'image/jpeg';
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Calcular peso real del binario comprimido
        const base64Length = dataUrl.split(',')[1]?.length || 0;
        const byteLength = (base64Length * 3) / 4;
        const compressedSizeKB = Math.max(1, Math.round((byteLength / 1024) * 10) / 10);

        // Convertir DataURL a File listo para subir al bucket de Supabase
        const byteString = atob(dataUrl.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const ext = format === 'image/webp' ? 'webp' : 'jpg';
        const compressedFile = new File([ab], `${slot}_${Date.now()}.${ext}`, {
          type: format,
        });

        resolve({
          slot,
          label,
          dataUrl,
          originalSizeKB,
          compressedSizeKB,
          width,
          height,
          format,
          file: compressedFile,
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
