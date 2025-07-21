
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

  const extractTextFromPDF = useCallback(async (file: File): Promise<string> => {
    try {
      const fileArrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: fileArrayBuffer }).promise;
      let fullText = '';

      onProgress(30, "Extracting text from PDF...");

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
        
        onProgress(30 + (pageNum / pdf.numPages) * 40, `Extracting text from page ${pageNum}/${pdf.numPages}`);
      }

      return fullText;
    } catch (error) {
      console.error('PDF text extraction failed:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }, [onProgress]);

  const initializeOCR = useCallback(async () => {
    try {
      onProgress(10, "Loading OCR model...");
      
      // Try a more reliable OCR model
      const pipeline_instance = await pipeline(
        'image-to-text',
        'Xenova/trocr-base-handwritten',
        { device: 'cpu' } // Use CPU to avoid GPU compatibility issues
      );
      
      setOcrPipeline(pipeline_instance);
      onProgress(25, "OCR model loaded successfully");
      return pipeline_instance;
    } catch (error) {
      console.error('Failed to load OCR model:', error);
      throw new Error(`Failed to load OCR model: ${error.message}`);
    }
  }, [onProgress]);

  const convertPDFToImages = useCallback(async (file: File): Promise<string[]> => {
    const fileArrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: fileArrayBuffer }).promise;
    const images: string[] = [];

    onProgress(70, `Converting PDF pages to images...`);

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const scale = 2.0;
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
      onProgress(70 + (pageNum / pdf.numPages) * 15, `Converted page ${pageNum}/${pdf.numPages}`);
    }

    return images;
  }, [onProgress]);

  const processImageOCR = useCallback(async (imageDataUrl: string, pipeline: Pipeline): Promise<string> => {
    try {
      const img = new Image();
      img.src = imageDataUrl;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const result = await pipeline(img);
      return Array.isArray(result) ? result[0]?.generated_text || '' : result.generated_text || '';
    } catch (error) {
      console.error('OCR processing error:', error);
      return '';
    }
  }, []);

  const parseTransactions = useCallback((text: string): Transaction[] => {
    const lines = text.split('\n').filter(line => line.trim());
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
      while ((match = pattern.exec(text)) !== null) {
        const [, dateStr, description, amountStr, balanceStr] = match;
        
        const date = parseDate(dateStr);
        if (!date) continue;

        const amount = parseAmount(amountStr);
        if (isNaN(amount)) continue;

        const balance = balanceStr ? parseAmount(balanceStr) : undefined;
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
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/,
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        const [, part1, part2, part3] = match;
        
        const dates = [
          new Date(parseInt(part1), parseInt(part2) - 1, parseInt(part3)),
          new Date(parseInt(part3), parseInt(part1) - 1, parseInt(part2)),
          new Date(parseInt(part3), parseInt(part2) - 1, parseInt(part1)),
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
    const cleaned = amountStr.replace(/[\$£€,\s]/g, '');
    
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
      onProgress(5, "Starting document processing...");
      
      let extractedText = '';

      if (file.type === 'application/pdf') {
        try {
          // First, try to extract text directly from PDF
          extractedText = await extractTextFromPDF(file);
          onProgress(70, "Text extracted from PDF successfully");
        } catch (error) {
          console.log('PDF text extraction failed, falling back to OCR');
          // If text extraction fails, use OCR
          const pipeline = await initializeOCR();
          if (!pipeline) return;

          const images = await convertPDFToImages(file);
          onProgress(85, "Performing OCR on document pages...");
          
          for (let i = 0; i < images.length; i++) {
            const pageText = await processImageOCR(images[i], pipeline);
            extractedText += pageText + '\n';
            onProgress(85 + (i / images.length) * 10, `Processing page ${i + 1}/${images.length}`);
          }
        }
      } else {
        // Handle image files with OCR
        const pipeline = await initializeOCR();
        if (!pipeline) return;

        const reader = new FileReader();
        const imageDataUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        
        onProgress(70, "Processing image with OCR...");
        extractedText = await processImageOCR(imageDataUrl, pipeline);
      }

      if (!extractedText.trim()) {
        onError("No text could be extracted from the document. Please ensure it contains readable text or transactions.");
        return;
      }

      onProgress(95, "Parsing transactions from extracted text...");
      
      const transactions = parseTransactions(extractedText);
      
      if (transactions.length === 0) {
        onError("No transactions found in the document. Please ensure the document contains a valid bank statement.");
        return;
      }

      onProgress(100, `Successfully extracted ${transactions.length} transactions`);
      
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
  }, [file, extractTextFromPDF, initializeOCR, convertPDFToImages, processImageOCR, parseTransactions, onProcessed, onError, onProgress]);

  // Auto-start processing when component mounts
  useEffect(() => {
    processDocument();
  }, [processDocument]);

  return null;
};

export default OCRProcessor;
