-- Create email verification tokens table
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  used_at TIMESTAMPTZ,
  
  -- Index for token lookup
  CONSTRAINT email_verification_tokens_token_unique UNIQUE(token)
);

-- Create index for faster token lookups
CREATE INDEX idx_email_verification_tokens_token ON public.email_verification_tokens(token);
CREATE INDEX idx_email_verification_tokens_user_id ON public.email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_tokens_expires_at ON public.email_verification_tokens(expires_at);

-- Enable Row Level Security
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Only admins can view verification tokens
CREATE POLICY "Admins can view verification tokens" 
  ON public.email_verification_tokens 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Only admins can create verification tokens
CREATE POLICY "Admins can create verification tokens" 
  ON public.email_verification_tokens 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Only admins can update verification tokens
CREATE POLICY "Admins can update verification tokens" 
  ON public.email_verification_tokens 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Function to verify email with token
CREATE OR REPLACE FUNCTION public.verify_email_with_token(p_token TEXT)
RETURNS JSONB AS $$
DECLARE
  v_token_record RECORD;
  v_result JSONB;
BEGIN
  -- Find the token
  SELECT * INTO v_token_record
  FROM public.email_verification_tokens
  WHERE token = p_token
    AND expires_at > NOW()
    AND used_at IS NULL
  FOR UPDATE;
  
  -- Check if token exists and is valid
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired token'
    );
  END IF;
  
  -- Update user's email verification status
  UPDATE public.profiles
  SET 
    email_verified = true,
    email_verified_at = NOW(),
    updated_at = NOW()
  WHERE id = v_token_record.user_id;
  
  -- Mark token as used
  UPDATE public.email_verification_tokens
  SET used_at = NOW()
  WHERE id = v_token_record.id;
  
  -- Log the activity
  INSERT INTO public.user_activity_logs (
    user_id,
    action_type,
    action_description,
    metadata
  ) VALUES (
    v_token_record.user_id,
    'email_verified',
    'Email verified via token',
    jsonb_build_object('token_id', v_token_record.id)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_token_record.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Function to clean up expired tokens (can be called periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_tokens()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.email_verification_tokens
  WHERE expires_at < NOW() - INTERVAL '7 days'
    OR (used_at IS NOT NULL AND used_at < NOW() - INTERVAL '30 days');
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';