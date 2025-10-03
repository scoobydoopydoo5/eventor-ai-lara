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
    const { eventType, guests, budget, theme } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Suggest 8-12 swag bag/souvenir items for this event:

Event Type: ${eventType}
Expected Guests: ${guests || 'TBD'}
Budget per bag: $${budget || 'flexible'}
Theme: ${theme || 'none'}

For each item, provide:
- name: Item name
- description: What it is
- quantity: How many per bag
- estimatedCost: Cost per item
- sourceType: DIY or Buy
- reason: Why this is suitable (based on event type, budget, theme)
- diyComplexity: If DIY, how complex (Easy/Medium/Hard)

Format as JSON:
{
  "items": [
    {
      "id": "unique-id",
      "name": "Item Name",
      "description": "Description",
      "quantity": "X per bag",
      "estimatedCost": "$X",
      "sourceType": "DIY",
      "reason": "Why this suits the event",
      "diyComplexity": "Easy"
    }
  ],
  "recommendation": "Overall recommendation: DIY or Buy, and why"
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
          { role: "system", content: "You are a professional event souvenir and swag bag expert." },
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
    console.error("Error in souvenir-suggestions:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      items: []
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
