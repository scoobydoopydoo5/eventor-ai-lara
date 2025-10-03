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
    const { country, eventType, eventDescription } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating location for:', { country, eventType, eventDescription });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a location expert. Given a country and event details, suggest a specific, real venue or area name that would be suitable for the event. Return ONLY the location name, nothing else. Be specific - include venue name or area name, not just the country.'
          },
          {
            role: 'user',
            content: `Country: ${country}\nEvent Type: ${eventType}\nDescription: ${eventDescription}\n\nSuggest a specific venue or area name in ${country} that would be perfect for this event. Return only the location name.`
          }
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('AI gateway error:', response.status, text);
      throw new Error('Failed to generate location');
    }

    const data = await response.json();
    const location_name = data.choices?.[0]?.message?.content?.trim();

    if (!location_name) {
      throw new Error('No location generated');
    }

    console.log('Generated location:', location_name);

    return new Response(JSON.stringify({ location_name }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-location:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      location_name: null 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
