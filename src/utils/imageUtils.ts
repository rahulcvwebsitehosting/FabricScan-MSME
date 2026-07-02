/**
 * imageUtils.ts — Client-side image compression before API upload.
 *
 * CONTRACT: This function ALWAYS outputs JPEG bytes, regardless of the
 * original file format (PNG, WEBP, HEIC, etc.). The canvas.toDataURL call
 * re-encodes the image as JPEG at 85% quality.
 *
 * api/analyze.ts hardcodes mimeType: 'image/jpeg' to match this contract.
 * Do NOT change that to pass through file.type — the bytes and the label
 * would mismatch and Gemini would mis-decode the image.
 */

const MAX_PX = 1024   // longest dimension cap
const JPEG_QUALITY = 0.85

/**
 * Compresses a File to a base64 JPEG string (no data-URL prefix).
 * Phone photos (4–8 MB) are reduced to ~150–300 KB before the API call.
 */
export async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      // Scale down proportionally; never upscale
      const scale = Math.min(MAX_PX / img.naturalWidth, MAX_PX / img.naturalHeight, 1)
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.naturalWidth  * scale)
      canvas.height = Math.round(img.naturalHeight * scale)

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'))
        return
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // toDataURL always produces JPEG output here — see contract comment above
      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
      // Strip "data:image/jpeg;base64," prefix — only the raw base64 is sent
      resolve(dataUrl.split(',')[1])
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`Failed to load image: ${file.name}`))
    }

    img.src = objectUrl
  })
}

/** Returns a local object URL for displaying the original (uncompressed) image in the UI. */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

/** Revokes an object URL when it's no longer needed. */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url)
}
