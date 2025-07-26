import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Request content-type:', req.headers.get("content-type"));
    
    // Grab all incoming bytes
    const raw = await req.arrayBuffer();
    console.log("Raw body length:", raw.byteLength);
    
    if (raw.byteLength === 0) {
      return new Response(JSON.stringify({ error: "Empty request body" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const pdfBytes = new Uint8Array(raw);
    const filename = req.headers.get("x-file-name") || "upload.pdf";
    
    console.log(`Processing ${filename} (${pdfBytes.length} bytes)`);

    // Call Mistral OCR via HTTP
    let ocrText: string;
    try {
      const apiKey = Deno.env.get("MISTRAL_API_KEY");
      if (!apiKey) {
        throw new Error("Missing Mistral API key");
      }

      console.log('Starting Mistral OCR...');
      
      // Base64-encode the PDF
      const b64 = btoa(String.fromCharCode(...pdfBytes));

      const resp = await fetch("https://api.aimlapi.com/v1/ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "mistral/mistral-ocr-latest",
          document: {
            type: "base64",
            data: b64,
            name: filename
          },
          pages: [],                // empty = all pages
          include_image_base64: false
        })
      });

      if (!resp.ok) {
        const err = await resp.text();
        console.error("Mistral OCR failed:", resp.status, err);
        throw new Error(`OCR error ${resp.status}: ${err}`);
      }

      const result = await resp.json();
      console.log('Mistral OCR completed');
      
      ocrText = result.pages?.map((p: any) => p.markdown || "").join("\n\n") || "";
      console.log(`OCR extracted ${ocrText.length} characters`);
      
    } catch (err) {
      console.error("OCR call error:", err);
      return new Response(
        JSON.stringify({ error: "OCR failed", details: err.message }),
        { 
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Return raw OCR text so you can confirm it's working
    return new Response(
      JSON.stringify({ 
        success: true,
        filename, 
        ocrText, 
        textLength: ocrText.length,
        message: "OCR completed - ready to add parsing logic"
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Handler error:', error);
    return new Response(JSON.stringify({ 
      error: 'Request processing failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});