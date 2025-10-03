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
    const { eventType, guests, budget, location, date, time } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Based on this event information, suggest 8-12 food options:

Event Type: ${eventType}
Expected Guests: ${guests || 'TBD'}
Budget: $${budget || 'flexible'}
Location: ${location}
Date: ${date}
Time: ${time || 'TBD'}

For each food suggestion, provide:
- name: The food name
- description: Brief description
- servingSize: How many people it serves
- estimatedCost: Cost estimate
- prepTime: Preparation time
- foodType: One of [homemade, ready-made, pre-ordered, snacks, junk, healthy]
- reason: Why this food type is suitable for this event (based on event type, budget, guest count, time)
- dietaryInfo: Vegetarian/vegan/gluten-free etc.

Format as JSON:
{
  "foods": [
    {
      "id": "unique-id",
      "name": "Food Name",
      "description": "Description",
      "servingSize": "Serves X",
      "estimatedCost": "$XX-$XX",
      "prepTime": "X hours/minutes",
      "foodType": "homemade",
      "reason": "Detailed reason why this food type suits the event",
      "dietaryInfo": "Info"
    }
  ]
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
          { role: "system", content: "You are a professional event catering advisor." },
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
    console.error("Error in food-suggestions:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      foods: []
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
