import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Generate 8-12 comprehensive FAQ items for this event:
Event Name: ${eventData.name}
Event Type: ${eventData.event_type}
Date: ${eventData.event_date}
Time: ${eventData.event_time || "TBD"}
Location: ${eventData.location_name || eventData.country || "TBD"}
Estimated Guests: ${eventData.estimated_guests || "TBD"}
Budget: ${eventData.estimated_budget || "TBD"} ${eventData.currency || "KWD"}
Theme: ${eventData.theme_preferences || "None"}
Special Notes: ${eventData.special_notes || "None"}

Generate practical, realistic FAQ items that event attendees would actually ask. Include questions about:
- Event logistics (time, location, parking, directions)
- Dress code and what to bring
- Food and beverages
- Activities and schedule
- RSVP and guest information
- Accessibility and special accommodations
- Weather contingencies (if outdoor)
- Gift policies
- Contact information

Format as JSON:
{
  "faqs": [
    {
      "question": "string",
      "answer": "string (detailed, practical answer)"
    }
  ]
}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You are an event planning expert. Generate realistic, helpful FAQ items. Always respond with valid JSON only.",
            },
            { role: "user", content: prompt },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limits exceeded, please try again later.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error:
              "Payment required, please add funds to your Lovable AI workspace.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
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

    generatedText = generatedText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const faqData = JSON.parse(generatedText);

    return new Response(JSON.stringify(faqData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-faqs:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
