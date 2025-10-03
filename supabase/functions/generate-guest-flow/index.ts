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
    const { eventData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `Generate a detailed guest flow journey for this event. Create 5-7 steps that cover the complete guest experience from arrival to departure.

Event Details:
- Event Type: ${eventData.event_type}
- Event Name: ${eventData.name}
- Date: ${eventData.event_date}
- Time: ${eventData.event_time || 'Not specified'}
- Estimated Guests: ${eventData.estimated_guests}
- Location: ${eventData.location_name || 'Not specified'}
- Theme: ${eventData.theme_preferences || 'Not specified'}
- Special Notes: ${eventData.special_notes || 'None'}

For each step, provide:
- title: A short descriptive title
- description: Detailed explanation of what happens in this step
- timeframe: Approximate time or duration for this step

Return ONLY a valid JSON object with this structure:
{
  "flowSteps": [
    {
      "title": "Step title",
      "description": "Step description",
      "timeframe": "Time information"
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
          { role: 'system', content: 'You are an event planning expert. Respond with valid JSON containing a "flowSteps" array.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_flow',
            description: 'Generate guest flow journey steps',
            parameters: {
              type: 'object',
              properties: {
                flowSteps: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      description: { type: 'string' },
                      timeframe: { type: 'string' }
                    },
                    required: ['title', 'description', 'timeframe']
                  }
                }
              },
              required: ['flowSteps']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_flow' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in response');
    }
    
    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-guest-flow:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
