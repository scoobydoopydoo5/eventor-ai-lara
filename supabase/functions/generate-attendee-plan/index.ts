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
    const { eventData, attendeeData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `Generate a comprehensive attendee plan for someone attending this event:

Event: ${eventData.name}
Type: ${eventData.event_type}
Date: ${eventData.event_date}
Location: ${eventData.location_name || 'TBA'}
Theme: ${eventData.theme_preferences || 'None specified'}

Attendee Information:
- Name: ${attendeeData.attendee_name}
- Gender: ${attendeeData.gender || 'Not specified'}
- Outfit Style: ${attendeeData.outfit_style || 'Casual'}
- Transportation: ${attendeeData.transportation || 'Not specified'}
- Gift Budget: $${attendeeData.gift_budget || '50'}
- Dietary Restrictions: ${attendeeData.dietary_restrictions || 'None'}

Please provide realistic, practical, and detailed suggestions:

1. **Outfit Suggestions** (2-3 complete outfits):
   - Name each outfit option
   - Provide detailed description
   - List 4-6 specific clothing items for each outfit
   - Consider the event type, theme, and style preference

2. **Gift Ideas** (3-5 gift options):
   - Gift name
   - Detailed description explaining why it's appropriate
   - Realistic average price within budget
   - Where to buy it (store names or online retailers)
   - Optional: direct product link if available

3. **Preparation Checklist** (6-8 practical tasks):
   - Specific task description
   - Realistic deadline (e.g., "1 week before", "2 days before")
   - Include outfit prep, gift purchase, travel arrangements

4. **Budget Breakdown**:
   - Outfit estimated cost
   - Gift budget allocation
   - Transportation costs
   - Miscellaneous (parking, accessories, etc.)

Return as JSON:
{
  "outfit_suggestions": [
    {
      "name": "Outfit Name",
      "description": "Detailed description",
      "items": ["Item 1", "Item 2", "Item 3", "Item 4"]
    }
  ],
  "gift_ideas": [
    {
      "name": "Gift Name",
      "description": "Why this gift is perfect for the event",
      "average_price": 45.99,
      "where_to_buy": "Store or website name",
      "link": "Optional product URL"
    }
  ],
  "prep_checklist": [
    {
      "task": "Task description",
      "deadline": "Deadline description",
      "category": "outfit|gift|travel|misc"
    }
  ],
  "budget_breakdown": {
    "outfit": 150,
    "gift": 50,
    "transportation": 30,
    "misc": 20
  }
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
          { role: 'system', content: 'You are an event planning assistant. Always respond with valid JSON only, no markdown formatting.' },
          { role: 'user', content: prompt }
        ]
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
      throw new Error(`Failed to generate plan: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Clean up JSON response - remove markdown formatting if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const planData = JSON.parse(content);

    return new Response(JSON.stringify(planData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-attendee-plan:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
