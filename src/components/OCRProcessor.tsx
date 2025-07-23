
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OCRProcessorProps {
  file: File;
  onProcessed: (transactions: any) => void;
  onError: (error: string) => void;
  onProgress: (progress: number, status: string) => void;
}

const OCRProcessor = ({ file, onProcessed, onError, onProgress }: OCRProcessorProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const hasProcessed = useRef(false);
  const processingTimeout = useRef<NodeJS.Timeout>();

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

  const generateFileHash = useCallback(async (fileData: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(fileData);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }, []);

  const processWithDummyData = useCallback(async (fileName: string, fileSize: number) => {
    try {
      onProgress(40, "Simulating OCR processing...");
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onProgress(80, "Generating dummy transaction data...");
      
      // Generate realistic dummy bank transaction data
      const dummyTransactions = [
        { date: "2024-01-15", description: "SALARY DEPOSIT - TECH CORP", amount: 5500.00, balance: 8750.50, type: "credit" },
        { date: "2024-01-16", description: "RENT PAYMENT - DOWNTOWN APTS", amount: -1800.00, balance: 6950.50, type: "debit" },
        { date: "2024-01-17", description: "GROCERY STORE - WHOLE FOODS", amount: -125.75, balance: 6824.75, type: "debit" },
        { date: "2024-01-18", description: "COFFEE SHOP - STARBUCKS", amount: -8.50, balance: 6816.25, type: "debit" },
        { date: "2024-01-19", description: "GAS STATION - SHELL", amount: -45.20, balance: 6771.05, type: "debit" },
        { date: "2024-01-20", description: "RESTAURANT - OLIVE GARDEN", amount: -67.85, balance: 6703.20, type: "debit" },
        { date: "2024-01-22", description: "NETFLIX SUBSCRIPTION", amount: -15.99, balance: 6687.21, type: "debit" },
        { date: "2024-01-23", description: "UBER RIDE", amount: -23.45, balance: 6663.76, type: "debit" },
        { date: "2024-01-24", description: "PHARMACY - CVS", amount: -34.50, balance: 6629.26, type: "debit" },
        { date: "2024-01-25", description: "AMAZON PURCHASE", amount: -89.99, balance: 6539.27, type: "debit" },
        { date: "2024-01-26", description: "FREELANCE PAYMENT - CLIENT ABC", amount: 850.00, balance: 7389.27, type: "credit" },
        { date: "2024-01-27", description: "ELECTRIC BILL - UTILITY CO", amount: -145.30, balance: 7243.97, type: "debit" },
        { date: "2024-01-28", description: "SPOTIFY PREMIUM", amount: -9.99, balance: 7233.98, type: "debit" },
        { date: "2024-01-29", description: "OFFICE SUPPLIES - STAPLES", amount: -78.45, balance: 7155.53, type: "debit" },
        { date: "2024-01-30", description: "MOBILE PHONE BILL", amount: -85.00, balance: 7070.53, type: "debit" }
      ];

      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        excelData: {
          sheets: [{
            name: 'Transactions',
            headers: ['Date', 'Description', 'Amount', 'Balance', 'Type', 'Category', 'Notes'],
            data: dummyTransactions.map(t => [
              t.date, 
              t.description, 
              t.amount, 
              t.balance, 
              t.type,
              '', // Category will be filled during analysis
              '' // Notes for user
            ])
          }],
          metadata: {
            totalTransactions: dummyTransactions.length,
            dateRange: { 
              start: "2024-01-15", 
              end: "2024-01-30"
            },
            accountInfo: {
              accountNumber: '****1234',
              bankName: 'Demo Bank',
              accountType: 'Checking'
            }
          }
        }
      };
    } catch (error) {
      console.error('Dummy processing error:', error);
      throw error;
    }
  }, [onProgress]);

  const processDocument = useCallback(async () => {
    if (isProcessing || hasProcessed.current) return;
    
    setIsProcessing(true);
    hasProcessed.current = true;
    
    // Set timeout for processing (5 minutes)
    processingTimeout.current = setTimeout(() => {
      onError('Processing timeout - please try again');
      setIsProcessing(false);
    }, 300000); // 5 minutes
    
    try {
      onProgress(5, "Starting document processing...");
      
      // Simulate file preparation
      onProgress(20, "Preparing document...");
      
      // Process with dummy data instead of API
      const processedData = await processWithDummyData(file.name, file.size);
      
      if (!processedData.success) {
        throw new Error('Processing failed');
      }

      onProgress(90, "Finalizing results...");
      
      // Transform response to match expected format  
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
        },
        sheets: processedData.excelData.sheets
      };

      onProgress(100, `Successfully processed ${finalData.transactions.length} transactions`);
      
      // Clear timeout on success
      if (processingTimeout.current) {
        clearTimeout(processingTimeout.current);
      }
      
      onProcessed(finalData);

    } catch (error) {
      console.error('Document processing error:', error);
      
      // Clear timeout on error
      if (processingTimeout.current) {
        clearTimeout(processingTimeout.current);
      }
      
      onError(`Processing failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [file, processWithDummyData, onProcessed, onError, onProgress]);

  // Auto-start processing when component mounts
  useEffect(() => {
    if (!hasProcessed.current) {
      processDocument();
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (processingTimeout.current) {
        clearTimeout(processingTimeout.current);
      }
    };
  }, [processDocument]);

  return null;
};

export default OCRProcessor;
