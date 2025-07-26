
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

  const processWithAPI = useCallback(async (file: File) => {
    try {
      onProgress(40, "Checking for cached results...");
      
      onProgress(60, "Processing document with Advanced PDF Parser...");
      
      // Get current session for authentication (optional)
      const { data: { session } } = await supabase.auth.getSession();
      
      // Send PDF as raw bytes for better reliability
      const response = await fetch(`https://vimdhqgjbwlesiacqudg.supabase.co/functions/v1/process-pdf-free`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/pdf',
          'x-file-name': file.name,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbWRocWdqYndsZXNpYWNxdWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNzg3MDUsImV4cCI6MjA2ODY1NDcwNX0.B9cNspGa_sMJxNvI5Coqwtp9YCUSge4Ay-5p9WC08Nw',
          ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: file // Send raw file blob
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

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
      
      // Process with API directly using file
      const processedData = await processWithAPI(file);
      
      if (!processedData.success) {
        throw new Error('Processing failed');
      }

      if (processedData.fromCache) {
        onProgress(100, "Retrieved from cache - instant results!");
      } else {
        onProgress(90, "Finalizing results...");
      }
      
      // Transform response to match expected format
      const finalData = {
        transactions: processedData.excel_data?.transactions || [],
        account_info: processedData.excel_data?.account_info || {},
        summary: processedData.excel_data?.summary || {},
        date_range: processedData.excel_data?.date_range || {},
        metadata: processedData.excel_data || {},
        originalFile: {
          name: file.name,
          size: file.size,
          type: file.type
        }
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
  }, [file, processWithAPI, onProcessed, onError, onProgress]);

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
