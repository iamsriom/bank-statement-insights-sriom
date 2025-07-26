-- Create daily_usage table for tracking free PDF conversions
CREATE TABLE public.daily_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address text NOT NULL,
  user_id uuid,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  pdf_conversions integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(ip_address, usage_date),
  UNIQUE(user_id, usage_date) -- For registered users
);

-- Enable RLS on daily_usage
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_usage
CREATE POLICY "Users can view their own daily usage" 
ON public.daily_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Allow insert for daily usage tracking" 
ON public.daily_usage 
FOR INSERT 
WITH CHECK (true); -- Edge functions need to insert for any IP/user

CREATE POLICY "Allow update for daily usage tracking" 
ON public.daily_usage 
FOR UPDATE 
USING (true); -- Edge functions need to update counts

-- Create trigger for updated_at
CREATE TRIGGER update_daily_usage_updated_at
BEFORE UPDATE ON public.daily_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();