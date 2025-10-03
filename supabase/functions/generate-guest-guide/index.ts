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
    const { eventData, attendeeData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `Generate a comprehensive guest guide with multi-step instructions for attending this event:

Event: ${eventData.name}
Type: ${eventData.event_type}
Date: ${eventData.event_date}
Location: ${eventData.location_name || 'TBA'}

Create a step-by-step guide covering:
1. Before the event (preparation)
2. Day of event (what to do)
3. During the event (etiquette and tips)
4. After the event (follow-up)

Return as JSON with this structure:
{
  "steps": [
    {
      "title": "string",
      "description": "string",
      "tips": ["string"],
      "checklist": ["string"]
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
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('AI service requires payment. Please add credits to your workspace.');
      }
      throw new Error(`Failed to generate guide: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const guideData = JSON.parse(content);

    return new Response(JSON.stringify(guideData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-guest-guide:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
