
import { useState, useCallback, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '@/integrations/supabase/client';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface OCRProcessorProps {
  file: File;
  onProcessed: (transactions: any) => void;
  onError: (error: string) => void;
  onProgress: (progress: number, status: string) => void;
}

const OCRProcessor = ({ file, onProcessed, onError, onProgress }: OCRProcessorProps) => {
  const extractTextFromPDF = useCallback(async (file: File): Promise<string> => {
    try {
      const fileArrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: fileArrayBuffer }).promise;
      let fullText = '';

      onProgress(20, "Extracting text from PDF...");

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
        
        onProgress(20 + (pageNum / pdf.numPages) * 30, `Extracting text from page ${pageNum}/${pdf.numPages}`);
      }

      return fullText;
    } catch (error) {
      console.error('PDF text extraction failed:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }, [onProgress]);

  const convertFileToBase64 = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 string
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, []);

  const processWithMistral = useCallback(async (fileData: string, fileName: string, fileSize: number) => {
    try {
      onProgress(60, "Processing with Mistral Vision API...");
      
      // Get current session for authentication (optional)
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('process-statement', {
        body: {
          fileName,
          fileData,
          fileSize
        },
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {}
      });

      if (error) {
        console.error('Mistral processing error:', error);
        throw new Error(error.message || 'Failed to process with Mistral API');
      }

      if (!data.success) {
        throw new Error(data.details || 'Processing failed');
      }

      return data;
    } catch (error) {
      console.error('Mistral API error:', error);
      throw error;
    }
  }, [onProgress]);

  const processDocument = useCallback(async () => {
    try {
      onProgress(5, "Starting document processing...");
      
      let shouldUseMistral = false;
      let extractedText = '';

      // For PDFs, try text extraction first
      if (file.type === 'application/pdf') {
        try {
          extractedText = await extractTextFromPDF(file);
          onProgress(50, "Text extracted from PDF successfully");
          
          // Check if we got meaningful text
          if (extractedText.trim().length < 50) {
            console.log('Insufficient text extracted, falling back to Mistral OCR');
            shouldUseMistral = true;
          }
        } catch (error) {
          console.log('PDF text extraction failed, using Mistral OCR');
          shouldUseMistral = true;
        }
      } else {
        // For images, always use Mistral
        shouldUseMistral = true;
      }

      let processedData;

      if (shouldUseMistral) {
        // Convert file to base64 and process with Mistral
        onProgress(30, "Preparing file for OCR processing...");
        const fileData = await convertFileToBase64(file);
        
        processedData = await processWithMistral(fileData, file.name, file.size);
        onProgress(90, "OCR processing complete");
      } else {
        // Use extracted text and create mock processed data for client-side processing
        onProgress(60, "Parsing transactions from extracted text...");
        
        // Simple transaction parsing for demo purposes
        const lines = extractedText.split('\n').filter(line => line.trim());
        const transactions = [];
        
        // Basic pattern matching for transactions
        for (const line of lines) {
          const match = line.match(/(\d{1,2}\/\d{1,2}\/\d{2,4}).*?([-+]?\$?[\d,]+\.?\d*)/);
          if (match) {
            const [, dateStr, amountStr] = match;
            const amount = parseFloat(amountStr.replace(/[\$,]/g, ''));
            if (!isNaN(amount)) {
              transactions.push({
                date: new Date(dateStr).toISOString().split('T')[0],
                description: line.trim(),
                amount,
                type: amount < 0 ? 'debit' : 'credit'
              });
            }
          }
        }

        processedData = {
          success: true,
          excelData: {
            sheets: [{
              name: 'Transactions',
              headers: ['Date', 'Description', 'Amount', 'Balance', 'Type', 'Category', 'Notes'],
              data: transactions.map(t => [
                t.date, 
                t.description, 
                t.amount, 
                0, 
                t.type,
                '', 
                ''
              ])
            }],
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
            }
          }
        };
      }

      if (!processedData.success) {
        throw new Error('Processing failed');
      }

      onProgress(95, "Finalizing results...");
      
      // Transform Mistral response to match expected format
      const finalData = {
        transactions: processedData.excelData.sheets[0].data.map((row: any[]) => ({
          date: row[0],
          description: row[1],
          amount: row[2],
          balance: row[3],
          type: row[4]
        })),
        metadata: processedData.excelData.metadata,
        originalFile: {
          name: file.name,
          size: file.size,
          type: file.type
        }
      };

      onProgress(100, `Successfully processed ${finalData.transactions.length} transactions`);
      onProcessed(finalData);

    } catch (error) {
      console.error('Document processing error:', error);
      onError(`Processing failed: ${error.message}`);
    }
  }, [file, extractTextFromPDF, convertFileToBase64, processWithMistral, onProcessed, onError, onProgress]);

  // Auto-start processing when component mounts
  useEffect(() => {
    processDocument();
  }, [processDocument]);

  return null;
};

export default OCRProcessor;
