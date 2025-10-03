import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "@/lib/supabase-typed";
import { useQuery } from "@tanstack/react-query";

interface ClerkAuthContextType {
  userId: string | null;
  email: string | null;
  balloons: number;
  isLoading: boolean;
  isGuest: boolean;
  refetchBalloons: () => void;
}

const ClerkAuthContext = createContext<ClerkAuthContextType>({
  userId: null,
  email: null,
  balloons: 0,
  isLoading: true,
  isGuest: true,
  refetchBalloons: () => {},
});

export const useClerkAuth = () => useContext(ClerkAuthContext);

const GUEST_BALLOONS_KEY = "guest_balloons";
const GUEST_INITIAL_CREDITS = "got_20_credits";

export const ClerkAuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoaded } = useUser();
  const [guestBalloons, setGuestBalloons] = useState<number>(0);

  // Initialize guest balloons on mount
  useEffect(() => {
    if (!user && isLoaded) {
      const hasReceivedCredits = localStorage.getItem(GUEST_INITIAL_CREDITS);
      if (!hasReceivedCredits) {
        localStorage.setItem(GUEST_BALLOONS_KEY, "300");
        localStorage.setItem(GUEST_INITIAL_CREDITS, "true");
        setGuestBalloons(300);
      } else {
        const stored = localStorage.getItem(GUEST_BALLOONS_KEY);
        setGuestBalloons(stored ? parseInt(stored) : 0);
      }
    }
  }, [user, isLoaded]);

  // Auto-create profile if user is authenticated but has no profile
  useQuery({
    queryKey: ["profile-check", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: existingProfile } = await (supabase as any)
        .from("user_profiles")
        .select("id")
        .eq("clerk_user_id", user.id)
        .maybeSingle();

      if (!existingProfile) {
        // Create new profile with user_id = clerk_user_id
        const username =
          user.username ||
          user.firstName ||
          user.emailAddresses[0]?.emailAddress?.split("@")[0] ||
          "";
        await (supabase as any).from("user_profiles").insert({
          clerk_user_id: user.id,
          user_id: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
          username: username,
        });
      }

      return true;
    },
    enabled: !!user?.id && isLoaded,
  });

  const { data: balloonsData, refetch: refetchBalloons } = useQuery({
    queryKey: ["balloons", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await (supabase as any)
        .from("user_balloons")
        .select("balance")
        .eq("clerk_user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching balloons:", error);
        return null;
      }

      return data;
    },
    enabled: !!user?.id,
  });

  const refetchGuestBalloons = () => {
    const stored = localStorage.getItem(GUEST_BALLOONS_KEY);
    setGuestBalloons(stored ? parseInt(stored) : 0);
  };

  const value = {
    userId: user?.id || null,
    email: user?.emailAddresses?.[0]?.emailAddress || null,
    balloons: user ? (balloonsData as any)?.balance || 0 : guestBalloons,
    isLoading: !isLoaded,
    isGuest: !user,
    refetchBalloons: user ? refetchBalloons : refetchGuestBalloons,
  };

  return (
    <ClerkAuthContext.Provider value={value}>
      {children}
    </ClerkAuthContext.Provider>
  );
};
