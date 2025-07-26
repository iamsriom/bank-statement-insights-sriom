import { useState, useEffect } from "react";
import { Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CreditDisplayProps {
  userId: string;
}

export const CreditDisplay = ({ userId }: CreditDisplayProps) => {
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('credits')
          .eq('user_id', userId)
          .single();
        
        if (data) {
          setCredits(data.credits || 0);
        }
      } catch (error) {
        console.error('Error fetching credits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();

    // Subscribe to credit changes
    const channel = supabase
      .channel('credits-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new && 'credits' in payload.new) {
            setCredits(payload.new.credits as number);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1 bg-muted rounded-full">
        <Coins className="h-4 w-4 text-muted-foreground animate-pulse" />
        <span className="text-sm font-medium text-muted-foreground">...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-primary rounded-full">
      <Coins className="h-4 w-4 text-primary-foreground" />
      <span className="text-sm font-medium text-primary-foreground">
        {credits} credits
      </span>
    </div>
  );
};