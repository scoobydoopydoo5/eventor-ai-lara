import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMail, FiSend, FiEdit2, FiCopy, FiCheck, FiRefreshCw, FiMessageSquare, FiGlobe, FiAlertCircle, FiPlus, FiX, FiSettings } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeSelector } from '@/components/ThemeSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/lib/supabase-typed';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import Confetti from 'react-confetti';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';

interface Invite {
  id: string;
  short_message?: string;
  long_message?: string;
  email_template?: string;
}

type MessageType = 'short_message' | 'long_message' | 'email_template';
type EmailMode = 'formal' | 'informal' | 'friendly' | 'crazy' | 'semi-formal';

export default function EventInvites() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<MessageType | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [emailMode, setEmailMode] = useState<EmailMode>('friendly');
  const [characterLimit, setCharacterLimit] = useState<number>(500);
  const [customPrompt, setCustomPrompt] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('Spanish');
  const [emailList, setEmailList] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsChanged, setSettingsChanged] = useState(false);
  const [initialSettings, setInitialSettings] = useState({ emailMode, characterLimit });
  const [openSections, setOpenSections] = useState({
    short_message: true,
    long_message: true,
    email_template: true
  });

  useEffect(() => {
    fetchInvite();
  }, [eventId]);

  useEffect(() => {
    if (emailMode !== initialSettings.emailMode || characterLimit !== initialSettings.characterLimit) {
      setSettingsChanged(true);
    } else {
      setSettingsChanged(false);
    }
  }, [emailMode, characterLimit, initialSettings]);

  const fetchInvite = async () => {
    if (!eventId) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('invites')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();

      if (error) throw error;
      setInvite(data || { id: '', short_message: '', long_message: '', email_template: '' });
    } catch (error) {
      console.error('Error fetching invite:', error);
      toast({
        title: "Error",
        description: "Failed to load invitations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (messageType: MessageType) => {
    if (!eventId || !invite) return;

    try {
      const { error } = await (supabase as any)
        .from('invites')
        .upsert({
          event_id: eventId,
          ...invite,
        });

      if (error) throw error;
      setEditingField(null);
      toast({
        title: "Saved",
        description: "Invitation updated"
      });
    } catch (error) {
      console.error('Error saving invite:', error);
      toast({
        title: "Error",
        description: "Failed to save invitation",
        variant: "destructive"
      });
    }
  };

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard"
    });
  };

  const callAI = async (type: string, text: string, messageType: MessageType, additionalParams = {}) => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-ai', {
        body: {
          type,
          text,
          mode: emailMode,
          characterLimit,
          ...additionalParams
        }
      });

      if (error) throw error;
      
      setInvite(prev => ({
        ...prev!,
        [messageType]: data.result
      }));

      if (type === 'generate') {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        setInitialSettings({ emailMode, characterLimit });
        setSettingsChanged(false);
      }

      toast({
        title: "Success",
        description: `${type === 'generate' ? 'Generated' : type === 'paraphrase' ? 'Paraphrased' : 'Processed'} successfully!`
      });
    } catch (error: any) {
      console.error('AI error:', error);
      toast({
        title: "Error",
        description: error.message || "AI operation failed",
        variant: "destructive"
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerate = (messageType: MessageType) => {
    const labels = {
      short_message: 'short message',
      long_message: 'long message',
      email_template: 'email template'
    };
    callAI('generate', labels[messageType], messageType, {
      context: `Event planning invitation for eventId: ${eventId}`
    });
  };

  const handleRegenerateAll = async () => {
    setAiLoading(true);
    try {
      await Promise.all([
        handleGenerate('short_message'),
        handleGenerate('long_message'),
        handleGenerate('email_template')
      ]);
      setInitialSettings({ emailMode, characterLimit });
      setSettingsChanged(false);
    } finally {
      setAiLoading(false);
    }
  };

  const handleParaphrase = (messageType: MessageType) => {
    const currentText = invite?.[messageType] || '';
    if (!currentText) {
      toast({
        title: "No content",
        description: "Please add some text first",
        variant: "destructive"
      });
      return;
    }
    callAI('paraphrase', currentText, messageType);
  };

  const handleTranslate = async (messageType: MessageType) => {
    const currentText = invite?.[messageType] || '';
    if (!currentText) return;

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-ai', {
        body: {
          type: 'translate',
          text: currentText,
          language: selectedLanguage
        }
      });

      if (error) throw error;
      
      setInvite(prev => ({
        ...prev!,
        [messageType]: data.result
      }));

      toast({
        title: "Translated",
        description: `Translated to ${selectedLanguage}`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Translation failed",
        variant: "destructive"
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleFeedback = async (messageType: MessageType) => {
    const currentText = invite?.[messageType] || '';
    if (!currentText) return;

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-ai', {
        body: {
          type: 'feedback',
          text: currentText
        }
      });

      if (error) throw error;
      setFeedbackText(data.result);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Feedback generation failed",
        variant: "destructive"
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleCustomPrompt = async (messageType: MessageType) => {
    if (!customPrompt.trim()) return;

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-ai', {
        body: {
          type: 'custom',
          text: invite?.[messageType] || '',
          context: customPrompt
        }
      });

      if (error) throw error;
      
      setInvite(prev => ({
        ...prev!,
        [messageType]: data.result
      }));

      toast({
        title: "Generated",
        description: "Custom prompt applied"
      });
      setCustomPrompt('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Custom generation failed",
        variant: "destructive"
      });
    } finally {
      setAiLoading(false);
    }
  };

  const addEmail = () => {
    const email = emailInput.trim();
    if (!email) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    if (emailList.includes(email)) {
      toast({
        title: "Duplicate",
        description: "Email already added",
        variant: "destructive"
      });
      return;
    }

    setEmailList([...emailList, email]);
    setEmailInput('');
  };

  const removeEmail = (email: string) => {
    setEmailList(emailList.filter(e => e !== email));
  };

  const handleSendEmails = async () => {
    if (emailList.length === 0) {
      toast({
        title: "No recipients",
        description: "Please add email addresses",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-invites', {
        body: {
          emails: emailList,
          subject: 'You\'re Invited!',
          htmlContent: invite?.email_template || invite?.long_message || invite?.short_message || 'You are invited to our event!'
        }
      });

      if (error) throw error;

      if (data.success) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        toast({
          title: "Emails sent!",
          description: `Successfully sent ${data.sent} emails${data.failed > 0 ? `, ${data.failed} failed` : ''}`
        });
        setSendDialogOpen(false);
        setEmailList([]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send emails",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const formatText = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\*\*/g, '')
      .replace(/\\n\\n/g, '\n\n')
      .replace(/\\n/g, '\n')
      .replace(/\\/g, '')
      .trim();
  };

  const renderMessageCard = (
    title: string,
    messageType: MessageType,
    rows: number = 4
  ) => {
    const currentText = invite?.[messageType] || '';
    const formattedText = formatText(currentText);
    const charCount = formattedText.length;
    const isEditing = editingField === messageType;
    const isOpen = openSections[messageType];

    return (
      <Collapsible
        open={isOpen}
        onOpenChange={(open) => setOpenSections(prev => ({ ...prev, [messageType]: open }))}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="p-0 hover:bg-transparent">
                  <div className="flex items-center gap-2">
                    <FiMail className="h-5 w-5" />
                    <CardTitle className="text-left">{title}</CardTitle>
                    <Badge variant="secondary">{charCount} chars</Badge>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </Button>
              </CollapsibleTrigger>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingField(isEditing ? null : messageType)}
                  title={isEditing ? "View mode" : "Edit mode"}
                >
                  <FiEdit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(formattedText, messageType)}
                  disabled={!currentText}
                >
                  {copiedField === messageType ? <FiCheck className="h-4 w-4" /> : <FiCopy className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleGenerate(messageType)}
                  disabled={aiLoading}
                >
                  <FiRefreshCw className={`h-4 w-4 ${aiLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            <CardDescription>
              Mode: <span className="font-semibold capitalize">{emailMode}</span> | Limit: {characterLimit} chars
            </CardDescription>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <Textarea
                    value={formattedText}
                    onChange={(e) => setInvite({ ...invite!, [messageType]: e.target.value })}
                    rows={rows}
                    placeholder={`Enter ${title.toLowerCase()}...`}
                  />
                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={() => handleSave(messageType)} size="sm">
                      <FiCheck className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleParaphrase(messageType)}
                      disabled={aiLoading || !currentText}
                    >
                      <FiMessageSquare className="h-4 w-4 mr-2" />
                      Paraphrase
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="secondary" size="sm" disabled={!currentText}>
                          <FiGlobe className="h-4 w-4 mr-2" />
                          Translate
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Translate Message</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Select Language</Label>
                            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Spanish">Spanish</SelectItem>
                                <SelectItem value="French">French</SelectItem>
                                <SelectItem value="German">German</SelectItem>
                                <SelectItem value="Italian">Italian</SelectItem>
                                <SelectItem value="Portuguese">Portuguese</SelectItem>
                                <SelectItem value="Chinese">Chinese</SelectItem>
                                <SelectItem value="Japanese">Japanese</SelectItem>
                                <SelectItem value="Korean">Korean</SelectItem>
                                <SelectItem value="Arabic">Arabic</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button onClick={() => handleTranslate(messageType)} disabled={aiLoading} className="w-full">
                            {aiLoading ? 'Translating...' : 'Translate'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="secondary" size="sm" disabled={!currentText}>
                          <FiAlertCircle className="h-4 w-4 mr-2" />
                          Feedback
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>AI Feedback</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {feedbackText ? (
                            <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                              {feedbackText}
                            </div>
                          ) : (
                            <Button onClick={() => handleFeedback(messageType)} disabled={aiLoading} className="w-full">
                              {aiLoading ? 'Generating...' : 'Get Feedback'}
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="secondary" size="sm">
                          <FiMessageSquare className="h-4 w-4 mr-2" />
                          Custom Prompt
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Custom AI Prompt</DialogTitle>
                          <DialogDescription>
                            Describe what you want the AI to generate
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="E.g., Make it more professional, add event details, include RSVP instructions..."
                            rows={4}
                          />
                          <Button
                            onClick={() => handleCustomPrompt(messageType)}
                            disabled={aiLoading || !customPrompt.trim()}
                            className="w-full"
                          >
                            {aiLoading ? 'Generating...' : 'Generate'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap prose prose-sm max-w-none">
                  {formattedText || 'No message yet'}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
      
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/event/${eventId}`)}
            >
              <FiArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gradient">Invitations</h1>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <FiSettings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invitation Settings</DialogTitle>
                  <DialogDescription>
                    Adjust how AI generates your invitations
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Email Mode</Label>
                    <Select value={emailMode} onValueChange={(value) => setEmailMode(value as EmailMode)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="semi-formal">Semi-Formal</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="informal">Informal</SelectItem>
                        <SelectItem value="crazy">Crazy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Character Limit</Label>
                    <Input
                      type="number"
                      value={characterLimit}
                      onChange={(e) => setCharacterLimit(parseInt(e.target.value) || 500)}
                      min={100}
                      max={5000}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <FiSend className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Send Email Invitations</DialogTitle>
                  <DialogDescription>
                    Add email addresses and send your invitations
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                    />
                    <Button onClick={addEmail} size="icon">
                      <FiPlus className="h-4 w-4" />
                    </Button>
                  </div>
                  {emailList.length > 0 && (
                    <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                      {emailList.map((email, i) => (
                        <div key={i} className="flex items-center justify-between bg-muted p-2 rounded">
                          <span className="text-sm">{email}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEmail(email)}
                          >
                            <FiX className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    onClick={handleSendEmails}
                    disabled={sending || emailList.length === 0}
                    className="w-full"
                  >
                    {sending ? 'Sending...' : `Send to ${emailList.length} recipient${emailList.length !== 1 ? 's' : ''}`}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <ThemeSelector />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {settingsChanged && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Settings Changed</p>
                      <p className="text-sm text-muted-foreground">
                        Regenerate invitations to apply new settings
                      </p>
                    </div>
                    <Button onClick={handleRegenerateAll} disabled={aiLoading}>
                      {aiLoading ? (
                        <>
                          <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <FiRefreshCw className="h-4 w-4 mr-2" />
                          Regenerate All
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {renderMessageCard('Short Message', 'short_message', 4)}
            {renderMessageCard('Long Message', 'long_message', 8)}
            {renderMessageCard('Email Template', 'email_template', 12)}
          </div>
        )}
      </div>
    </div>
  );
}
