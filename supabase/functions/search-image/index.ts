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
    const { query } = await req.json();
    
    console.log('Searching for image:', query);

    // Use DuckDuckGo image search API (no API key required)
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&t=lovable`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();

    // Get the first image result
    const imageUrl = data.Image || data.RelatedTopics?.[0]?.Icon?.URL || null;

    if (!imageUrl) {
      return new Response(JSON.stringify({ imageUrl: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in search-image:', error);
    return new Response(JSON.stringify({ imageUrl: null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
