import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError) throw eventError;

    const eventContext = `
    Event: ${event.name}
    Type: ${event.event_type}
    Date: ${event.event_date}
    Location: ${event.location_name}, ${event.country}
    Estimated Guests: ${event.estimated_guests || 'Not specified'}
    Budget: ${event.estimated_budget ? `${event.currency} ${event.estimated_budget}` : 'Not specified'}
    Theme: ${event.theme_preferences || 'Not specified'}
    Special Notes: ${event.special_notes || 'None'}
    `;

    // Generate comprehensive plan
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert event planner. Generate comprehensive event planning data in JSON format.'
          },
          {
            role: 'user',
            content: `Generate a complete event plan for the following event. Return ONLY valid JSON with no markdown formatting:

${eventContext}

Return JSON with these exact keys:
{
  "shortDescription": "2-3 sentence engaging description of the event",
  "fullPlan": "Detailed comprehensive event plan with sections for timeline, activities, logistics",
  "sponsors": [{"name": "Sponsor Name", "category": "Category", "description": "Why they'd sponsor", "link": ""}],
  "vendors": [{"name": "Vendor Name", "category": "Category", "description": "Services", "price": "Estimate", "link": ""}],
  "souvenirs": [{"name": "Item", "description": "Description", "cost": "Estimate", "quantity": number}],
  "food": [{"name": "Dish", "description": "Description", "dietary": "Info", "servings": number}],
  "faqs": [{"question": "Question", "answer": "Answer"}],
  "guestFlow": [{"time": "Time", "activity": "Activity", "location": "Location", "details": "Details"}],
  "rules": "Event rules and guidelines text",
  "handbook": "Guest handbook text with all important information",
  "blogs": [{"title": "Blog Title", "content": "Blog content", "blogNumber": 1}],
  "weather": "Weather forecast and recommendations"
}

Generate at least 3-5 items for each array. Make it specific to this event type and location.`
          }
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('AI gateway error:', response.status, text);
      throw new Error('Failed to generate plan');
    }

    const data = await response.json();
    let planData;
    
    try {
      const content = data.choices[0].message.content;
      // Remove markdown code blocks if present
      const jsonContent = content.replace(/```json\n?|\n?```/g, '').trim();
      planData = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Failed to parse AI response');
    }

    // Update event with short description
    await supabase
      .from('events')
      .update({ 
        short_description: planData.shortDescription,
        ai_generated_description: planData.fullPlan
      })
      .eq('id', eventId);

    // Insert sponsors
    if (planData.sponsors?.length) {
      for (const sponsor of planData.sponsors) {
        await supabase.from('vendors').insert({
          event_id: eventId,
          name: sponsor.name,
          category: 'Sponsor',
          description: sponsor.description,
          link: sponsor.link || null
        });
      }
    }

    // Insert vendors
    if (planData.vendors?.length) {
      for (const vendor of planData.vendors) {
        await supabase.from('vendors').insert({
          event_id: eventId,
          name: vendor.name,
          category: vendor.category,
          description: vendor.description,
          price: vendor.price,
          link: vendor.link || null,
          image_url: vendor.image_url || null
        });
      }
    }

    // Insert FAQs
    if (planData.faqs?.length) {
      for (const faq of planData.faqs) {
        await supabase.from('event_faqs').insert({
          event_id: eventId,
          question: faq.question,
          answer: faq.answer
        });
      }
    }

    // Insert guest flow
    if (planData.guestFlow?.length) {
      await supabase.from('guest_flow').insert({
        event_id: eventId,
        flow_steps: planData.guestFlow
      });
    }

    // Insert event settings with rules and handbook
    await supabase.from('event_settings').upsert({
      event_id: eventId,
      rules_guidelines: planData.rules,
      guest_handbook: planData.handbook
    });

    // Insert blogs
    if (planData.blogs?.length) {
      for (const blog of planData.blogs) {
        await supabase.from('event_blogs').insert({
          event_id: eventId,
          title: blog.title,
          content: blog.content,
          blog_number: blog.blogNumber,
          is_published: false
        });
      }
    }

    // Store weather data
    await supabase
      .from('events')
      .update({ 
        weather_data: { forecast: planData.weather }
      })
      .eq('id', eventId);

    return new Response(JSON.stringify({ success: true, planData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-initial-plan:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
