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
    const { eventData, speechType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const speechTypePrompts = {
      intro: "an engaging opening speech to welcome guests and set the tone",
      formal: "a formal, professional speech suitable for the occasion",
      informal: "a warm, casual speech that creates a friendly atmosphere",
      outro: "a closing speech to thank guests and end the event memorably",
      thanking: "a heartfelt thank you speech expressing gratitude to attendees and contributors",
      welcoming: "a welcoming speech to make guests feel appreciated and excited",
      toast: "a celebratory toast speech for a special moment"
    };

    const prompt = `Generate ${speechTypePrompts[speechType as keyof typeof speechTypePrompts] || 'a speech'} for this event:
Event Name: ${eventData.name}
Event Type: ${eventData.event_type}
Date: ${eventData.event_date}
Location: ${eventData.location_name || eventData.country || 'our venue'}
Theme: ${eventData.theme_preferences || 'None'}
Special Notes: ${eventData.special_notes || 'None'}

Create a compelling, authentic speech (2-4 paragraphs) that:
- Captures the spirit and purpose of the event
- Is appropriate for the event type and occasion
- Includes specific details about the event
- Feels personal and genuine
- Has a clear beginning, middle, and end

Return ONLY the speech text, no JSON formatting.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a professional speechwriter. Create engaging, authentic event speeches." },
          { role: "user", content: prompt }
        ],
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
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const speechText = data.choices[0].message.content.trim();

    return new Response(JSON.stringify({ speech: speechText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-speech:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});