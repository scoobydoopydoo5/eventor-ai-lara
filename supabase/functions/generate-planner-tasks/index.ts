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
    const { event } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert event planning assistant. Generate comprehensive, realistic tasks for event planning based on the provided event details. Include actual venue links, vendor websites, and resource URLs when relevant. Make tasks detailed, actionable, and organized by priority and timeline.`;

    // Calculate dates properly based on event date
    const eventDate = new Date(event.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Ensure event date is in the future
    if (eventDate < today) {
      eventDate.setFullYear(today.getFullYear() + 1);
    }

const userPrompt = `Generate 12-15 detailed event planning tasks for the following event:

Event Name: ${event.name}
Event Type: ${event.event_type}
Event Date: ${event.event_date}
Event Time: ${event.event_time || 'TBD'}
Location: ${event.location_name || event.country || 'TBD'}
Country: ${event.country || 'N/A'}
State: ${event.state || 'N/A'}
Theme: ${event.theme_preferences || 'Not specified'}
Color Theme: ${event.color_theme || 'N/A'}
Estimated Guests: ${event.estimated_guests || 'N/A'}
Budget: ${event.currency || 'USD'} ${event.estimated_budget || 'N/A'}
Guest Age Range: ${event.guest_age_range || 'Mixed'}
Special Notes: ${event.special_notes || 'None'}

CRITICAL INSTRUCTIONS FOR DATE CALCULATION:
- The event date is: ${event.event_date}
- TODAY'S DATE is: ${today.toISOString().split('T')[0]}
- ALL task dates MUST be between TODAY and the EVENT DATE
- Calculate realistic start_date and due_date for each task by working backward from the event date
- Use standard event planning timelines:
  * Venue booking: 6-12 months before (start) to 8-10 months before (due)
  * Save-the-dates: 6-8 months before (start) to 4-6 months before (due)
  * Catering contracts: 4-6 months before (start) to 3 months before (due)
  * Invitations sent: 2-3 months before (start) to 6-8 weeks before (due)
  * Decorations ordered: 2 months before (start) to 1 month before (due)
  * Final headcount: 2 weeks before (start) to 1 week before (due)
  * Final venue walkthrough: 1 week before (start) to 2 days before (due)
  * Day-of coordination: Event day (start and due)

For each task, provide:
1. A clear, actionable title
2. Detailed description with specific steps
3. AI-calculated priority based on urgency and importance (high, medium, or low)
4. Category (venue, catering, decoration, entertainment, logistics, invitations, photography, etc.)
5. Calculated due_date in YYYY-MM-DD format (working backward from event date, MUST be after today)
6. Calculated start_date in YYYY-MM-DD format (when to begin this task, MUST be after today)
7. Realistic URL links to relevant resources - add URLs to at least 50% of tasks
8. Additional notes with helpful tips - add notes to at least 60% of tasks
9. Relevant tags (array of 2-4 tags per task)
10. Optional start_time and due_time in HH:MM format for time-sensitive tasks

Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "Task title",
    "description": "Detailed task description",
    "status": "todo",
    "priority": "high|medium|low",
    "category": "Category name",
    "due_date": "YYYY-MM-DD",
    "start_date": "YYYY-MM-DD",
    "url": "https://example.com/resource",
    "notes": "Additional helpful notes and tips",
    "tags": ["tag1", "tag2", "tag3"],
    "start_time": "HH:MM",
    "due_time": "HH:MM"
  }
]`;

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
    
    let tasks;
    try {
      const parsed = JSON.parse(content);
      tasks = parsed.tasks || parsed;
      
      // Get today and event date for validation
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDate = new Date(event.event_date);
      
      // Validate and fix dates - ensure all dates are after Oct 3, 2024
      const minDate = new Date('2024-10-04');
      tasks = tasks.map((task: any) => {
        const taskStartDate = task.start_date ? new Date(task.start_date) : null;
        const taskDueDate = task.due_date ? new Date(task.due_date) : null;
        
        // Ensure start date is after today and after Oct 3, 2024
        const effectiveMinDate = today > minDate ? today : minDate;
        if (taskStartDate && taskStartDate < effectiveMinDate) {
          task.start_date = effectiveMinDate.toISOString().split('T')[0];
        }
        
        // Ensure due date is after today, Oct 3 2024, and start date
        if (taskDueDate) {
          if (taskDueDate < effectiveMinDate) {
            const adjustedDate = new Date(effectiveMinDate);
            adjustedDate.setDate(adjustedDate.getDate() + 7);
            task.due_date = adjustedDate.toISOString().split('T')[0];
          }
          
          if (taskStartDate && taskDueDate < taskStartDate) {
            const adjustedDate = new Date(taskStartDate);
            adjustedDate.setDate(adjustedDate.getDate() + 1);
            task.due_date = adjustedDate.toISOString().split('T')[0];
          }
          
          // Ensure due date is before event date
          if (taskDueDate > eventDate) {
            task.due_date = eventDate.toISOString().split('T')[0];
          }
        }
        
        return task;
      });
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid JSON response from AI');
    }

    return new Response(JSON.stringify({ tasks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating tasks:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        tasks: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
