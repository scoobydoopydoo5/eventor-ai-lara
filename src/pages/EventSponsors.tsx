import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-typed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Handshake, Loader2, Mail, Globe, RefreshCw, Languages } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useImageGeneration } from "@/hooks/useImageGeneration";

interface Sponsor {
  id: string;
  name: string;
  industry: string;
  email: string;
  website: string;
  description: string;
  whySuitable: string;
  sponsorshipLevel: string;
}

interface SponsorEmail {
  subject: string;
  body: string;
  language: string;
}

export default function EventSponsors() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [sponsorEmail, setSponsorEmail] = useState<SponsorEmail | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [emailLanguage, setEmailLanguage] = useState("en");
  const { generateImage } = useImageGeneration();
  const [sponsorImages, setSponsorImages] = useState<Record<string, string>>({});

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

  const generateSponsorList = async () => {
    if (!event) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("sponsor-search", {
        body: {
          eventType: event.event_type,
          country: event.country,
          industry: event.event_type,
          budget: event.estimated_budget,
        },
      });

      if (error) throw error;
      const foundSponsors = data.sponsors || [];
      setSponsors(foundSponsors);
      
      // Generate images for each sponsor
      const images: Record<string, string> = {};
      for (const sponsor of foundSponsors) {
        const image = await generateImage(`Professional company logo for ${sponsor.name}, a ${sponsor.industry} company, modern corporate style`, { sponsor });
        if (image) {
          images[sponsor.id] = image;
        }
      }
      setSponsorImages(images);
      
      toast({ title: "Sponsors found!" });
    } catch (error) {
      console.error("Error finding sponsors:", error);
      toast({
        title: "Error",
        description: "Failed to find sponsors",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateEmail = async (sponsor: Sponsor, language = "en") => {
    setSelectedSponsor(sponsor);
    setLoadingEmail(true);
    setShowEmailModal(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-sponsor-email", {
        body: {
          eventName: event?.name,
          eventType: event?.event_type,
          eventDate: event?.event_date,
          sponsorName: sponsor.name,
          sponsorshipLevel: sponsor.sponsorshipLevel,
          language,
        },
      });

      if (error) throw error;
      setSponsorEmail(data.email);
    } catch (error) {
      console.error("Error generating email:", error);
      toast({
        title: "Error",
        description: "Failed to generate email",
        variant: "destructive",
      });
    } finally {
      setLoadingEmail(false);
    }
  };

  const regenerateEmail = async () => {
    if (selectedSponsor) {
      await generateEmail(selectedSponsor, emailLanguage);
    }
  };

  const translateEmail = async (language: string) => {
    setEmailLanguage(language);
    if (selectedSponsor) {
      await generateEmail(selectedSponsor, language);
    }
  };

  const copyToClipboard = () => {
    if (sponsorEmail) {
      navigator.clipboard.writeText(`Subject: ${sponsorEmail.subject}\n\n${sponsorEmail.body}`);
      toast({ title: "Copied to clipboard!" });
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
            <h1 className="text-3xl font-bold">Sponsors</h1>
            <p className="text-muted-foreground">AI-found potential sponsors for your event</p>
          </div>
        </div>

        {sponsors.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Handshake className="h-16 w-16 mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No sponsors found yet</h3>
              <p className="text-muted-foreground mb-4">Find potential sponsors for your event</p>
              <Button onClick={generateSponsorList} disabled={isGenerating}>
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Find Sponsors
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-end">
              <Button onClick={generateSponsorList} disabled={isGenerating}>
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Refresh Sponsors
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sponsors.map((sponsor) => (
                <Card key={sponsor.id}>
                  {sponsorImages[sponsor.id] && (
                    <div className="h-32 w-full overflow-hidden bg-muted flex items-center justify-center">
                      <img 
                        src={sponsorImages[sponsor.id]} 
                        alt={sponsor.name}
                        className="max-h-full max-w-full object-contain p-4"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {sponsor.name}
                      <Badge variant="secondary">{sponsor.sponsorshipLevel}</Badge>
                    </CardTitle>
                    <CardDescription>{sponsor.industry}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">{sponsor.description}</p>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm"><strong>Why suitable:</strong> {sponsor.whySuitable}</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="text-primary">{sponsor.email}</span>
                      </div>
                      {sponsor.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {sponsor.website}
                          </a>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => generateEmail(sponsor)}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Generate Invitation Email
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Email Modal */}
        <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Sponsor Invitation Email: {selectedSponsor?.name}</DialogTitle>
            </DialogHeader>
            {loadingEmail ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : sponsorEmail ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={regenerateEmail}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                  <Select value={emailLanguage} onValueChange={translateEmail}>
                    <SelectTrigger className="w-[200px]">
                      <Languages className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Translate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                  >
                    Copy
                  </Button>
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Textarea
                    id="subject"
                    value={sponsorEmail.subject}
                    onChange={(e) => setSponsorEmail({ ...sponsorEmail, subject: e.target.value })}
                    className="mt-2"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="body">Email Body</Label>
                  <Textarea
                    id="body"
                    value={sponsorEmail.body}
                    onChange={(e) => setSponsorEmail({ ...sponsorEmail, body: e.target.value })}
                    className="mt-2"
                    rows={15}
                  />
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
