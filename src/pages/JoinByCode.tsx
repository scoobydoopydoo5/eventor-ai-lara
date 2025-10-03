import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase-typed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Key } from "lucide-react";

export default function JoinByCode() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState("");
  const [attendeeName, setAttendeeName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!inviteCode.trim() || !attendeeName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both the invite code and your name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Find event by invite code
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("id")
        .eq("invite_code", inviteCode.toUpperCase())
        .single();

      if (eventError || !event) {
        toast({
          title: "Invalid Code",
          description: "The invite code you entered is not valid",
          variant: "destructive",
        });
        return;
      }

      // Add attendee
      const { error: attendeeError } = await supabase.from("event_attendees").insert({
        event_id: event.id,
        attendee_name: attendeeName,
        attendee_type: "regular",
      });

      if (attendeeError) throw attendeeError;

      toast({
        title: "Success!",
        description: "You've joined the event",
      });

      navigate(`/event/${event.id}/guests`);
    } catch (error) {
      console.error("Error joining event:", error);
      toast({
        title: "Error",
        description: "Failed to join event",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <Key className="h-12 w-12 mx-auto mb-4 text-primary" />
          <CardTitle className="text-2xl">Join Event by Code</CardTitle>
          <CardDescription>Enter the invite code to join an event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Invite Code</label>
            <Input
              placeholder="XXXXXXXX"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="text-center text-lg tracking-widest"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Your Name</label>
            <Input
              placeholder="Enter your name"
              value={attendeeName}
              onChange={(e) => setAttendeeName(e.target.value)}
            />
          </div>
          <Button onClick={handleJoin} disabled={loading} className="w-full" size="lg">
            {loading ? "Joining..." : "Join Event"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
