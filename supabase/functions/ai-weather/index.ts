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
    const { country, city, location, eventDate, eventTime } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `Provide a weather forecast for ${location || city}, ${country} on ${eventDate} at ${eventTime}. 
    Include:
    - Temperature range (high and low in Celsius and Fahrenheit)
    - Weather conditions (sunny, cloudy, rainy, etc.)
    - Precipitation probability
    - Wind speed
    - Humidity
    - UV index
    - Any weather warnings or alerts
    - Recommendations for outdoor event planning
    
    Format the response as a detailed but concise weather report.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a weather forecasting assistant. Provide accurate, detailed weather forecasts.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('AI gateway error:', response.status, text);
      throw new Error('Failed to get weather forecast');
    }

    const data = await response.json();
    const forecast = data.choices[0].message.content;

    return new Response(JSON.stringify({ forecast }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-weather function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
