import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSearch, FiLoader, FiExternalLink, FiPlus, FiX, FiShoppingCart } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ThemeSelector } from '@/components/ThemeSelector';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase-typed';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Vendor {
  id: string;
  name: string;
  category: string;
  description: string;
  price?: string;
  rating?: string;
  availability?: string;
  link?: string;
  added?: boolean;
}

export default function EventVendors() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [addedVendors, setAddedVendors] = useState<Vendor[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    fetchEventAndVendors();
  }, [eventId]);

  const fetchEventAndVendors = async () => {
    if (!eventId) return;
    
    try {
      const { data: eventData, error: eventError } = await (supabase as any)
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);
      
      // Load saved vendors from database
      const { data: savedVendors, error: vendorsError } = await supabase
        .from('vendors')
        .select('*')
        .eq('event_id', eventId);
      
      if (!vendorsError && savedVendors) {
        setAddedVendors(savedVendors.map(v => ({ ...v, added: true })));
      }
      
      // Auto-generate vendors on first load if none exist
      if (eventData && (!savedVendors || savedVendors.length === 0)) {
        await generateVendors(eventData);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        title: "Error",
        description: "Failed to load event data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateVendors = async (eventData?: any) => {
    const eventInfo = eventData || event;
    if (!eventInfo) return;

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('vendor-search', {
        body: {
          eventType: eventInfo.event_type,
          location: eventInfo.location_name || eventInfo.country,
          state: eventInfo.state,
          country: eventInfo.country,
          budget: eventInfo.estimated_budget,
          guests: eventInfo.estimated_guests,
          searchQuery
        }
      });

      if (error) throw error;
      setVendors(data.vendors || []);
      
      toast({
        title: "Vendors Found",
        description: `Found ${data.vendors?.length || 0} recommended vendors`
      });
    } catch (error: any) {
      console.error('Error generating vendors:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to find vendors",
        variant: "destructive"
      });
    } finally {
      setAiLoading(false);
    }
  };

  const addVendor = async (vendor: Vendor) => {
    if (!addedVendors.find(v => v.id === vendor.id)) {
      try {
        // Save to database
        const { error } = await supabase
          .from('vendors')
          .insert({
            event_id: eventId,
            name: vendor.name,
            category: vendor.category,
            description: vendor.description,
            price: vendor.price,
            rating: vendor.rating,
            availability: vendor.availability,
            link: vendor.link
          });

        if (error) throw error;

        setAddedVendors([...addedVendors, { ...vendor, added: true }]);
        setVendors(vendors.map(v => v.id === vendor.id ? { ...v, added: true } : v));
        toast({
          title: "Added",
          description: `${vendor.name} added to your event`
        });
      } catch (error: any) {
        console.error('Error adding vendor:', error);
        toast({
          title: "Error",
          description: "Failed to add vendor",
          variant: "destructive"
        });
      }
    }
  };

  const removeVendor = async (vendorId: string) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('event_id', eventId)
        .eq('id', vendorId);

      if (error) throw error;

      setAddedVendors(addedVendors.filter(v => v.id !== vendorId));
      setVendors(vendors.map(v => v.id === vendorId ? { ...v, added: false } : v));
      toast({
        title: "Removed",
        description: "Vendor removed from your event"
      });
    } catch (error: any) {
      console.error('Error removing vendor:', error);
      toast({
        title: "Error",
        description: "Failed to remove vendor",
        variant: "destructive"
      });
    }
  };

  const calculateTotal = () => {
    return addedVendors.reduce((total, vendor) => {
      if (vendor.price) {
        const price = parseFloat(vendor.price.replace(/[^0-9.]/g, ''));
        return total + (isNaN(price) ? 0 : price);
      }
      return total;
    }, 0);
  };

  const handleSearch = () => {
    generateVendors();
  };

  const renderVendorCard = (vendor: Vendor) => (
    <Card key={vendor.id} className="hover:shadow-lg transition-all">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {vendor.name}
              {vendor.link && (
                <a 
                  href={vendor.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80"
                >
                  <FiExternalLink className="h-4 w-4" />
                </a>
              )}
            </CardTitle>
            <CardDescription>
              <Badge variant="secondary" className="mt-1">{vendor.category}</Badge>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{vendor.description}</p>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          {vendor.price && (
            <div>
              <span className="font-semibold">Price:</span> {vendor.price}
            </div>
          )}
          {vendor.rating && (
            <div>
              <span className="font-semibold">Rating:</span> {vendor.rating}
            </div>
          )}
          {vendor.availability && (
            <div className="col-span-2">
              <span className="font-semibold">Availability:</span> {vendor.availability}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          {vendor.link && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(vendor.link, '_blank')}
              className="flex-1"
            >
              <FiExternalLink className="h-4 w-4 mr-2" />
              Book
            </Button>
          )}
          {vendor.added ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => removeVendor(vendor.id)}
              className="flex-1"
            >
              <FiX className="h-4 w-4 mr-2" />
              Remove
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => addVendor(vendor)}
              className="flex-1"
            >
              <FiPlus className="h-4 w-4 mr-2" />
              Add
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
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
            <h1 className="text-2xl font-bold text-gradient">Vendor Recommendations</h1>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Find Vendors</CardTitle>
                <CardDescription>
                  AI-powered vendor recommendations based on your event details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search for specific vendors or services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={aiLoading}>
                    {aiLoading ? (
                      <FiLoader className="h-4 w-4 animate-spin" />
                    ) : (
                      <FiSearch className="h-4 w-4" />
                    )}
                  </Button>
                  <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Settings</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Search Settings</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Vendors are automatically recommended based on your event details:
                        </p>
                        <ul className="text-sm space-y-1">
                          <li>• Event Type: {event?.event_type}</li>
                          <li>• Location: {event?.location_name || event?.country}</li>
                          <li>• Budget: ${event?.estimated_budget || 'Not set'}</li>
                          <li>• Guests: {event?.estimated_guests || 'Not set'}</li>
                        </ul>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Added Vendors Summary */}
            {addedVendors.length > 0 && (
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FiShoppingCart className="h-5 w-5" />
                    Added to Event ({addedVendors.length})
                  </CardTitle>
                  <CardDescription>
                    Total estimated cost: ${calculateTotal().toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {addedVendors.map(vendor => (
                      <div key={vendor.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{vendor.name}</p>
                          <p className="text-sm text-muted-foreground">{vendor.price || 'Price TBD'}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVendor(vendor.id)}
                        >
                          <FiX className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vendor List */}
            {aiLoading ? (
              <div className="text-center py-12">
                <FiLoader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Finding the best vendors for your event...</p>
              </div>
            ) : vendors.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {vendors.map(renderVendorCard)}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    Click search to find vendors for your event
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
