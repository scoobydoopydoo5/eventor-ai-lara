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
    const { messages, eventData, chatType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompts = {
      general: `You are Evento, a helpful AI assistant for event planning. You have access to the following event data:
Event: ${eventData?.name || 'Unknown'}
Type: ${eventData?.event_type || 'Unknown'}
Date: ${eventData?.event_date || 'Not set'}
Location: ${eventData?.location_name || 'Not set'}
Budget: ${eventData?.estimated_budget || 'Not set'} ${eventData?.currency || ''}
Guests: ${eventData?.estimated_guests || 'Not specified'}
Description: ${eventData?.description || 'No description'}

Help users plan and manage this event effectively. Format your responses with proper markdown including headings (##), bullet points (-), **bold**, and *italic* text for clarity.`,
      
      budget: `You are Evento, an expert budget advisor for events. Focus on helping with financial planning:
Event: ${eventData?.name || 'Unknown'}
Budget: ${eventData?.estimated_budget || 'Not set'} ${eventData?.currency || ''}
Type: ${eventData?.event_type || 'Unknown'}

Provide detailed budget advice, cost breakdowns, and money-saving tips. Use markdown formatting with ## headings, - bullet points, **bold** for important figures, and tables when appropriate.`,
      
      venue: `You are Evento, a venue and logistics specialist. Help with location and setup:
Event: ${eventData?.name || 'Unknown'}
Location: ${eventData?.location_name || 'Not set'}
Type: ${eventData?.event_type || 'Unknown'}
Guests: ${eventData?.estimated_guests || 'Not specified'}

Provide venue recommendations, setup suggestions, and logistics advice. Format responses with ## headings, - bullet points, and **bold** key points.`,
      
      timeline: `You are Evento, a timeline and scheduling expert. Help organize event schedules:
Event: ${eventData?.name || 'Unknown'}
Date: ${eventData?.event_date || 'Not set'}
Type: ${eventData?.event_type || 'Unknown'}

Create detailed timelines, task schedules, and countdown plans. Use ## headings, - checklists, and **bold** deadlines.`,
      
      plan: `You are Evento, a comprehensive event planning consultant. Help with overall strategy:
Event: ${eventData?.name || 'Unknown'}
All Details: ${JSON.stringify(eventData, null, 2)}

Provide strategic planning advice covering all aspects. Use rich markdown formatting with ## headings, ### subheadings, - lists, **bold** emphasis, and > blockquotes for tips.`
    };

    const systemPrompt = systemPrompts[chatType as keyof typeof systemPrompts] || systemPrompts.general;

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
          ...messages
        ],
        stream: true
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
      throw new Error(`Failed to generate response: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Error in event-chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});