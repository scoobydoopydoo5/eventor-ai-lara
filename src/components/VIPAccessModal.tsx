import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useBalloons } from "@/hooks/useBalloons";

interface VIPAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VIPAccessModal({ open, onOpenChange }: VIPAccessModalProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { earnBalloons } = useBalloons();

  const handleSubmit = async () => {
    if (password.trim().toLowerCase() === "iamagility") {
      setLoading(true);
      await earnBalloons(10000, "VIP Testing Access");
      toast({
        title: "VIP Access Granted! 🎈",
        description: "You've received 10,000 balloons for testing!",
      });
      setPassword("");
      onOpenChange(false);
      setLoading(false);
    } else {
      toast({
        title: "Invalid Password",
        description: "The VIP access password is incorrect",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>VIP Testing Access</DialogTitle>
          <DialogDescription>
            Enter the VIP password: "IAMAGILITY", to receive 10,000 balloons for
            testing
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="password"
            placeholder="Enter VIP password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <Button
            onClick={handleSubmit}
            disabled={loading || !password.trim()}
            className="w-full"
          >
            {loading ? "Verifying..." : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
