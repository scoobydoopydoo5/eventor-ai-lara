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

    const totalBudget = eventData.estimated_budget;
    
    // Calculate ideal budget ranges
    const idealMin = totalBudget * 0.9;
    const idealMax = totalBudget * 1.1;
    
    // Determine budget strategy based on total budget
    let budgetStrategy = 'ideal';
    let targetTotal = totalBudget;
    
    if (totalBudget < idealMin) {
      budgetStrategy = 'minimum';
      targetTotal = idealMin;
    } else if (totalBudget > idealMax) {
      budgetStrategy = 'extras';
      targetTotal = idealMax;
    }

    const prompt = `Generate a comprehensive and realistic event budget based on the following data:
Event Name: ${eventData.name}
Event Type: ${eventData.event_type}
Date: ${eventData.event_date}
Location: ${eventData.location_name || eventData.country}
Estimated Guests: ${eventData.estimated_guests}
Total Budget: ${totalBudget} ${eventData.currency || 'USD'}
Target Budget Strategy: ${budgetStrategy}
Target Total: ${targetTotal} ${eventData.currency || 'USD'}
Event Duration: ${eventData.event_duration} hours
Theme: ${eventData.theme_preferences || 'Standard'}
Special Notes: ${eventData.special_notes || 'None'}

IMPORTANT: Generate budget items that sum up to approximately ${targetTotal} ${eventData.currency || 'USD'}.
${budgetStrategy === 'minimum' ? 'Focus on essential items only, minimizing costs where possible.' : ''}
${budgetStrategy === 'extras' ? 'Include premium options and extra services to utilize the higher budget.' : ''}
${budgetStrategy === 'ideal' ? 'Provide a balanced budget with quality items and services.' : ''}

Generate a detailed budget breakdown with 15-25 realistic line items covering all aspects of the event. Include:
- Venue costs (rental, setup, cleanup)
- Catering (food, drinks, service staff, rentals)
- Decorations and ambiance (flowers, lighting, centerpieces)
- Entertainment (DJ, band, performers)
- Photography/Videography
- Invitations and stationery
- Transportation and parking
- Staffing costs
- Equipment rentals
- Miscellaneous and contingency

For each item provide:
- item_name: Specific name
- category: One of (venue, catering, decorations, entertainment, photography, invitations, transportation, staffing, equipment, miscellaneous)
- estimated_cost: Realistic cost per unit
- quantity: Number of units needed
- notes: Brief explanation or details

Also calculate and return:
- total_estimated: Sum of all estimated costs (should be close to ${targetTotal})
- min_budget: Conservative minimum (90% of total)
- max_budget: Maximum with contingency (110% of total)
- average_budget: Average expected (total_estimated)
- recommended_savings: 10-15% buffer for unexpected costs
- extras_budget: Budget for optional add-ons (5% of total)

Format as JSON:
{
  "budget_items": [{"item_name": "string", "category": "string", "estimated_cost": number, "quantity": number, "notes": "string"}],
  "summary": {
    "total_estimated": number,
    "min_budget": number,
    "max_budget": number,
    "average_budget": number,
    "recommended_savings": number,
    "extras_budget": number
  }
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
          { role: "system", content: "You are an expert event budget planner. Generate detailed, realistic budget breakdowns in valid JSON format. Always respond with properly formatted JSON only." },
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
    
    const budgetData = JSON.parse(generatedText);

    return new Response(JSON.stringify(budgetData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-budget:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
