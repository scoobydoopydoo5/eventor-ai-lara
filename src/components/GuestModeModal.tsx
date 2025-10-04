import { useState, useEffect } from "react";
import { SignInButton } from "@clerk/clerk-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FiAlertCircle, FiDownload } from "react-icons/fi";
import { supabase } from "@/lib/supabase-typed";
import { useClerkAuth } from "@/contexts/ClerkAuthContext";
import { useToast } from "@/hooks/use-toast";

interface GuestModeModalProps {
  guestEvents: any[];
  onDownloadLinks: () => void;
}

export function GuestModeModal({
  guestEvents,
  onDownloadLinks,
}: GuestModeModalProps) {
  const [open, setOpen] = useState(false);
  const { userId } = useClerkAuth();
  const { toast } = useToast();

  useEffect(() => {
    checkIfShouldShow();
  }, [userId]);

  const checkIfShouldShow = async () => {
    // Only show for non-authenticated users
    if (userId) return;

    // Check localStorage for first-time visitors
    const hasSeenWarning = localStorage.getItem("hasSeenGuestWarning");
    if (!hasSeenWarning) {
      setOpen(true);
    }
  };

  const handleClose = async () => {
    localStorage.setItem("hasSeenGuestWarning", "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FiAlertCircle className="h-5 w-5 text-yellow-500" />
            Guest Mode - Data at Risk!
          </DialogTitle>
          <DialogDescription className="space-y-4 pt-4">
            <p className="text-sm">
              Your events are stored locally on this device only. Sign in to
              sync across devices and prevent data loss. Anyone with the event
              link can edit your event unless it's password protected.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={handleClose} className="w-full">
                Continue as Guest
              </Button>
              <SignInButton mode="modal">
                <Button className="w-full">Sign In to Save</Button>
              </SignInButton>
              {guestEvents.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onDownloadLinks();
                    handleClose();
                  }}
                  className="w-full"
                >
                  <FiDownload className="h-4 w-4 mr-2" />
                  Download Event Links
                </Button>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
