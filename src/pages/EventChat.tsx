import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase-typed";
import { ArrowLeft, Send, Plus, Trash2, Phone, Settings, Download, Edit2, ChevronLeft, ChevronRight, MessageSquare, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Typewriter from "typewriter-effect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
}

interface ChatSession {
  id: string;
  title: string;
  chat_type: string;
  created_at: string;
}

const EventChat = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [chatType, setChatType] = useState("general");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [renameSessionId, setRenameSessionId] = useState<string | null>(null);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [messageReactions, setMessageReactions] = useState<Record<number, string>>({});
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEventData();
    fetchSessions();
  }, [eventId]);

  useEffect(() => {
    if (currentSessionId) {
      loadSessionMessages(currentSessionId);
    }
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchEventData = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load event data",
        variant: "destructive",
      });
      return;
    }

    setEventData(data);
  };

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from('event_chat_sessions')
      .select('*')
      .eq('event_id', eventId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return;
    }

    setSessions(data || []);
    if (data && data.length > 0 && !currentSessionId) {
      setCurrentSessionId(data[0].id);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    const { data, error } = await supabase
      .from('event_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages((data || []).map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      id: msg.id
    })));
  };

  const createNewSession = async () => {
    const { data, error } = await supabase
      .from('event_chat_sessions')
      .insert({
        event_id: eventId,
        title: `Chat ${new Date().toLocaleString()}`,
        chat_type: chatType
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
      return;
    }

    setSessions([data, ...sessions]);
    setCurrentSessionId(data.id);
    setMessages([]);
  };

  const deleteSession = async (sessionId: string) => {
    const { error } = await supabase
      .from('event_chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive",
      });
      return;
    }

    setSessions(sessions.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(sessions[0]?.id || null);
      setMessages([]);
    }
  };

  const openRenameDialog = (sessionId: string, currentTitle: string) => {
    setRenameSessionId(sessionId);
    setNewSessionTitle(currentTitle);
    setIsRenameDialogOpen(true);
  };

  const handleRenameSession = async () => {
    if (!renameSessionId || !newSessionTitle.trim()) return;

    const { error } = await supabase
      .from('event_chat_sessions')
      .update({ title: newSessionTitle.trim() })
      .eq('id', renameSessionId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to rename chat",
        variant: "destructive",
      });
      return;
    }

    setSessions(sessions.map(s => 
      s.id === renameSessionId ? { ...s, title: newSessionTitle.trim() } : s
    ));
    
    setIsRenameDialogOpen(false);
    setRenameSessionId(null);
    setNewSessionTitle("");
    
    toast({
      title: "Success",
      description: "Chat renamed successfully",
    });
  };

  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    if (!currentSessionId) return;

    const { error } = await supabase
      .from('event_chat_messages')
      .insert({
        session_id: currentSessionId,
        role,
        content
      });

    if (error) {
      console.error('Error saving message:', error);
    }

    await supabase
      .from('event_chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentSessionId);
  };

  const streamChat = async (userMessage: string, regenerate = false) => {
    if (!currentSessionId) {
      await createNewSession();
    }

    let currentMessages = [...messages];
    
    if (regenerate) {
      // Remove last assistant message if regenerating
      if (messages[messages.length - 1]?.role === 'assistant') {
        currentMessages = messages.slice(0, -1);
        setMessages(currentMessages);
      }
    } else {
      const userMsg: Message = { role: 'user', content: userMessage };
      currentMessages = [...messages, userMsg];
      setMessages(currentMessages);
      await saveMessage('user', userMessage);
    }

    setIsLoading(true);
    const assistantMessageIndex = currentMessages.length;
    setTypingMessageIndex(assistantMessageIndex);

    let assistantContent = "";
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/event-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: currentMessages,
          eventData,
          chatType
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to start stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const processLine = (line: string) => {
        if (!line.startsWith('data: ')) return;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') return;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
              }
              return [...prev, { role: 'assistant', content: assistantContent }];
            });
          }
        } catch (e) {
          console.error('Parse error:', e);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        lines.forEach(processLine);
      }

      if (buffer) {
        buffer.split('\n').forEach(processLine);
      }

      setTypingMessageIndex(null);
      await saveMessage('assistant', assistantContent);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "Failed to get response from Evento",
        variant: "destructive",
      });
      setTypingMessageIndex(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReaction = (messageIndex: number, reaction: string) => {
    setMessageReactions(prev => ({
      ...prev,
      [messageIndex]: prev[messageIndex] === reaction ? '' : reaction
    }));
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    streamChat(input, false);
    setInput("");
  };

  const generateSummary = async () => {
    const summaryText = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    const blob = new Blob([summaryText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-summary-${Date.now()}.txt`;
    a.click();
  };

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const promptTemplates = [
    "Help me create a budget breakdown",
    "Suggest venue ideas for my event",
    "Create a detailed timeline",
    "What tasks should I prioritize?",
    "Give me decoration ideas"
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newSessionTitle}
              onChange={(e) => setNewSessionTitle(e.target.value)}
              placeholder="Enter new chat name..."
              onKeyPress={(e) => e.key === 'Enter' && handleRenameSession()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameSession}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Desktop Sidebar */}
      <div className={`hidden md:flex ${isSidebarCollapsed ? 'w-16' : 'w-80'} border-r border-border bg-card transition-all duration-300 flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <h2 className="font-semibold">Chats</h2>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="ml-auto"
          >
            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Sidebar Content */}
        {!isSidebarCollapsed && (
          <>
            <div className="p-4 space-y-2">
              <Button
                onClick={createNewSession}
                className="w-full"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Chat
              </Button>
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Separator />

            <ScrollArea className="flex-1 p-2">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className={`group p-3 mb-1 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors ${
                    currentSessionId === session.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => setCurrentSessionId(session.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{session.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{session.chat_type}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          openRenameDialog(session.id, session.title);
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>

            <Separator />

            <div className="p-4 space-y-2">
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={generateSummary}
                disabled={messages.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Chat
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden fixed top-4 left-4 z-50 bg-card"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chats
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col h-full">
            <div className="p-4 space-y-2">
              <Button
                onClick={createNewSession}
                className="w-full"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Chat
              </Button>
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Separator />

            <ScrollArea className="flex-1 p-2">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className={`group p-3 mb-1 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors ${
                    currentSessionId === session.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => setCurrentSessionId(session.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{session.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{session.chat_type}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          openRenameDialog(session.id, session.title);
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>

            <Separator />

            <div className="p-4 space-y-2">
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={generateSummary}
                disabled={messages.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Chat
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-0 ml-0">
        {/* Header */}
        <div className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/event/${eventId}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-xl font-semibold">Chat with Evento</h1>
          </div>

          <div className="flex items-center gap-2">
            <Select value={chatType} onValueChange={setChatType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Chat</SelectItem>
                <SelectItem value="budget">Budget Planning</SelectItem>
                <SelectItem value="venue">Venue & Logistics</SelectItem>
                <SelectItem value="timeline">Timeline Planning</SelectItem>
                <SelectItem value="plan">Full Event Plan</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/event/${eventId}/call`)}
            >
              <Phone className="mr-2 h-4 w-4" />
              Call
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Chat Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Font Size: {fontSize}px</Label>
                    <Input
                      type="range"
                      min="12"
                      max="24"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}
              >
                <div className="flex flex-col gap-2 max-w-[80%]">
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {msg.role === 'assistant' ? (
                      idx === typingMessageIndex ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <Typewriter
                            options={{
                              strings: [msg.content],
                              autoStart: true,
                              delay: 10,
                              cursor: '',
                            }}
                          />
                        </div>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          {messageReactions[idx] || '😊'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align={msg.role === 'user' ? 'end' : 'start'}>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReaction(idx, '👍')}
                            className="h-8 w-8 p-0"
                          >
                            👍
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReaction(idx, '❤️')}
                            className="h-8 w-8 p-0"
                          >
                            ❤️
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReaction(idx, '😊')}
                            className="h-8 w-8 p-0"
                          >
                            😊
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReaction(idx, '😢')}
                            className="h-8 w-8 p-0"
                          >
                            😢
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    
                    {msg.role === 'assistant' && idx === messages.length - 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => streamChat(input, true)}
                        disabled={isLoading}
                        className="h-6 px-2"
                        title="Regenerate response"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <p className="animate-pulse">Evento is typing...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border bg-card p-6">
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {promptTemplates.map((template, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                  onClick={() => setInput(template)}
                >
                  {template}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask Evento anything about your event..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventChat;