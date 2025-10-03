import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BudgetItem } from "@/hooks/useBudget";

interface BudgetItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: Partial<BudgetItem>) => Promise<void>;
  item?: BudgetItem | null;
  currency?: string;
}

const categories = [
  "venue",
  "catering",
  "decorations",
  "entertainment",
  "photography",
  "invitations",
  "transportation",
  "staffing",
  "equipment",
  "miscellaneous",
];

export function BudgetItemDialog({
  open,
  onOpenChange,
  onSave,
  item,
  currency = "KWD",
}: BudgetItemDialogProps) {
  const [formData, setFormData] = useState({
    item_name: "",
    category: "miscellaneous",
    estimated_cost: 0,
    actual_cost: 0,
    quantity: 1,
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        item_name: item.item_name,
        category: item.category,
        estimated_cost: item.estimated_cost,
        actual_cost: item.actual_cost || 0,
        quantity: item.quantity,
        notes: item.notes || "",
      });
    } else {
      setFormData({
        item_name: "",
        category: "miscellaneous",
        estimated_cost: 0,
        actual_cost: 0,
        quantity: 1,
        notes: "",
      });
    }
  }, [item, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "Edit" : "Add"} Budget Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Item Name</Label>
            <Input
              value={formData.item_name}
              onChange={(e) =>
                setFormData({ ...formData, item_name: e.target.value })
              }
              placeholder="e.g., Venue rental"
            />
          </div>
          <div>
            <Label>Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Estimated Cost ({currency})</Label>
              <Input
                type="number"
                value={formData.estimated_cost}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimated_cost: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
          </div>
          <div>
            <Label>Actual Cost ({currency}) - Optional</Label>
            <Input
              type="number"
              value={formData.actual_cost}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  actual_cost: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional details..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !formData.item_name}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
