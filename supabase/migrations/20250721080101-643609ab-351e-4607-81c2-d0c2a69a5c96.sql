-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE public.transaction_category AS ENUM (
  'groceries', 'dining', 'transportation', 'utilities', 'entertainment', 
  'healthcare', 'shopping', 'subscription', 'investment', 'income', 
  'transfer', 'fees', 'taxes', 'insurance', 'education', 'other'
);

CREATE TYPE public.statement_status AS ENUM ('processing', 'completed', 'failed');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bank_statements table
CREATE TABLE public.bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  original_file_hash TEXT NOT NULL,
  encrypted_file_data BYTEA NOT NULL, -- 256-bit encrypted file data
  file_size BIGINT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processing_status statement_status NOT NULL DEFAULT 'processing',
  excel_data JSONB, -- Converted Excel data
  total_transactions INTEGER DEFAULT 0,
  date_range_start DATE,
  date_range_end DATE,
  account_info JSONB, -- Account details from statement
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table with encrypted sensitive data
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  statement_id UUID NOT NULL REFERENCES public.bank_statements(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  balance DECIMAL(12,2),
  category transaction_category,
  ai_confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  is_subscription BOOLEAN DEFAULT FALSE,
  subscription_frequency TEXT, -- monthly, yearly, etc.
  is_tax_deductible BOOLEAN DEFAULT FALSE,
  tax_category TEXT,
  merchant_name TEXT,
  location TEXT,
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financial_insights table
CREATE TABLE public.financial_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  statement_id UUID NOT NULL REFERENCES public.bank_statements(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'health_score', 'tax_deductions', 'subscriptions', 'spending_patterns'
  insight_data JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscription_tracking table
CREATE TABLE public.subscription_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  service_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  frequency TEXT NOT NULL, -- monthly, yearly, etc.
  next_billing_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  last_transaction_id UUID REFERENCES public.transactions(id),
  category TEXT,
  auto_cancel_eligible BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create export_logs table
CREATE TABLE public.export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  statement_id UUID REFERENCES public.bank_statements(id),
  export_format TEXT NOT NULL, -- 'excel', 'csv', 'pdf', 'quickbooks'
  export_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  file_size BIGINT,
  download_count INTEGER DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for bank_statements
CREATE POLICY "Users can view their own bank statements" 
ON public.bank_statements FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bank statements" 
ON public.bank_statements FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank statements" 
ON public.bank_statements FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bank statements" 
ON public.bank_statements FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for transactions
CREATE POLICY "Users can view their own transactions" 
ON public.transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" 
ON public.transactions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" 
ON public.transactions FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for financial_insights
CREATE POLICY "Users can view their own insights" 
ON public.financial_insights FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own insights" 
ON public.financial_insights FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for subscription_tracking
CREATE POLICY "Users can view their own subscriptions" 
ON public.subscription_tracking FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own subscriptions" 
ON public.subscription_tracking FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for export_logs
CREATE POLICY "Users can view their own export logs" 
ON public.export_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own export logs" 
ON public.export_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_bank_statements_user_id ON public.bank_statements(user_id);
CREATE INDEX idx_bank_statements_status ON public.bank_statements(processing_status);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_statement_id ON public.transactions(statement_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_transactions_category ON public.transactions(category);
CREATE INDEX idx_transactions_subscription ON public.transactions(is_subscription);
CREATE INDEX idx_financial_insights_user_id ON public.financial_insights(user_id);
CREATE INDEX idx_financial_insights_type ON public.financial_insights(insight_type);
CREATE INDEX idx_subscription_tracking_user_id ON public.subscription_tracking(user_id);
CREATE INDEX idx_subscription_tracking_active ON public.subscription_tracking(is_active);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bank_statements_updated_at
  BEFORE UPDATE ON public.bank_statements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_tracking_updated_at
  BEFORE UPDATE ON public.subscription_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();