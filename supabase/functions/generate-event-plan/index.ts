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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

const prompt = `Generate a comprehensive event plan based on the following data:
Event Name: ${eventData.name || 'Generate creative name'}
Event Type: ${eventData.event_type || 'Generate appropriate type'}
Plan Mode: ${eventData.plan_mode}
Theme: ${eventData.theme_preferences || 'Generate based on event type'}
Date: ${eventData.event_date ? new Date(eventData.event_date).toISOString().split('T')[0] : 'MUST be at least 4 days from today and after 2024-10-03'}
Location: ${eventData.location_name || eventData.country || 'Suggest venue'}
Estimated Guests: ${eventData.estimated_guests || 'Suggest appropriate number'}
Budget: ${eventData.estimated_budget || 'Generate realistic budget'} ${eventData.currency || 'USD'}
Guest Demographics: Age ${eventData.guest_age_range || 'all ages'}, Gender ${eventData.guest_gender || 'all'}
Duration: ${eventData.event_duration || 'Suggest duration'} hours
Weather: ${eventData.weather_data ? JSON.stringify(eventData.weather_data) : 'Consider seasonal weather'}
Special Notes: ${eventData.special_notes || 'None'}

IMPORTANT: All dates (tasks start_date, due_date, timeline event_time) MUST be AFTER 2024-10-03. If no specific event date is given, generate one at least 4 days from today that is after October 3rd, 2024.

Generate a detailed response with:
1. Enhanced event name and description
2. Venue recommendation (indoor/outdoor, virtual/physical with reasons)
3. 8-12 specific tasks with titles, descriptions, categories, priorities (high/medium/low), start dates, and due dates
4. Detailed budget breakdown with 10-15 line items including item names, categories, estimated costs, quantities
5. Short and long invitation messages
6. Timeline with 15-20 events covering 2 days before to event day, with specific times, types (setup/main/cleanup/preparation), and durations

Format as JSON with this structure:
{
  "event": {
    "name": "string",
    "description": "string",
    "venue_recommendation": "string",
    "venue_type": "indoor|outdoor",
    "event_format": "physical|virtual|hybrid"
  },
  "tasks": [{"title": "string", "description": "string", "category": "string", "priority": "high|medium|low", "start_date": "YYYY-MM-DD", "due_date": "YYYY-MM-DD"}],
  "budget": [{"item_name": "string", "category": "string", "estimated_cost": number, "quantity": number, "notes": "string"}],
  "invites": {
    "short_message": "string",
    "long_message": "string",
    "email_template": "string"
  },
  "timeline": [{"title": "string", "event_type": "setup|main|cleanup|preparation", "event_time": "YYYY-MM-DDTHH:mm:ss", "duration_minutes": number, "description": "string"}]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert event planner. Generate detailed, realistic event plans in valid JSON format. Always respond with properly formatted JSON only." },
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
    let generatedText = data.choices[0].message.content;
    
    // Clean up JSON response
    generatedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const planData = JSON.parse(generatedText);

    return new Response(JSON.stringify(planData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-event-plan:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
