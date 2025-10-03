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
    const { eventData, includePrep } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prepInstruction = includePrep 
      ? "Include 2-3 days of preparation timeline before the event day." 
      : "Focus only on the event day timeline.";

    const prompt = `Generate a detailed timeline for the following event:
Event Name: ${eventData.name}
Event Type: ${eventData.event_type}
Date: ${eventData.event_date}
Time: ${eventData.event_time || '10:00'}
Duration: ${eventData.event_duration || 4} hours
Location: ${eventData.location_name || 'TBD'}
Guests: ${eventData.estimated_guests || 50}

${prepInstruction}

Create TWO timeline views:
1. HOURLY TIMELINE: Break down each day hour by hour with specific activities
2. DAILY TIMELINE: High-level overview of what happens each day

Both timelines must be consistent and match each other.

Format as JSON with this structure:
{
  "hourlyTimeline": [
    {
      "title": "string",
      "event_type": "setup|main|cleanup|preparation",
      "event_time": "YYYY-MM-DDTHH:mm:ss",
      "duration_minutes": number,
      "description": "string"
    }
  ],
  "dailyTimeline": [
    {
      "title": "string",
      "event_type": "setup|main|cleanup|preparation",
      "event_time": "YYYY-MM-DDTHH:mm:ss",
      "duration_minutes": number,
      "description": "string (high-level summary of the day)"
    }
  ]
}

For hourly timeline: Create 15-30 specific hourly activities covering the entire event period.
For daily timeline: Create 3-7 daily summaries that encompass all hourly activities.
Ensure event_time values match between both views for the same activities.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert event planner. Generate detailed, realistic timelines in valid JSON format. Always respond with properly formatted JSON only." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
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
    
    const timelineData = JSON.parse(generatedText);

    return new Response(JSON.stringify(timelineData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-timeline:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
