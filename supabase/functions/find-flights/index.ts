import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { event, residencyCountry } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const eventDate = new Date(event.event_date);
    const oneDayBefore = new Date(eventDate);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    const twoDaysBefore = new Date(eventDate);
    twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);

    const systemPrompt = `You are a flight search expert. Find realistic flight options based on the provided information. Generate plausible flight details and booking links.`;

    const userPrompt = `Find realistic flight options from ${residencyCountry} to ${event.country || event.location_name} for an event on ${event.event_date}.

Provide flights for:
1. Two days before the event (${twoDaysBefore.toISOString().split('T')[0]})
2. One day before the event (${oneDayBefore.toISOString().split('T')[0]})
3. On the event day (${event.event_date})

For each date, provide 2-3 realistic flight options with:
- Real airline name that operates in these regions
- Realistic flight number (e.g., AA123, BA456)
- Realistic departure and arrival times in ISO format
- Real departure location (major airport in ${residencyCountry})
- Real arrival location (major airport in ${event.country || event.location_name})
- Number of stops (0, 1, or 2)
- Estimated price in USD (realistic market prices)
- Working booking link using Kayak format: https://www.kayak.com/flights/[ORIGIN]-[DEST]/[DATE]

Return ONLY valid JSON in this exact structure:
{
  "flights": [
    {
      "airline": "Real Airline Name",
      "flight_number": "AB123",
      "departure_time": "2025-01-01T10:00:00Z",
      "arrival_time": "2025-01-01T14:00:00Z",
      "departure_location": "City/Airport Code",
      "arrival_location": "City/Airport Code",
      "stops": 0,
      "price": "$500",
      "booking_link": "https://www.kayak.com/flights/XXX-YYY/2025-01-01",
      "flight_date": "2025-01-01"
    }
  ]
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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      throw new Error(`AI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid JSON response from AI');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error finding flights:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        flights: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
