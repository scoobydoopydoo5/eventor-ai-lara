import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Download } from "lucide-react";
import { useRef } from "react";

interface TicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketData: any;
}

export function TicketModal({
  open,
  onOpenChange,
  ticketData,
}: TicketModalProps) {
  const ticketRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!ticketRef.current) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 800;

    // Draw ticket
    ctx.fillStyle = ticketData?.bg_color || "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = ticketData?.ticket_color || "#000000";
    ctx.fillRect(0, 0, canvas.width, 100);

    ctx.fillStyle = ticketData?.text_color || "#000000";
    ctx.font = `24px ${ticketData?.font_family || "Arial"}`;
    ctx.textAlign = ticketData?.text_alignment || "center";

    const lines = [
      ticketData?.eventData?.name || "Event",
      "",
      new Date(ticketData?.eventData?.event_date).toLocaleDateString(),
      ticketData?.eventData?.event_time || "",
      "",
      ticketData?.eventData?.location_name || "Venue",
      "",
      `Attendee: ${ticketData?.attendeeName}`,
      `Type: ${ticketData?.groupType}`,
      ticketData?.seat ? `Seat: ${ticketData.seat}` : "",
      `Password: ${ticketData?.password}`,
    ];

    let y = 150;
    lines.forEach((line) => {
      if (line) {
        ctx.fillText(line, canvas.width / 2, y);
        y += 40;
      }
    });

    // Download
    const link = document.createElement("a");
    link.download = `ticket-${ticketData?.attendeeName?.replace(
      /\s+/g,
      "-"
    )}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Your Ticket</DialogTitle>
        </DialogHeader>

        <div
          ref={ticketRef}
          className="space-y-4 p-6 rounded-lg border"
          style={{
            backgroundColor: ticketData?.bg_color || "#ffffff",
            color: ticketData?.text_color || "#000000",
            fontFamily: ticketData?.font_family || "Sora",
            textAlign: (ticketData?.text_alignment as any) || "center",
          }}
        >
          <div
            className="p-4 rounded-t-lg -m-6 mb-4"
            style={{ backgroundColor: ticketData?.ticket_color || "#000000" }}
          >
            <h2 className="text-2xl font-bold text-white">
              {ticketData?.eventData?.name}
            </h2>
          </div>

          <div className="space-y-2">
            <p className="font-medium">
              {new Date(ticketData?.eventData?.event_date).toLocaleDateString()}
            </p>
            {ticketData?.eventData?.event_time && (
              <p>{ticketData.eventData.event_time}</p>
            )}
            <p>{ticketData?.eventData?.location_name || "Venue TBA"}</p>
          </div>

          <div className="border-t pt-4 space-y-2">
            <p>
              <strong>Attendee:</strong> {ticketData?.attendeeName}
            </p>
            <p>
              <strong>Type:</strong> {ticketData?.groupType}
            </p>
            {ticketData?.seat && (
              <p>
                <strong>Seat:</strong> {ticketData.seat}
              </p>
            )}
            <p>
              <strong>Access Code:</strong> {ticketData?.password}
            </p>
          </div>

          {ticketData?.show_qr_code !== false && (
            <div className="flex justify-center pt-4">
              <QRCodeSVG
                value={
                  ticketData?.checkInUrl ||
                  `${ticketData?.eventData?.id}-${ticketData?.attendeeName}-${ticketData?.password}`
                }
                size={150}
              />
            </div>
          )}
        </div>

        <Button onClick={handleDownload} className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Download Ticket
        </Button>
      </DialogContent>
    </Dialog>
  );
}
