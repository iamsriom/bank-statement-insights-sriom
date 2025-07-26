-- Add credits column to profiles table for credit management
ALTER TABLE public.profiles ADD COLUMN credits integer DEFAULT 5 NOT NULL;

-- Create processing_sessions table for privacy tracking
CREATE TABLE public.processing_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  session_token text NOT NULL,
  credit_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '1 hour')
);

-- Enable RLS on processing_sessions
ALTER TABLE public.processing_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for processing_sessions
CREATE POLICY "Users can create their own processing sessions" 
ON public.processing_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own processing sessions" 
ON public.processing_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create credit_transactions table for tracking credit usage
CREATE TABLE public.credit_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  operation_type text NOT NULL,
  credits_used integer NOT NULL,
  remaining_credits integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on credit_transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for credit_transactions
CREATE POLICY "Users can view their own credit transactions" 
ON public.credit_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own credit transactions" 
ON public.credit_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update handle_new_user function to give 5 credits to new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, credits)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    5  -- 5 free credits for new users
  );
  RETURN NEW;
END;
$function$;