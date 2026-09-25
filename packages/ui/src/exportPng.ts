// Exporta un SVG (la medalla) a PNG con canvas. Si el navegador no puede rasterizarlo,
// devuelve el propio SVG como respaldo.

export interface ExportResult {
  blob: Blob;
  ext: 'png' | 'svg';
}

/** Tamaño del viewBox del SVG ("0 0 w h"); por defecto el de la medalla. */
function viewBoxSize(svg: string): [number, number] {
  const m = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  return m ? [+m[1], +m[2]] : [320, 340];
}

/**
 * @param width ancho en px del PNG; el alto sigue la proporción del viewBox.
 * @param background color de fondo (el PNG del MVP usaba el papel #FBF6E6).
 */
export async function exportPng(
  svg: string,
  width: number,
  background = '#FBF6E6',
): Promise<ExportResult> {
  const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
  const [vw, vh] = viewBoxSize(svg);
  const height = Math.round((width * vh) / vw);
  // Con width/height explícitos el navegador rasteriza el vector al tamaño final.
  const sized = svg.replace('<svg ', `<svg width="${width}" height="${height}" `);
  const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error('No se pudo cargar el SVG'));
      img.src = url;
    });
    const cv = document.createElement('canvas');
    cv.width = width;
    cv.height = height;
    const ctx = cv.getContext('2d');
    if (!ctx) throw new Error('Canvas no disponible');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    const png = await new Promise<Blob | null>((res) => cv.toBlob(res, 'image/png'));
    if (!png) throw new Error('toBlob devolvió null');
    return { blob: png, ext: 'png' };
  } catch {
    return { blob: svgBlob, ext: 'svg' };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Descarga un Blob con un nombre de archivo. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
