import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// Configure GlobalWorkerOptions.workerSrc for pdfjs-dist in Node and Browser environments
if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
  try {
    if (typeof window !== 'undefined') {
      // Browser environment: use matching version CDN worker
      const version = (pdfjsLib as any).version || '6.1.200';
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/legacy/build/pdf.worker.mjs`;
    } else if (typeof process !== 'undefined' && process?.versions?.node) {
      // Node.js environment: worker can be disabled or loaded safely
      try {
        if (typeof require !== 'undefined') {
          const path = require('path');
          const workerPath = path.resolve('node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
          pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
        }
      } catch (e) {
        // Fallback for Node without require
      }
    }
  } catch (e) {
    // Ignore workerSrc assignment error if restricted
  }
}

export interface PDFPageContent {
  page: number;
  text: string;
}

export interface PDFExtractionResult {
  success: boolean;
  fileName: string;
  fileType: string;
  fileSize: string;
  pageCount: number;
  extractedText: string;
  pages: PDFPageContent[];
  totalCharCount: number;
  isScannedOrEmpty: boolean;
  errorMessage?: string;
  firstCharsSample?: string;
}

/**
 * Validates whether a Uint8Array contains a valid %PDF- header signature in the first 1024 bytes.
 */
export function hasValidPdfHeader(data: Uint8Array): boolean {
  if (!data || data.length < 10) return false;
  const limit = Math.min(data.length, 1024);
  for (let i = 0; i < limit - 4; i++) {
    if (
      data[i] === 0x25 &&     // %
      data[i + 1] === 0x50 && // P
      data[i + 2] === 0x44 && // D
      data[i + 3] === 0x46 && // F
      data[i + 4] === 0x2d    // -
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a string contains raw PDF binary or PDF syntax artifacts rather than extracted text.
 */
export function isRawPdfBinary(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.startsWith('%PDF-')) return true;

  // Count occurrence of raw PDF structural markers
  const pdfMarkers = ['/FlateDecode', '/Font', '/XObject', '/Type /Page', 'endobj', 'stream', 'endstream', 'xref', 'trailer'];
  let markerHits = 0;
  for (const marker of pdfMarkers) {
    if (trimmed.includes(marker)) {
      markerHits++;
    }
  }

  // If 3 or more raw PDF markers are present, or %PDF- is present, it's raw PDF binary
  if (markerHits >= 3) return true;

  // Check unprintable binary character ratio
  let binaryCharCount = 0;
  for (let i = 0; i < Math.min(trimmed.length, 1000); i++) {
    const code = trimmed.charCodeAt(i);
    if ((code < 32 && code !== 9 && code !== 10 && code !== 13) || (code >= 127 && code <= 159)) {
      binaryCharCount++;
    }
  }
  if (binaryCharCount / Math.min(trimmed.length, 1000) > 0.15) {
    return true;
  }

  return false;
}

/**
 * Extracts page-by-page readable text from a PDF Uint8Array or Buffer using pdfjs-dist.
 */
export async function extractTextFromPdfBuffer(
  buffer: Uint8Array | ArrayBuffer | Buffer,
  fileName: string = 'document.pdf',
  fileSizeStr: string = '0 MB'
): Promise<PDFExtractionResult> {
  let uint8Data: Uint8Array;
  if (buffer instanceof Uint8Array) {
    uint8Data = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  } else if (buffer instanceof ArrayBuffer) {
    uint8Data = new Uint8Array(buffer);
  } else {
    const buf = Buffer.from(buffer as any);
    uint8Data = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }

  // Step 8: Start PDF Extraction
  console.log(`[PDF FLOW 06] PDF extraction function called`);
  console.log(`[PDF DEBUG 08] PDF extraction started for "${fileName}" (Declared size: ${fileSizeStr}, Bytes: ${uint8Data.length})`);

  // Critical Validation Step 1: Buffer existence and size sanity check
  if (!uint8Data || uint8Data.length < 50) {
    console.warn(`[PDF Pipeline] STOPPING EXTRACTION: Received buffer for "${fileName}" is too small (${uint8Data?.length || 0} bytes). File data is incomplete or corrupted.`);
    return {
      success: false,
      fileName,
      fileType: 'application/pdf',
      fileSize: fileSizeStr,
      pageCount: 0,
      extractedText: '',
      pages: [],
      totalCharCount: 0,
      isScannedOrEmpty: true,
      errorMessage: 'الملف المرفق مجزأ أو غير مكتمل.',
    };
  }

  // Critical Validation Step 2: Check %PDF- header signature
  const isValidPdf = hasValidPdfHeader(uint8Data);
  console.log(`[PDF DEBUG 09] PDF header valid = ${isValidPdf}`);

  if (!isValidPdf) {
    console.warn(`[PDF Pipeline] WARNING: Buffer for "${fileName}" does not contain a valid %PDF- header.`);

    // Fallback: Check if the buffer is plain UTF-8 text (e.g. text or markdown misnamed as .pdf)
    try {
      if (typeof TextDecoder !== 'undefined') {
        const textDecoder = new TextDecoder('utf-8', { fatal: true });
        const decodedText = textDecoder.decode(uint8Data);

        if (decodedText && decodedText.trim().length > 0 && !isRawPdfBinary(decodedText)) {
          const cleanText = decodedText.trim();
          console.log(`[PDF Pipeline] Recovered plain text content from "${fileName}" (${cleanText.length} chars)`);
          return {
            success: true,
            fileName,
            fileType: 'text/plain',
            fileSize: fileSizeStr,
            pageCount: 1,
            extractedText: `Page 1:\n${cleanText}`,
            pages: [{ page: 1, text: cleanText }],
            totalCharCount: cleanText.length,
            isScannedOrEmpty: false,
            firstCharsSample: cleanText.slice(0, 300)
          };
        }
      }
    } catch {
      // Not valid UTF-8 text
    }

    return {
      success: false,
      fileName,
      fileType: 'application/pdf',
      fileSize: fileSizeStr,
      pageCount: 0,
      extractedText: '',
      pages: [],
      totalCharCount: 0,
      isScannedOrEmpty: true,
      errorMessage: 'الملف المرفق لا يحتوي على ترويسة PDF صحيحة.',
    };
  }

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Data,
      useSystemFonts: true,
      disableFontFace: true,
    } as any);

    const pdfDoc = await loadingTask.promise;
    console.log(`[PDF DEBUG 10] PDF loaded`);

    const pageCount = pdfDoc.numPages;
    console.log(`[PDF DEBUG 11] Number of pages = ${pageCount}`);

    const pages: PDFPageContent[] = [];
    let fullExtractedText = '';
    let totalCharCount = 0;

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      if (pageNum === 1) {
        console.log(`[PDF DEBUG 12] Page 1 text extraction started`);
      }
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageTextItems = textContent.items
        .map((item: any) => (item.str ? item.str : ''))
        .filter((str: string) => str.trim().length > 0);

      const rawPageText = pageTextItems.join(' ').replace(/\s+/g, ' ').trim();

      // Ensure extracted text is clean and not binary
      const cleanPageText = isRawPdfBinary(rawPageText) ? '' : rawPageText;

      if (pageNum === 1) {
        console.log(`[PDF DEBUG 13] Page 1 text length = ${cleanPageText.length}`);
      }

      pages.push({
        page: pageNum,
        text: cleanPageText,
      });

      if (cleanPageText) {
        fullExtractedText += `Page ${pageNum}:\n${cleanPageText}\n\n`;
        totalCharCount += cleanPageText.length;
      } else {
        fullExtractedText += `Page ${pageNum}:\n[لا يوجد نص مكتوب قابل للاستخراج في هذه الصفحة]\n\n`;
      }
    }

    const trimmedExtractedText = fullExtractedText.trim();
    const isScanned = totalCharCount < 15;
    const firstCharsSample = trimmedExtractedText.slice(0, 300);

    console.log(`[PDF DEBUG 14] Total extracted characters = ${totalCharCount}`);
    console.log(`[PDF DEBUG 15] First 300 characters = "${firstCharsSample.replace(/\n/g, ' ')}"`);

    console.log(`[PDF Pipeline] Extraction Summary:`, {
      uploadedFileName: fileName,
      originalFileSize: fileSizeStr,
      receivedBufferByteLength: uint8Data.length,
      validPdfHeader: isValidPdf,
      numberOfPages: pageCount,
      extractionSuccess: !isScanned,
      extractedCharacterCount: totalCharCount,
      first300CharsSample: firstCharsSample.replace(/\n/g, ' '),
      extractionMethod: 'pdfjs-dist page-by-page text stream',
      isTextEmpty: !trimmedExtractedText || trimmedExtractedText.length === 0,
      aiReceivedText: !isScanned && Boolean(trimmedExtractedText)
    });

    if (isScanned) {
      console.warn(`[PDF Pipeline] Warning: PDF "${fileName}" appears to be scanned or contains no extractable text layer.`);
    }

    return {
      success: !isScanned,
      fileName,
      fileType: 'application/pdf',
      fileSize: fileSizeStr,
      pageCount,
      extractedText: trimmedExtractedText,
      pages,
      totalCharCount,
      isScannedOrEmpty: isScanned,
      firstCharsSample,
    };
  } catch (error: any) {
    console.warn(`[PDF Pipeline] Could not parse PDF structure for "${fileName}":`, error?.message || error);

    return {
      success: false,
      fileName,
      fileType: 'application/pdf',
      fileSize: fileSizeStr,
      pageCount: 0,
      extractedText: '',
      pages: [],
      totalCharCount: 0,
      isScannedOrEmpty: true,
      errorMessage: error?.message || 'فشل في قراءة ملف PDF',
    };
  }
}

/**
 * Helper to convert Base64 string / Data URL to Uint8Array
 */
export function base64ToUint8Array(base64Str: string): Uint8Array {
  if (!base64Str) return new Uint8Array(0);

  let cleanBase64 = base64Str;
  if (base64Str.includes(';base64,')) {
    cleanBase64 = base64Str.split(';base64,')[1];
  }

  // Remove any whitespace, newlines, or tabs that could break base64 decoding
  cleanBase64 = cleanBase64.replace(/\s+/g, '');

  // Add missing base64 padding if necessary
  while (cleanBase64.length % 4 !== 0) {
    cleanBase64 += '=';
  }

  try {
    if (typeof Buffer !== 'undefined') {
      const buf = Buffer.from(cleanBase64, 'base64');
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error('[pdfExtractor] base64ToUint8Array error:', e);
    // Fallback: convert string directly to UTF-8 bytes if not valid base64
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(base64Str);
    }
    return new Uint8Array(0);
  }
}
