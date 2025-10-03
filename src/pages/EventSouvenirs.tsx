import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-typed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Gift, Loader2, Hammer, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useImageGeneration } from "@/hooks/useImageGeneration";

interface SouvenirItem {
  id: string;
  name: string;
  description: string;
  quantity: string;
  estimatedCost: string;
  sourceType: string;
  reason: string;
  diyComplexity?: string;
}

interface DIYInstructions {
  name: string;
  materials: string[];
  tools: string[];
  steps: { stepNumber: number; instruction: string; time: string }[];
  timePerItem: string;
  totalTime: string;
  difficulty: string;
  tips: string[];
  whereToBuyMaterials: string[];
}

export default function EventSouvenirs() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [items, setItems] = useState<SouvenirItem[]>([]);
  const [recommendation, setRecommendation] = useState("");
  const [selectedItem, setSelectedItem] = useState<SouvenirItem | null>(null);
  const [diyInstructions, setDiyInstructions] = useState<DIYInstructions | null>(null);
  const [showDIYModal, setShowDIYModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loadingDIY, setLoadingDIY] = useState(false);
  const { generateImage } = useImageGeneration();
  const [souvenirImages, setSouvenirImages] = useState<Record<string, string>>({});

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const generateSouvenirSuggestions = async () => {
    if (!event) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("souvenir-suggestions", {
        body: {
          eventType: event.event_type,
          guests: event.estimated_guests,
          budget: event.estimated_budget,
          theme: event.color_theme,
        },
      });

      if (error) throw error;
      const generatedItems = data.items || [];
      setItems(generatedItems);
      setRecommendation(data.recommendation || "");
      
      // Generate images for each souvenir
      const images: Record<string, string> = {};
      for (const item of generatedItems) {
        const image = await generateImage(`Product photography of ${item.name}, ${item.description}, professional quality, clean background`, { item });
        if (image) {
          images[item.id] = image;
        }
      }
      setSouvenirImages(images);
      
      toast({ title: "Souvenir suggestions generated!" });
    } catch (error) {
      console.error("Error generating souvenir suggestions:", error);
      toast({
        title: "Error",
        description: "Failed to generate souvenir suggestions",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const viewDIYInstructions = async (item: SouvenirItem) => {
    setSelectedItem(item);
    setLoadingDIY(true);
    setShowDIYModal(true);
    setCurrentStep(0);

    try {
      const { data, error } = await supabase.functions.invoke("generate-diy-instructions", {
        body: {
          itemName: item.name,
          quantity: event?.estimated_guests || 50,
        },
      });

      if (error) throw error;
      setDiyInstructions(data.diy);
    } catch (error) {
      console.error("Error generating DIY instructions:", error);
      toast({
        title: "Error",
        description: "Failed to generate DIY instructions",
        variant: "destructive",
      });
    } finally {
      setLoadingDIY(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`/event/${eventId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Swag Bags & Souvenirs</h1>
            <p className="text-muted-foreground">AI-suggested souvenir ideas for your attendees</p>
          </div>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Gift className="h-16 w-16 mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No souvenir suggestions yet</h3>
              <p className="text-muted-foreground mb-4">Generate AI-powered souvenir suggestions</p>
              <Button onClick={generateSouvenirSuggestions} disabled={isGenerating}>
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Souvenir Ideas
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-end">
              <Button onClick={generateSouvenirSuggestions} disabled={isGenerating}>
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Regenerate Suggestions
              </Button>
            </div>

            {recommendation && (
              <Alert>
                <AlertDescription>{recommendation}</AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <Card key={item.id}>
                  {souvenirImages[item.id] && (
                    <div className="h-40 w-full overflow-hidden bg-muted flex items-center justify-center">
                      <img 
                        src={souvenirImages[item.id]} 
                        alt={item.name}
                        className="max-h-full max-w-full object-contain p-4"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {item.name}
                      <Badge variant={item.sourceType === "DIY" ? "default" : "secondary"}>
                        {item.sourceType}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-1">
                      <p><strong>Quantity:</strong> {item.quantity}</p>
                      <p><strong>Cost:</strong> {item.estimatedCost}</p>
                      {item.diyComplexity && (
                        <p><strong>DIY Complexity:</strong> {item.diyComplexity}</p>
                      )}
                    </div>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm"><strong>Why suitable:</strong> {item.reason}</p>
                    </div>
                    {item.sourceType === "DIY" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => viewDIYInstructions(item)}
                      >
                        <Hammer className="h-4 w-4 mr-2" />
                        DIY Instructions
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* DIY Instructions Modal */}
        <Dialog open={showDIYModal} onOpenChange={setShowDIYModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>DIY Instructions: {selectedItem?.name}</DialogTitle>
            </DialogHeader>
            {loadingDIY ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : diyInstructions ? (
              <div className="space-y-6">
                <div className="flex gap-4 text-sm">
                  <Badge>{diyInstructions.difficulty}</Badge>
                  <span>⏱️ {diyInstructions.timePerItem} per item</span>
                  <span>Total: {diyInstructions.totalTime}</span>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Materials Needed</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {diyInstructions.materials.map((material, i) => (
                      <li key={i}>{material}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Tools Required</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {diyInstructions.tools.map((tool, i) => (
                      <li key={i}>{tool}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Instructions</h3>
                  <div className="space-y-4">
                    {diyInstructions.steps.map((step) => (
                      <div
                        key={step.stepNumber}
                        className={`p-4 rounded-lg border-2 ${
                          currentStep === step.stepNumber - 1
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            {step.stepNumber}
                          </div>
                          <span className="text-sm text-muted-foreground">⏱️ {step.time}</span>
                        </div>
                        <p>{step.instruction}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                      disabled={currentStep === 0}
                    >
                      Previous Step
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(Math.min(diyInstructions.steps.length - 1, currentStep + 1))}
                      disabled={currentStep === diyInstructions.steps.length - 1}
                    >
                      Next Step
                    </Button>
                  </div>
                </div>

                {diyInstructions.tips.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Tips</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {diyInstructions.tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {diyInstructions.whereToBuyMaterials.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Where to Buy Materials</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {diyInstructions.whereToBuyMaterials.map((store, i) => (
                        <li key={i}>{store}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
