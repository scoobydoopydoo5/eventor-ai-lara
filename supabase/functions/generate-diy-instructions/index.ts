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
    const { itemName, quantity } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Generate detailed DIY instructions for making "${itemName}" (quantity: ${quantity}).

Provide:
- materials: List of materials needed with quantities
- tools: Tools required
- steps: Step-by-step instructions (at least 6-10 steps)
- timePerItem: Time to make one
- totalTime: Total time for all ${quantity}
- difficulty: Easy/Medium/Hard
- tips: Helpful tips
- whereToBuyMaterials: Suggestions for where to buy materials

Format as JSON:
{
  "diy": {
    "name": "${itemName}",
    "materials": ["material 1 - quantity", "material 2 - quantity", ...],
    "tools": ["tool 1", "tool 2", ...],
    "steps": [
      { "stepNumber": 1, "instruction": "Detailed instruction", "time": "X minutes" },
      ...
    ],
    "timePerItem": "X minutes",
    "totalTime": "X hours",
    "difficulty": "Medium",
    "tips": ["tip 1", "tip 2", ...],
    "whereToBuyMaterials": ["store 1", "store 2", ...]
  }
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a DIY crafts expert providing detailed instructions." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content.trim());
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-diy-instructions:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
