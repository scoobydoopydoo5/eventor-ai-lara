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

    const prompt = `Create a comprehensive guest handbook for this event:

Event Details:
- Event Type: ${eventData.event_type}
- Event Name: ${eventData.name}
- Date: ${eventData.event_date}
- Time: ${eventData.event_time || 'Not specified'}
- Location: ${eventData.location_name || 'Not specified'}
- Estimated Guests: ${eventData.estimated_guests}
- Duration: ${eventData.event_duration} hours
- Theme: ${eventData.theme_preferences || 'Not specified'}
- Special Notes: ${eventData.special_notes || 'None'}

Create a detailed handbook including:
1. Welcome message
2. Event schedule overview
3. Venue information and directions
4. What to bring/not bring
5. Parking and transportation
6. Contact information
7. Emergency procedures
8. FAQs
9. Tips for enjoying the event

Make it warm, informative, and helpful.

Return ONLY a valid JSON object:
{
  "handbook": "<formatted handbook text>"
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
          { role: 'system', content: 'You are an event planning expert. Respond with valid JSON containing a "handbook" field with formatted guest handbook text.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_handbook',
            description: 'Generate guest handbook',
            parameters: {
              type: 'object',
              properties: {
                handbook: {
                  type: 'string',
                  description: 'Formatted guest handbook text'
                }
              },
              required: ['handbook']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_handbook' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error response:', errorText);
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
    console.error('Error in generate-guest-handbook:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
