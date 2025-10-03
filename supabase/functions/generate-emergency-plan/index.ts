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
    const { event, emergency } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert event crisis management consultant. Generate detailed, actionable emergency backup plans for events when things go wrong.

Your plans should:
- Be practical and immediately actionable
- Consider the specific event context (type, date, budget, location, guests)
- Provide multiple alternative solutions when possible
- Include specific steps and timeline
- Address both immediate fixes and long-term solutions
- Consider guest communication strategies
- Be realistic about what can be done given time constraints

Format your response with clear sections using markdown:
## Immediate Actions (0-2 hours)
## Short-term Solutions (2-24 hours)
## Alternative Options
## Guest Communication Plan
## Budget Adjustments
## Key Contacts to Reach Out To`;

    const userPrompt = `Generate an emergency Plan B for this event crisis:

**Event Details:**
- Name: ${event.name}
- Type: ${event.event_type}
- Date: ${event.event_date}
- Location: ${event.location_name || 'Not specified'}
- Expected Guests: ${event.estimated_guests || 'Not specified'}
- Budget: ${event.estimated_budget ? `${event.currency || '$'}${event.estimated_budget}` : 'Not specified'}
- Duration: ${event.event_duration ? `${event.event_duration} hours` : 'Not specified'}

**Emergency Situation:**
${emergency}

**Context:**
- Days until event: ${Math.ceil((new Date(event.event_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
- Event description: ${event.short_description || event.ai_generated_description || 'No description provided'}
- Special notes: ${event.special_notes || 'None'}

Generate a comprehensive emergency backup plan that addresses this specific crisis.`;

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
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const plan = data.choices[0].message.content;

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
