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
    const { type, text, mode, language, characterLimit, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let prompt = "";
    const body: any = {
      model: "google/gemini-2.5-flash",
      messages: [],
    };

    if (type === "generate") {
      const modeInstructions = {
        formal: "Write in a formal, professional tone suitable for corporate events.",
        informal: "Write in a casual, relaxed tone for friends and family.",
        friendly: "Write in a warm, friendly tone that's welcoming and enthusiastic.",
        crazy: "Write in a fun, energetic, and slightly wild tone with emojis and excitement!",
        "semi-formal": "Write in a balanced tone that's professional yet approachable."
      };

      prompt = `Generate an invitation ${text} for an event. ${context || ''}
      
Tone: ${modeInstructions[mode as keyof typeof modeInstructions] || modeInstructions.friendly}
${characterLimit ? `Character limit: ${characterLimit} characters` : ''}

Return ONLY the message content, nothing else.`;
      
      body.messages.push({ role: "user", content: prompt });
    } else if (type === "paraphrase") {
      prompt = `Paraphrase the following invitation text while maintaining its meaning and tone:

"${text}"

${characterLimit ? `Keep it under ${characterLimit} characters.` : ''}
Return ONLY the paraphrased text, nothing else.`;
      
      body.messages.push({ role: "user", content: prompt });
    } else if (type === "translate") {
      prompt = `Translate the following invitation text to ${language}:

"${text}"

Return ONLY the translated text, nothing else.`;
      
      body.messages.push({ role: "user", content: prompt });
    } else if (type === "feedback") {
      prompt = `Provide constructive feedback on this invitation text:

"${text}"

Consider: tone, clarity, engagement, grammar, and overall effectiveness. Format as bullet points.`;
      
      body.messages.push({ role: "user", content: prompt });
    } else if (type === "custom") {
      prompt = `${context}

Current invitation text: "${text}"

Generate a new invitation based on the prompt above.`;
      
      body.messages.push({ role: "user", content: prompt });
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
    const result = data.choices[0].message.content.trim();

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in invite-ai:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
