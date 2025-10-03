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
    const { eventData, totalEstimated, totalActual } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const totalBudget = eventData.estimated_budget;
    const difference = totalBudget - totalEstimated;
    const percentDiff = (difference / totalBudget) * 100;

    const prompt = `Analyze this event budget and provide feedback:

Event: ${eventData.name} (${eventData.event_type})
Guests: ${eventData.estimated_guests}
Location: ${eventData.location_name || eventData.country}
Total Budget: ${totalBudget} ${eventData.currency || 'USD'}
Total Estimated Cost: ${totalEstimated} ${eventData.currency || 'USD'}
${totalActual > 0 ? `Total Actual Spent: ${totalActual} ${eventData.currency || 'USD'}` : ''}
Difference: ${difference} ${eventData.currency || 'USD'} (${percentDiff.toFixed(1)}%)

Determine if this budget is:
1. TOO_LOW: If estimated costs exceed budget significantly (>10% over) or budget is unrealistic for event scale
2. TOO_HIGH: If budget significantly exceeds estimated costs (>20% under-utilized)
3. APPROPRIATE: If budget matches estimated costs well (within reasonable range)

Provide:
- status: "TOO_LOW", "TOO_HIGH", or "APPROPRIATE"
- title: Short impactful heading
- message: 2-3 paragraph detailed analysis explaining the situation, recommendations, and considerations
- severity: "critical", "warning", or "info"

Format as JSON:
{
  "status": "string",
  "title": "string",
  "message": "string",
  "severity": "string"
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
          { role: "system", content: "You are an expert event budget analyst. Provide clear, actionable feedback in valid JSON format." },
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
    
    generatedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const feedbackData = JSON.parse(generatedText);

    return new Response(JSON.stringify(feedbackData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in budget-feedback:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
