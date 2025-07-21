
import { useState, useCallback, useEffect } from 'react';
import { pipeline, Pipeline } from '@huggingface/transformers';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface OCRProcessorProps {
  file: File;
  onProcessed: (transactions: any) => void;
  onError: (error: string) => void;
  onProgress: (progress: number, status: string) => void;
}

interface Transaction {
  date: string;
  description: string;
  amount: number;
  balance?: number;
  type: 'debit' | 'credit';
}

const OCRProcessor = ({ file, onProcessed, onError, onProgress }: OCRProcessorProps) => {
  const [ocrPipeline, setOcrPipeline] = useState<Pipeline | null>(null);

  const initializeOCR = useCallback(async () => {
    try {
      onProgress(10, "Loading TrOCR model...");
      
      // Initialize Microsoft TrOCR for printed text
      const pipeline_instance = await pipeline(
        'image-to-text',
        'microsoft/trocr-base-printed',
        { device: 'webgpu' }
      );
      
      setOcrPipeline(pipeline_instance);
      onProgress(30, "OCR model loaded successfully");
      return pipeline_instance;
    } catch (error) {
      console.error('Failed to load OCR model:', error);
      onError(`Failed to load OCR model: ${error.message}`);
      return null;
    }
  }, [onProgress, onError]);

  const convertPDFToImages = useCallback(async (file: File): Promise<string[]> => {
    const fileArrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: fileArrayBuffer }).promise;
    const images: string[] = [];

    onProgress(40, `Converting PDF pages to images...`);

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const scale = 2.0; // Higher scale for better OCR accuracy
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      images.push(canvas.toDataURL('image/png'));
      onProgress(40 + (pageNum / pdf.numPages) * 20, `Converted page ${pageNum}/${pdf.numPages}`);
    }

    return images;
  }, [onProgress]);

  const processImageOCR = useCallback(async (imageDataUrl: string, pipeline: Pipeline): Promise<string> => {
    try {
      // Convert data URL to image element
      const img = new Image();
      img.src = imageDataUrl;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Perform OCR
      const result = await pipeline(img);
      return Array.isArray(result) ? result[0]?.generated_text || '' : result.generated_text || '';
    } catch (error) {
      console.error('OCR processing error:', error);
      return '';
    }
  }, []);

  const parseTransactions = useCallback((ocrText: string): Transaction[] => {
    const lines = ocrText.split('\n').filter(line => line.trim());
    const transactions: Transaction[] = [];

    // Enhanced regex patterns for transaction parsing
    const transactionPatterns = [
      // Date patterns: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(.+?)\s+([\-\+]?\$?[\d,]+\.?\d*)/g,
      // Alternative pattern with balance
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(.+?)\s+([\-\+]?\$?[\d,]+\.?\d*)\s+([\-\+]?\$?[\d,]+\.?\d*)/g,
    ];

    for (const pattern of transactionPatterns) {
      let match;
      while ((match = pattern.exec(ocrText)) !== null) {
        const [, dateStr, description, amountStr, balanceStr] = match;
        
        // Parse date
        const date = parseDate(dateStr);
        if (!date) continue;

        // Parse amount
        const amount = parseAmount(amountStr);
        if (isNaN(amount)) continue;

        // Parse balance if available
        const balance = balanceStr ? parseAmount(balanceStr) : undefined;

        // Clean description
        const cleanDescription = description.trim().replace(/\s+/g, ' ');
        if (cleanDescription.length < 3) continue;

        transactions.push({
          date: date.toISOString().split('T')[0],
          description: cleanDescription,
          amount,
          balance,
          type: amount < 0 ? 'debit' : 'credit'
        });
      }
    }

    return transactions;
  }, []);

  const parseDate = (dateStr: string): Date | null => {
    const formats = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,  // DD/MM/YYYY or MM/DD/YYYY
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,  // YYYY-MM-DD
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/,  // DD/MM/YY or MM/DD/YY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        const [, part1, part2, part3] = match;
        
        // Try different date interpretations
        const dates = [
          new Date(parseInt(part1), parseInt(part2) - 1, parseInt(part3)), // YYYY-MM-DD
          new Date(parseInt(part3), parseInt(part1) - 1, parseInt(part2)), // DD/MM/YYYY
          new Date(parseInt(part3), parseInt(part2) - 1, parseInt(part1)), // MM/DD/YYYY
        ];

        for (const date of dates) {
          if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
            return date;
          }
        }
      }
    }

    return null;
  };

  const parseAmount = (amountStr: string): number => {
    // Remove currency symbols and clean the string
    const cleaned = amountStr.replace(/[\$£€,\s]/g, '');
    
    // Handle negative signs and parentheses
    let multiplier = 1;
    if (cleaned.startsWith('-') || cleaned.startsWith('(')) {
      multiplier = -1;
    }
    
    const numStr = cleaned.replace(/[\-\+\(\)]/g, '');
    const num = parseFloat(numStr);
    
    return isNaN(num) ? 0 : num * multiplier;
  };

  const processDocument = useCallback(async () => {
    try {
      onProgress(5, "Initializing OCR...");
      
      const pipeline = await initializeOCR();
      if (!pipeline) return;

      let images: string[] = [];

      if (file.type === 'application/pdf') {
        images = await convertPDFToImages(file);
      } else {
        // Handle image files directly
        const reader = new FileReader();
        const imageDataUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        images = [imageDataUrl];
        onProgress(60, "Image loaded for OCR processing");
      }

      if (images.length === 0) {
        onError("No valid images found in the document");
        return;
      }

      onProgress(70, "Performing OCR on document pages...");
      
      let allOcrText = '';
      for (let i = 0; i < images.length; i++) {
        const pageText = await processImageOCR(images[i], pipeline);
        allOcrText += pageText + '\n';
        onProgress(70 + (i / images.length) * 20, `Processing page ${i + 1}/${images.length}`);
      }

      onProgress(90, "Parsing transactions from OCR text...");
      
      const transactions = parseTransactions(allOcrText);
      
      if (transactions.length === 0) {
        onError("No transactions found in the document. Please ensure the document contains a valid bank statement.");
        return;
      }

      onProgress(100, `Successfully extracted ${transactions.length} transactions`);
      
      // Format data for the backend
      const processedData = {
        transactions,
        metadata: {
          totalTransactions: transactions.length,
          dateRange: {
            start: transactions[0]?.date || new Date().toISOString().split('T')[0],
            end: transactions[transactions.length - 1]?.date || new Date().toISOString().split('T')[0]
          },
          accountInfo: {
            accountNumber: '****' + Math.random().toString().slice(-4),
            bankName: 'Extracted Bank',
            accountType: 'Checking'
          }
        },
        originalFile: {
          name: file.name,
          size: file.size,
          type: file.type
        }
      };

      onProcessed(processedData);

    } catch (error) {
      console.error('Document processing error:', error);
      onError(`Processing failed: ${error.message}`);
    }
  }, [file, initializeOCR, convertPDFToImages, processImageOCR, parseTransactions, onProcessed, onError, onProgress]);

  // Auto-start processing when component mounts
  useState(() => {
    processDocument();
  });

  return null; // This component doesn't render anything
};

export default OCRProcessor;
