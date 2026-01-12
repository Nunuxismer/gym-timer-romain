
-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Create saved_sessions table (stores JSON session templates)
CREATE TABLE public.saved_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_data JSONB NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on saved_sessions
ALTER TABLE public.saved_sessions ENABLE ROW LEVEL SECURITY;

-- Saved sessions policies
CREATE POLICY "Users can view their own saved sessions" 
ON public.saved_sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved sessions" 
ON public.saved_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved sessions" 
ON public.saved_sessions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved sessions" 
ON public.saved_sessions FOR DELETE 
USING (auth.uid() = user_id);

-- Create scheduled_sessions table (calendar planning)
CREATE TABLE public.scheduled_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  saved_session_id UUID REFERENCES public.saved_sessions(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  notes TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on scheduled_sessions
ALTER TABLE public.scheduled_sessions ENABLE ROW LEVEL SECURITY;

-- Scheduled sessions policies
CREATE POLICY "Users can view their own scheduled sessions" 
ON public.scheduled_sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled sessions" 
ON public.scheduled_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled sessions" 
ON public.scheduled_sessions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled sessions" 
ON public.scheduled_sessions FOR DELETE 
USING (auth.uid() = user_id);

-- Create session_history table (completed sessions with performance data)
CREATE TABLE public.session_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  saved_session_id UUID REFERENCES public.saved_sessions(id) ON DELETE SET NULL,
  scheduled_session_id UUID REFERENCES public.scheduled_sessions(id) ON DELETE SET NULL,
  session_name TEXT NOT NULL,
  session_data JSONB,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_seconds INTEGER NOT NULL,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on session_history
ALTER TABLE public.session_history ENABLE ROW LEVEL SECURITY;

-- Session history policies
CREATE POLICY "Users can view their own session history" 
ON public.session_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own session history" 
ON public.session_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own session history" 
ON public.session_history FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own session history" 
ON public.session_history FOR DELETE 
USING (auth.uid() = user_id);

-- Create exercise_logs table (individual exercise performance)
CREATE TABLE public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_history_id UUID REFERENCES public.session_history(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  sets_completed INTEGER,
  reps_completed INTEGER[],
  weight_used DECIMAL(6,2)[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on exercise_logs
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

-- Exercise logs policies
CREATE POLICY "Users can view their own exercise logs" 
ON public.exercise_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exercise logs" 
ON public.exercise_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercise logs" 
ON public.exercise_logs FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercise logs" 
ON public.exercise_logs FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_sessions_updated_at
BEFORE UPDATE ON public.saved_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_sessions_updated_at
BEFORE UPDATE ON public.scheduled_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_saved_sessions_user_id ON public.saved_sessions(user_id);
CREATE INDEX idx_scheduled_sessions_user_id ON public.scheduled_sessions(user_id);
CREATE INDEX idx_scheduled_sessions_date ON public.scheduled_sessions(scheduled_date);
CREATE INDEX idx_session_history_user_id ON public.session_history(user_id);
CREATE INDEX idx_session_history_completed_at ON public.session_history(completed_at);
CREATE INDEX idx_exercise_logs_session_history_id ON public.exercise_logs(session_history_id);
CREATE INDEX idx_exercise_logs_user_id ON public.exercise_logs(user_id);
CREATE INDEX idx_exercise_logs_exercise_id ON public.exercise_logs(exercise_id);
