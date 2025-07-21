
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OCRProcessorProps {
  file: File;
  onProcessed: (transactions: any) => void;
  onError: (error: string) => void;
  onProgress: (progress: number, status: string) => void;
}

const OCRProcessor = ({ file, onProcessed, onError, onProgress }: OCRProcessorProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

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

  const processWithAPI = useCallback(async (fileData: string, fileName: string, fileSize: number) => {
    try {
      onProgress(60, "Processing document with AI...");
      
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
        console.error('Processing error:', error);
        throw new Error(error.message || 'Failed to process document');
      }

      if (!data.success) {
        throw new Error(data.details || 'Processing failed');
      }

      return data;
    } catch (error) {
      console.error('API processing error:', error);
      throw error;
    }
  }, [onProgress]);

  const processDocument = useCallback(async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      onProgress(5, "Starting document processing...");
      
      // Convert file to base64 for processing
      onProgress(20, "Preparing document...");
      const fileData = await convertFileToBase64(file);
      
      onProgress(40, "Uploading to processing service...");
      
      // Process with API
      const processedData = await processWithAPI(fileData, file.name, file.size);
      
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
        }
      };

      onProgress(100, `Successfully processed ${finalData.transactions.length} transactions`);
      onProcessed(finalData);

    } catch (error) {
      console.error('Document processing error:', error);
      onError(`Processing failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [file, convertFileToBase64, processWithAPI, onProcessed, onError, onProgress, isProcessing]);

  // Auto-start processing when component mounts
  useEffect(() => {
    processDocument();
  }, [processDocument]);

  return null;
};

export default OCRProcessor;
