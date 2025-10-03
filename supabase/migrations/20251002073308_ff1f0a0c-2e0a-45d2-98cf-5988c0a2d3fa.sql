-- Add a comment to events table to trigger types regeneration
COMMENT ON TABLE public.events IS 'Events table for managing event information';

-- Add a comment to attendee_groups table
COMMENT ON TABLE public.attendee_groups IS 'Attendee groups for event management';

-- Add a comment to ticket_config table
COMMENT ON TABLE public.ticket_config IS 'Ticket configuration for events';