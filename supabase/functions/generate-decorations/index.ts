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
    const { event } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert event decorator. Generate detailed, practical decoration suggestions with specific purchase locations.`;

    const userPrompt = `Generate detailed decoration suggestions for:

Event Name: ${event.name}
Event Type: ${event.event_type}
Theme: ${event.theme_preferences || 'Not specified'}
Color Theme: ${event.color_theme || 'Not specified'}
Location: ${event.location_name || event.country}
Venue: ${event.venue_recommendation || 'Not specified'}
Estimated Guests: ${event.estimated_guests || 'N/A'}

Organize decorations into 3 categories with AI-generated creative titles:
1. Core decorations (essential items for this event type)
2. Venue-specific decorations (items specific to the venue style)
3. Extra decorations (nice-to-have enhancements)

For each category:
- Generate a creative, catchy category title related to the event theme
- Write a detailed 2-3 paragraph description about what decorations to include and why
- Provide 4-6 REAL purchase links to actual stores that operate near ${event.location_name || event.country} or reputable online stores that ship internationally
- Each link should include: real store name, working URL, and specific items to purchase there

Return ONLY valid JSON in this exact structure:
{
  "decorations": [
    {
      "category": "Creative Category Title",
      "content": "Detailed 2-3 paragraph description about decorations to include, placement ideas, and styling tips...",
      "purchase_links": [
        {"name": "Real Store Name", "url": "https://realstore.com", "description": "Specific items to buy here"},
        {"name": "Store Name 2", "url": "https://store2.com", "description": "What to buy here"}
      ]
    }
  ]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      throw new Error(`AI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid JSON response from AI');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating decorations:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        decorations: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
