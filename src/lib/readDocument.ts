"use client";

/**
 * Pulls text out of an uploaded CV.
 *
 * PDF parsing happens in the browser with pdf.js, which is deliberate: the CV
 * never leaves the machine, same as the interview itself. The worker is loaded
 * from the same origin so this keeps working if a CDN is blocked.
 */

const MAX_BYTES = 5 * 1024 * 1024;

export async function readDocument(file: File): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error("That file is larger than 5MB.");
  }

  const name = file.name.toLowerCase();

  if (file.type === "text/plain" || name.endsWith(".txt") || name.endsWith(".md")) {
    return (await file.text()).trim();
  }

  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return extractPdfText(file);
  }

  throw new Error("Upload a PDF or a .txt file.");
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;

  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    );
  }

  const text = pages.join("\n\n").trim();
  if (!text) {
    throw new Error(
      "We couldn't read any text from that PDF — it may be a scan. Paste the text instead.",
    );
  }
  return text;
}
