/* Extrai o texto de um PDF no próprio aparelho (pdf.js, carregado só quando necessário). */
// Vite entrega a URL do worker; o arquivo é copiado para o build e fica disponível offline.
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

export interface PdfText { text: string; pages: number; }

export async function extractPdfText(blob: Blob, maxPages = 15): Promise<PdfText> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const data = new Uint8Array(await blob.arrayBuffer());
  const task = pdfjs.getDocument({ data });
  const doc = await task.promise;
  const out: string[] = [];
  const n = Math.min(doc.numPages, maxPages);
  for (let p = 1; p <= n; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    // Agrupa os trechos por linha (coordenada y) e ordena da esquerda para a direita.
    const rows = new Map<number, { x: number; s: string }[]>();
    for (const item of content.items as { str?: string; transform?: number[] }[]) {
      if (!item.str || !item.transform) continue;
      const y = Math.round(item.transform[5] / 3) * 3;
      const x = item.transform[4];
      const row = rows.get(y) ?? [];
      row.push({ x, s: item.str });
      rows.set(y, row);
    }
    [...rows.entries()].sort((a, b) => b[0] - a[0]).forEach(([, row]) => {
      out.push(row.sort((a, b) => a.x - b.x).map((r) => r.s).join(' ').replace(/\s+/g, ' ').trim());
    });
    out.push('');
  }
  await task.destroy();
  return { text: out.join('\n'), pages: doc.numPages };
}
