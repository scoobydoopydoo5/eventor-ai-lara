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

    const prompt = `Generate comprehensive event rules and guidelines for this event:

Event Details:
- Event Type: ${eventData.event_type}
- Event Name: ${eventData.name}
- Date: ${eventData.event_date}
- Time: ${eventData.event_time || 'Not specified'}
- Location: ${eventData.location_name || 'Not specified'}
- Estimated Guests: ${eventData.estimated_guests}
- Theme: ${eventData.theme_preferences || 'Not specified'}
- Guest Age Range: ${eventData.guest_age_range || 'All ages'}
- Special Notes: ${eventData.special_notes || 'None'}

Create detailed rules covering:
1. Dress code
2. Behavior expectations
3. Safety guidelines
4. Photography/recording policies
5. Food and beverage rules
6. Any specific rules for this event type

Format the response as clear, numbered rules with brief explanations.

Return ONLY a valid JSON object:
{
  "rules": "<formatted rules text>"
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
          { role: 'system', content: 'You are an event management expert. Respond with valid JSON containing a "rules" field with formatted event rules text.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_rules',
            description: 'Generate event rules and guidelines',
            parameters: {
              type: 'object',
              properties: {
                rules: {
                  type: 'string',
                  description: 'Formatted event rules and guidelines'
                }
              },
              required: ['rules']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_rules' } }
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
    console.error('Error in generate-event-rules:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
