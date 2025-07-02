-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Email notification settings
  email_new_user_registration BOOLEAN DEFAULT true,
  email_security_alerts BOOLEAN DEFAULT true,
  email_system_updates BOOLEAN DEFAULT true,
  email_booking_updates BOOLEAN DEFAULT true,
  email_payment_alerts BOOLEAN DEFAULT true,
  
  -- Push notification settings (for future use)
  push_enabled BOOLEAN DEFAULT false,
  push_new_user_registration BOOLEAN DEFAULT false,
  push_security_alerts BOOLEAN DEFAULT false,
  push_booking_updates BOOLEAN DEFAULT false,
  
  -- Notification frequency settings
  digest_frequency TEXT DEFAULT 'instant', -- 'instant', 'daily', 'weekly', 'never'
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure one preference per user
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view their own notification preferences
CREATE POLICY "Users can view own notification preferences" 
  ON public.notification_preferences 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can update their own notification preferences
CREATE POLICY "Users can update own notification preferences" 
  ON public.notification_preferences 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can insert their own notification preferences
CREATE POLICY "Users can insert own notification preferences" 
  ON public.notification_preferences 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get or create notification preferences
CREATE OR REPLACE FUNCTION public.get_or_create_notification_preferences(p_user_id UUID)
RETURNS public.notification_preferences AS $$
DECLARE
  v_preferences public.notification_preferences;
BEGIN
  -- Try to get existing preferences
  SELECT * INTO v_preferences
  FROM public.notification_preferences
  WHERE user_id = p_user_id;
  
  -- If not found, create default preferences
  IF NOT FOUND THEN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_preferences;
  END IF;
  
  RETURN v_preferences;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create default notification preferences for existing admin users
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM public.profiles 
WHERE role = 'admin' 
  AND NOT EXISTS (
    SELECT 1 FROM public.notification_preferences np 
    WHERE np.user_id = profiles.id
  );