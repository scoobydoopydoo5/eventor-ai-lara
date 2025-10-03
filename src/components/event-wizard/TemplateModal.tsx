import { useState } from 'react';
import { FiX, FiLoader } from 'react-icons/fi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';

interface TemplateModalProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (template: any) => void;
}

const predefinedTemplates = [
  {
    name: 'Birthday Party',
    description: 'Classic birthday celebration with cake and gifts',
    icon: '🎂',
  },
  {
    name: 'Wedding',
    description: 'Beautiful wedding ceremony and reception',
    icon: '💒',
  },
  {
    name: 'Corporate Event',
    description: 'Professional business conference or meeting',
    icon: '💼',
  },
  {
    name: 'Baby Shower',
    description: 'Welcoming a new baby with friends and family',
    icon: '👶',
  },
  {
    name: 'Graduation Party',
    description: 'Celebrate academic achievements',
    icon: '🎓',
  },
  {
    name: 'Holiday Party',
    description: 'Seasonal celebration with festive decorations',
    icon: '🎄',
  },
];

export function TemplateModal({ open, onClose, onSelectTemplate }: TemplateModalProps) {
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePredefinedTemplate = async (templateName: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-template', {
        body: { prompt: templateName, mode: 'template' }
      });

      if (error) throw error;

      onSelectTemplate(data);
      onClose();
      toast({
        title: "Template loaded!",
        description: "Your form has been pre-filled with template data",
      });
    } catch (error) {
      console.error('Error generating template:', error);
      toast({
        title: "Error",
        description: "Failed to generate template",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCustomTemplate = async () => {
    if (!customPrompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please describe your event",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-template', {
        body: { prompt: customPrompt, mode: 'template' }
      });

      if (error) throw error;

      onSelectTemplate(data);
      onClose();
      toast({
        title: "Template created!",
        description: "Your form has been pre-filled with AI-generated data",
      });
    } catch (error) {
      console.error('Error generating custom template:', error);
      toast({
        title: "Error",
        description: "Failed to generate template",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Event Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Predefined Templates</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {predefinedTemplates.map((template) => (
                <Card
                  key={template.name}
                  className="p-4 cursor-pointer hover:border-primary transition-smooth"
                  onClick={() => handlePredefinedTemplate(template.name)}
                >
                  <div className="text-4xl mb-2">{template.icon}</div>
                  <h4 className="font-medium mb-1">{template.name}</h4>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </Card>
              ))}
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-3">Custom Template</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Describe your event and AI will generate a custom template
            </p>
            <Textarea
              placeholder="E.g., A tech startup launch party for 100 people with modern theme..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={4}
              className="mb-3"
            />
            <Button onClick={handleCustomTemplate} disabled={loading}>
              {loading ? (
                <>
                  <FiLoader className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Custom Template'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
