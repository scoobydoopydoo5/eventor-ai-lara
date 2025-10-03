import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FiExternalLink, FiLoader } from "react-icons/fi";
import { BudgetItem } from "@/hooks/useBudget";
import { supabase } from "@/lib/supabase-typed";
import { useToast } from "@/hooks/use-toast";

interface BudgetExplainModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: BudgetItem;
  eventData: any;
  currency?: string;
}

interface ExplanationData {
  explanation: string;
  breakdown: string[];
  tips: string[];
  sources: { title: string; url: string }[];
}

export function BudgetExplainModal({
  open,
  onOpenChange,
  item,
  eventData,
  currency = "KWD",
}: BudgetExplainModalProps) {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<ExplanationData | null>(null);
  const { toast } = useToast();

  const fetchExplanation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "explain-budget-item",
        {
          body: { item, eventData },
        }
      );

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setExplanation(data);
    } catch (error) {
      console.error("Error fetching explanation:", error);
      toast({
        title: "Error",
        description: "Failed to generate explanation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen && !explanation) {
      fetchExplanation();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {item.item_name}
            <span className="ml-3 text-base font-normal text-muted-foreground">
              {currency}{" "}
              {(item.estimated_cost * item.quantity).toLocaleString()}
            </span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FiLoader className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : explanation ? (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Explanation</h3>
              <p className="text-muted-foreground whitespace-pre-line">
                {explanation.explanation}
              </p>
            </div>

            {explanation.breakdown && explanation.breakdown.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Cost Breakdown</h3>
                <ul className="space-y-1">
                  {explanation.breakdown.map((item, index) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground flex items-center gap-2"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {explanation.tips && explanation.tips.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Money-Saving Tips</h3>
                <ul className="space-y-2">
                  {explanation.tips.map((tip, index) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground bg-accent/50 p-3 rounded-lg"
                    >
                      💡 {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {explanation.sources && explanation.sources.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Pricing Sources</h3>
                <div className="space-y-2">
                  {explanation.sources.map((source, index) => (
                    <a
                      key={index}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline p-3 bg-muted rounded-lg"
                    >
                      <FiExternalLink className="h-4 w-4" />
                      {source.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
