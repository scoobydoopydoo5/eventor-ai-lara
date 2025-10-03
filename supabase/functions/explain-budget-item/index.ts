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
    const { item, eventData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Provide a detailed explanation for this budget item:

Item: ${item.item_name}
Category: ${item.category}
Cost: ${item.estimated_cost} ${eventData.currency || 'USD'} × ${item.quantity}
Total: ${item.estimated_cost * item.quantity} ${eventData.currency || 'USD'}
Notes: ${item.notes || 'None'}

Event Context:
- Event Type: ${eventData.event_type}
- Guests: ${eventData.estimated_guests}
- Location: ${eventData.location_name || eventData.country}
- Theme: ${eventData.theme_preferences || 'Standard'}

Provide:
1. explanation: 2-3 paragraphs explaining why this item is important, what it covers, typical cost ranges, and factors affecting the price
2. breakdown: Array of sub-items or cost factors (e.g., ["Labor: 40%", "Materials: 35%", "Service fee: 15%", "Tax: 10%"])
3. tips: 2-3 money-saving tips or considerations
4. sources: Array of 2-3 realistic web sources for pricing verification (use actual industry websites, not made-up URLs)

Format as JSON:
{
  "explanation": "string",
  "breakdown": ["string"],
  "tips": ["string"],
  "sources": [{"title": "string", "url": "string"}]
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
          { role: "system", content: "You are an event planning expert. Provide detailed explanations with realistic industry sources. Always respond with valid JSON." },
          { role: "user", content: prompt }
        ],
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let generatedText = data.choices[0].message.content;
    
    generatedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const explanationData = JSON.parse(generatedText);

    return new Response(JSON.stringify(explanationData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in explain-budget-item:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
