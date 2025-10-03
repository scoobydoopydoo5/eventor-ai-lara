-- Create ticket configuration table
CREATE TABLE public.ticket_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  adult_price NUMERIC,
  child_price NUMERIC,
  ticket_color TEXT DEFAULT '#000000',
  show_qr_code BOOLEAN DEFAULT true,
  font_family TEXT DEFAULT 'Arial',
  text_color TEXT DEFAULT '#000000',
  bg_color TEXT,
  text_alignment TEXT DEFAULT 'center',
  ticket_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id)
);

-- Create attendee groups table
CREATE TABLE public.attendee_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  attendee_name TEXT NOT NULL,
  phone_number TEXT,
  password TEXT,
  group_type TEXT NOT NULL CHECK (group_type IN ('vip', 'invited', 'admin', 'regular')),
  is_banned BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create seatmap configuration table
CREATE TABLE public.seatmap_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  has_seatmap BOOLEAN DEFAULT false,
  horizontal_seats INTEGER DEFAULT 10,
  vertical_seats INTEGER DEFAULT 10,
  blocked_seats JSONB DEFAULT '[]',
  seatmap_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id)
);

-- Create guest flow table
CREATE TABLE public.guest_flow (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  flow_steps JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id)
);

-- Create event settings table
CREATE TABLE public.event_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  ice_breakers_enabled BOOLEAN DEFAULT true,
  external_invites_enabled BOOLEAN DEFAULT true,
  rules_guidelines TEXT,
  guest_handbook TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id)
);

-- Enable RLS
ALTER TABLE public.ticket_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendee_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seatmap_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ticket_config
CREATE POLICY "Anyone can view ticket config" ON public.ticket_config FOR SELECT USING (true);
CREATE POLICY "Anyone can insert ticket config" ON public.ticket_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update ticket config" ON public.ticket_config FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete ticket config" ON public.ticket_config FOR DELETE USING (true);

-- RLS Policies for attendee_groups
CREATE POLICY "Anyone can view attendee groups" ON public.attendee_groups FOR SELECT USING (true);
CREATE POLICY "Anyone can insert attendee groups" ON public.attendee_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update attendee groups" ON public.attendee_groups FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete attendee groups" ON public.attendee_groups FOR DELETE USING (true);

-- RLS Policies for seatmap_config
CREATE POLICY "Anyone can view seatmap config" ON public.seatmap_config FOR SELECT USING (true);
CREATE POLICY "Anyone can insert seatmap config" ON public.seatmap_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update seatmap config" ON public.seatmap_config FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete seatmap config" ON public.seatmap_config FOR DELETE USING (true);

-- RLS Policies for guest_flow
CREATE POLICY "Anyone can view guest flow" ON public.guest_flow FOR SELECT USING (true);
CREATE POLICY "Anyone can insert guest flow" ON public.guest_flow FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update guest flow" ON public.guest_flow FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete guest flow" ON public.guest_flow FOR DELETE USING (true);

-- RLS Policies for event_settings
CREATE POLICY "Anyone can view event settings" ON public.event_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert event settings" ON public.event_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update event settings" ON public.event_settings FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete event settings" ON public.event_settings FOR DELETE USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_ticket_config_updated_at
  BEFORE UPDATE ON public.ticket_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendee_groups_updated_at
  BEFORE UPDATE ON public.attendee_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seatmap_config_updated_at
  BEFORE UPDATE ON public.seatmap_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_guest_flow_updated_at
  BEFORE UPDATE ON public.guest_flow
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_settings_updated_at
  BEFORE UPDATE ON public.event_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();