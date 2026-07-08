// ================================================================
// SUPABASE EDGE FUNCTION: ANALYZE CHART IMAGE VIA GOOGLE GEMINI (NATIVE ENGINE)
// ================================================================

// บอกใบ้ให้ตัวแปลภาษา VS Code ยุติการแจ้งเตือนขีดเส้นแดงตัวแปร Deno
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response>): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req: Request): Promise<Response> => {
  // บล็อกการตรวจจับสิทธิ์จากเบราว์เซอร์ต้นทาง
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    // ดึงข้อมูลภาพและแปลงสภาพเป็น Base64
    const imageResponse = await fetch(image_url)
    const imageBlob = await imageResponse.arrayBuffer()
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg"
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(imageBlob)))

    // เชื่อมต่อเข้าเกตเวย์โมเดลสแกนเนื้อหา Gemini 1.5 Flash ของกูเกิล
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
                inlineData: {
                  mimeType: contentType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    })

    const aiRes = await response.json()
    const extractedDataText = aiRes.candidates[0].content.parts[0].text

    return new Response(extractedDataText, {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})