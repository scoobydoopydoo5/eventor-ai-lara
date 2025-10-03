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
    const { prompt, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemContent = "";
    let userPrompt = "";

    if (mode === 'template') {
      systemContent = "You are an event planning expert. Generate a detailed event template based on the user's description.";
      userPrompt = `Generate an event template for: ${prompt}

Return a JSON object with all event details:
{
  "name": "string",
  "event_type": "string",
  "plan_mode": "organizer",
  "theme_preferences": "string",
  "event_date": "YYYY-MM-DD",
  "event_time": "HH:mm",
  "estimated_guests": number,
  "estimated_budget": number,
  "currency": "USD",
  "location_name": "string",
  "country": "string",
  "state": "string",
  "event_duration": number (in hours),
  "guest_age_range": "string",
  "guest_gender": "string",
  "color_theme": "vibrant|blue|green|orange|pink",
  "special_notes": "string"
}`;
    } else if (mode === 'quick') {
      systemContent = "You are an event planning expert. Generate complete event details from a brief description.";
      userPrompt = `Generate complete event details for: ${prompt}

IMPORTANT: Today's date is ${new Date().toISOString().split('T')[0]}. The event_date MUST be at least 4 days from today and MUST be after October 3rd, 2024.

Return a JSON object with all event details filled in with realistic values:
{
  "name": "string",
  "event_type": "string",
  "plan_mode": "organizer",
  "theme_preferences": "string",
  "event_date": "YYYY-MM-DD (MUST be at least 4 days from today and after 2024-10-03)",
  "event_time": "HH:mm",
  "estimated_guests": number,
  "estimated_budget": number,
  "currency": "USD",
  "location_name": "string",
  "country": "string",
  "state": "string",
  "event_duration": number (in hours),
  "guest_age_range": "string",
  "guest_gender": "string",
  "color_theme": "vibrant|blue|green|orange|pink",
  "special_notes": "string"
}`;
    } else if (mode === 'super-quick') {
      systemContent = "You are an event planning expert. Generate a complete event plan from just an event name.";
      userPrompt = `Generate complete event details for an event named: "${prompt}"

IMPORTANT: Today's date is ${new Date().toISOString().split('T')[0]}. The event_date MUST be at least 4 days from today and MUST be after October 3rd, 2024.

Infer the event type and all other details from the name. Return a JSON object:
{
  "name": "${prompt}",
  "event_type": "string (infer from name)",
  "plan_mode": "organizer",
  "theme_preferences": "string",
  "event_date": "YYYY-MM-DD (MUST be at least 4 days from today and after 2024-10-03)",
  "event_time": "HH:mm",
  "estimated_guests": number,
  "estimated_budget": number,
  "currency": "USD",
  "location_name": "string",
  "country": "string",
  "state": "string",
  "event_duration": number (in hours),
  "guest_age_range": "string",
  "guest_gender": "string",
  "color_theme": "vibrant|blue|green|orange|pink",
  "special_notes": "string"
}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: userPrompt }
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
    let generatedText = data.choices[0].message.content;
    
    generatedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const templateData = JSON.parse(generatedText);

    return new Response(JSON.stringify(templateData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-template:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
