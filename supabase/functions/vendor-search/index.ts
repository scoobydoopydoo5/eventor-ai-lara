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
    const { eventType, location, state, country, budget, guests, searchQuery } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const locationStr = [location, state, country].filter(Boolean).join(', ');
    
    const prompt = `You are a professional event planning assistant. Find and recommend real vendors and services for the following event:

Event Type: ${eventType}
Location: ${locationStr}
Budget: $${budget || 'flexible'}
Expected Guests: ${guests || 'TBD'}
${searchQuery ? `Specific Search: ${searchQuery}` : ''}

Please recommend 9-12 diverse vendors across these categories:
1. Venues (actual event spaces in the area)
2. Catering/Food Services
3. Photography/Videography
4. Entertainment/DJ
5. Decorations/Florists
6. Transportation/Logistics
${eventType === 'wedding' ? '7. Wedding Planners\n8. Dress/Attire' : ''}
${eventType === 'corporate' ? '7. AV/Tech Services\n8. Team Building Activities' : ''}

For each vendor, provide REAL, RESEARCHED information:
- Real business names (not generic)
- Accurate descriptions of their services
- Realistic price ranges for this location
- Real ratings if available (or estimate based on typical market standards)
- Current availability status (generally available, seasonal, book in advance, etc.)

Format your response as JSON with this structure:
{
  "vendors": [
    {
      "id": "unique-id",
      "name": "Business Name",
      "category": "category",
      "description": "detailed service description",
      "price": "$X,XXX - $X,XXX" or "$$$ per hour",
      "rating": "4.5/5" or "Highly Rated",
      "availability": "availability status",
      "link": "website or booking link if known",
      "image_url": "relevant image search query for this vendor"
    }
  ]
}

Important: Base recommendations on real market data for ${locationStr}. Use actual business names and realistic pricing for that location.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a professional event planning assistant with extensive knowledge of vendors, services, and pricing across different locations. Always provide realistic, location-specific recommendations based on actual market research."
          },
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    let result = data.choices[0].message.content.trim();
    
    // Parse JSON response
    try {
      const parsedResult = JSON.parse(result);
      
      // Add unique IDs if not present
      if (parsedResult.vendors) {
        parsedResult.vendors = parsedResult.vendors.map((vendor: any, index: number) => ({
          ...vendor,
          id: vendor.id || `vendor-${Date.now()}-${index}`
        }));
      }
      
      return new Response(JSON.stringify(parsedResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (parseError) {
      console.error("Failed to parse AI response:", result);
      throw new Error("Failed to parse vendor recommendations");
    }
  } catch (error) {
    console.error("Error in vendor-search:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      vendors: []
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
