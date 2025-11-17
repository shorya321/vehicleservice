-- Fix verify_email_with_token function to use correct column names
-- The function was using action_type, action_description, metadata
-- But user_activity_logs table has action, details columns

CREATE OR REPLACE FUNCTION public.verify_email_with_token(p_token TEXT)
RETURNS JSONB AS $$
DECLARE
  v_token_record RECORD;
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

  -- Update user's email verification status in profiles
  UPDATE public.profiles
  SET
    email_verified = true,
    email_verified_at = NOW(),
    updated_at = NOW()
  WHERE id = v_token_record.user_id;

  -- Update auth.users to confirm email (required for login)
  UPDATE auth.users
  SET
    email_confirmed_at = NOW(),
    raw_user_meta_data = raw_user_meta_data || '{"email_verified": true}'::jsonb
  WHERE id = v_token_record.user_id;

  -- Mark token as used
  UPDATE public.email_verification_tokens
  SET used_at = NOW()
  WHERE id = v_token_record.id;

  -- Log the activity with correct column names
  INSERT INTO public.user_activity_logs (
    user_id,
    action,
    details
  ) VALUES (
    v_token_record.user_id,
    'email_verified',
    jsonb_build_object(
      'token_id', v_token_record.id,
      'description', 'Email verified via token'
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_token_record.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
