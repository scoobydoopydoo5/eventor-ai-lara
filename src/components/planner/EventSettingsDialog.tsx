import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-typed";
import { useToast } from "@/hooks/use-toast";

interface EventSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}

const defaultCards = [
  { id: "details", label: "Details" },
  { id: "planner", label: "Planner" },
  { id: "full-plan", label: "Full Plan" },
  { id: "tasks", label: "Tasks" },
  { id: "budget", label: "Budget" },
  { id: "invites", label: "Invites" },
  { id: "timeline", label: "Timeline" },
  { id: "vendors", label: "Vendors" },
  { id: "guests", label: "Guests" },
  { id: "tickets", label: "Tickets" },
  { id: "food", label: "Food" },
  { id: "souvenirs", label: "Souvenirs" },
  { id: "weather", label: "Weather" },
  { id: "sponsors", label: "Sponsors" },
  { id: "flights", label: "Flights" },
  { id: "decor", label: "Decor" },
  { id: "themes", label: "Themes" },
  { id: "memories", label: "Memories" },
  { id: "faqs", label: "FAQs" },
  { id: "blogs", label: "Blogs" },
  { id: "chat", label: "Chat with AI" },
];

export function EventSettingsDialog({
  open,
  onOpenChange,
  eventId,
}: EventSettingsDialogProps) {
  const [visibleCards, setVisibleCards] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["event-settings", eventId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("event_settings")
        .select("*")
        .eq("event_id", eventId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings && (settings as any).visible_cards) {
      setVisibleCards((settings as any).visible_cards as string[]);
    } else {
      setVisibleCards(defaultCards.map((c) => c.id));
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (cards: string[]) => {
      if (settings) {
        const { error } = await (supabase as any)
          .from("event_settings")
          .update({ visible_cards: cards })
          .eq("event_id", eventId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("event_settings")
          .insert({ event_id: eventId, visible_cards: cards });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-settings", eventId] });
      toast({ title: "Settings updated" });
    },
  });

  const toggleCard = (cardId: string) => {
    const newCards = visibleCards.includes(cardId)
      ? visibleCards.filter((id) => id !== cardId)
      : [...visibleCards, cardId];
    setVisibleCards(newCards);
    updateMutation.mutate(newCards);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Event Settings</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {defaultCards.map((card) => (
              <div key={card.id} className="flex items-center justify-between">
                <Label htmlFor={card.id} className="cursor-pointer">
                  Show {card.label}
                </Label>
                <Switch
                  id={card.id}
                  checked={visibleCards.includes(card.id)}
                  onCheckedChange={() => toggleCard(card.id)}
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
