// Archivo 900 (OFL) como data URL, para incrustarla en la medalla de impresión.
// Se descarga solo al exportar: no pesa en la carga inicial de la app.
import fontUrl from '@fontsource/archivo/files/archivo-latin-900-normal.woff2?url';

let cached: Promise<string> | null = null;

export function archivoDataUrl(): Promise<string> {
  cached ??= fetch(fontUrl)
    .then((res) => {
      if (!res.ok) throw new Error(`No se pudo cargar la fuente (${res.status})`);
      return res.arrayBuffer();
    })
    .then((buf) => {
      const bytes = new Uint8Array(buf);
      let bin = '';
      for (let i = 0; i < bytes.length; i += 0x8000) {
        bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      return `data:font/woff2;base64,${btoa(bin)}`;
    })
    .catch((e) => {
      cached = null; // permitir reintentar
      throw e;
    });
  return cached;
}
