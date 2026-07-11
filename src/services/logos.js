/**
 * Carga de logos para el encabezado del PDF.
 *
 * Coloca tus dos archivos en la carpeta `public/`:
 *   - public/logo-left.png   (o .svg / .jpg)
 *   - public/logo-right.png  (o .svg / .jpg)
 *
 * Se cargan por su ruta pública. Si un archivo no existe, simplemente se omite
 * (no rompe la exportación). Cambia las rutas de abajo si usas otros nombres.
 */
// import.meta.env.BASE_URL respeta la ruta base (funciona en local y en
// GitHub Pages bajo /<repo>/). Los archivos van en la carpeta public/.
const BASE = import.meta.env.BASE_URL
export const LOGO_LEFT_SRC = `${BASE}e-sky-logo.png`
export const LOGO_RIGHT_SRC = `${BASE}fragote-logo.jpg`

/**
 * Carga una imagen y la devuelve como { dataUrl, width, height, format }
 * lista para jsPDF. Devuelve null si no se puede cargar.
 */
export function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const dataUrl = canvas.toDataURL('image/png')
        resolve({
          dataUrl,
          width: img.naturalWidth,
          height: img.naturalHeight,
          format: 'PNG',
        })
      } catch (err) {
        console.warn('No se pudo procesar el logo', src, err)
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/** Carga ambos logos en paralelo. Cada uno puede ser null. */
export async function loadHeaderLogos() {
  const [left, right] = await Promise.all([
    loadImage(LOGO_LEFT_SRC),
    loadImage(LOGO_RIGHT_SRC),
  ])
  return { left, right }
}
