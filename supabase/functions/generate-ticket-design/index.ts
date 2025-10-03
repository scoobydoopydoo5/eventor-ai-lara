import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (!eventData) {
      throw new Error('Event not found');
    }

    // Generate dynamic colors using different palettes
    const colorPalettes = [
      { bg: '#1a1a2e', text: '#ffffff', accent: '#0f3460' },
      { bg: '#f5f5dc', text: '#2c1810', accent: '#8b4513' },
      { bg: '#2d2d2d', text: '#d4af37', accent: '#1a1a1a' },
      { bg: '#ff6b6b', text: '#ffffff', accent: '#4ecdc4' },
      { bg: '#e8f5e9', text: '#2e7d32', accent: '#66bb6a' },
      { bg: '#3b82f6', text: '#ffffff', accent: '#1e40af' },
      { bg: '#ec4899', text: '#ffffff', accent: '#be185d' },
      { bg: '#10b981', text: '#ffffff', accent: '#047857' },
      { bg: '#f59e0b', text: '#ffffff', accent: '#d97706' },
      { bg: '#8b5cf6', text: '#ffffff', accent: '#6d28d9' }
    ];

    const fonts = ['Georgia', 'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana'];
    const alignments = ['center', 'left', 'right'];
    
    // Generate random selection for variety
    const randomPalette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
    const randomFont = fonts[Math.floor(Math.random() * fonts.length)];
    const randomAlignment = alignments[Math.floor(Math.random() * alignments.length)];

    const design = {
      bg_color: eventData.color_theme || randomPalette.bg,
      text_color: randomPalette.text,
      ticket_color: randomPalette.accent,
      font_family: randomFont,
      text_alignment: randomAlignment,
      ticket_text: `${eventData.name}\n\n${new Date(eventData.event_date).toLocaleDateString()}\n${eventData.event_time || ''}\n\n${eventData.location_name || 'Venue TBA'}`,
      show_qr_code: true
    };

    return new Response(JSON.stringify({ design }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-ticket-design:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
