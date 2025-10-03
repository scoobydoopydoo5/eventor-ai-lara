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
    const { text, context, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let prompt = "";
    let body: any = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are a helpful AI assistant for event planning. Be concise and creative." },
      ],
    };

    if (type === "event_name") {
      prompt = `Enhance this event name to be more creative and appealing: "${text}". Context: ${context}. Return only the enhanced name, nothing else.`;
      body.messages.push({ role: "user", content: prompt });
    } else if (type === "fill_field") {
      prompt = `Generate a ${text} for an event. Context: ${context}. Return only the value, nothing else.`;
      body.messages.push({ role: "user", content: prompt });
    } else if (type === "suggest_options") {
      prompt = `Suggest 5 ${text} options for an event. Context: ${context}. Return as JSON array of strings.`;
      body.messages.push({ role: "user", content: prompt });
    } else if (type === "event_details") {
      prompt = `Based on the following event information: ${text}. ${context}. Generate realistic values for estimated_budget (number), estimated_guests (number), and event_duration (number in hours).`;
      body.messages.push({ role: "user", content: prompt });
      body.tools = [
        {
          type: "function",
          function: {
            name: "generate_event_details",
            description: "Generate realistic event details including budget, guests, and duration",
            parameters: {
              type: "object",
              properties: {
                estimated_budget: {
                  type: "number",
                  description: "Estimated budget for the event in USD"
                },
                estimated_guests: {
                  type: "number",
                  description: "Estimated number of guests"
                },
                event_duration: {
                  type: "number",
                  description: "Event duration in hours"
                }
              },
              required: ["estimated_budget", "estimated_guests", "event_duration"],
              additionalProperties: false
            }
          }
        }
      ];
      body.tool_choice = { type: "function", function: { name: "generate_event_details" } };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (type === "event_details" && data.choices[0].message.tool_calls) {
      const toolCall = data.choices[0].message.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(args), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = data.choices[0].message.content.trim();

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-enhance:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
