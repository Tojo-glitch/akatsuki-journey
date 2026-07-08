// ================================================================
// SUPABASE EDGE FUNCTION: SECURE ANALYZE CHART IMAGE VIA GOOGLE GEMINI
// ================================================================

// ป้องกันตัวแปรขีดขอบแดงใน VS Code
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response>): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-token",
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 🌟 [อุดช่องโหว่ความปลอดภัย]: ตรวจเช็คสิทธิ์ผู้ยิงผ่าน Token เสมอก่อนอนุญาตให้ดึงข้อมูล Gemini API
    const sessionToken = req.headers.get("x-session-token")
    if (!sessionToken) {
      return new Response(JSON.stringify({ error: "Unauthorized: Missing active system verification token header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    const { image_url } = await req.json()
    if (!image_url) {
      return new Response(JSON.stringify({ error: "Missing source image_url parameter" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY")
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: "Server missing Google GEMINI_API_KEY secret" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    const imageResponse = await fetch(image_url)
    const imageBlob = await imageResponse.arrayBuffer()
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg"
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(imageBlob)))

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an expert trading journal OCR assistant. Analyze this screenshot from TradingView or cTrader/MT4/MT5 and extract key trading parameters.
                Output strictly a flat JSON object matching the following schema. Use EXACT spelling.
                {
                  "pair": "XAUUSD or asset name",
                  "direction": "Buy or Sell or null",
                  "entry_price": "numeric value as string or null",
                  "stop_loss": "numeric value as string or null",
                  "target_price": "numeric value as string or null"
                }
                Do not write any commentary, markdowns, or backticks outside of the JSON. If unsure, leave fields null.`
              },
              {
                inlineData: { mimeType: contentType, data: base64Data }
              }
            ]
          }
        ],
        generationConfig: { responseMimeType: "application/json" }
      })
    })

    const aiRes = await response.json()
    
    // 🌟 [อุดช่องโหว่]: ดักจับความเสียหายเมื่อคลาวด์วิเคราะห์พัง เพื่อไม่ให้ตัวแอปเบราว์เซอร์แครชหลุดพังยับเยิน
    const firstCandidateText = aiRes?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!firstCandidateText) {
      return new Response(JSON.stringify({ 
        pair: null, direction: null, entry_price: null, stop_loss: null, target_price: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    return new Response(firstCandidateText, {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})