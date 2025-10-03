import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ClerkAuthProvider } from "./contexts/ClerkAuthContext";
import { ProtectedEventRoute } from "./components/ProtectedEventRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CreateEvent from "./pages/CreateEvent";
import EventPlan from "./pages/EventPlan";
import EventPlanner from "./pages/EventPlanner";
import EventTasks from "./pages/EventTasks";
import EventBudget from "./pages/EventBudget";
import EventDetails from "./pages/EventDetails";
import EventInvites from "./pages/EventInvites";
import EventTimeline from "./pages/EventTimeline";
import EventFullPlan from "./pages/EventFullPlan";
import EventVendors from "./pages/EventVendors";
import EventGuests from "./pages/EventGuests";
import EventInvite from "./pages/EventInvite";
import FindEvents from "./pages/FindEvents";
import JoinByCode from "./pages/JoinByCode";
import NotFound from "./pages/NotFound";
import ManageTickets from "./pages/ManageTickets";
import PurchaseTicket from "./pages/PurchaseTicket";
import AITrivia from "./pages/games/AITrivia";
import Jeopardy from "./pages/games/Jeopardy";
import Quizizz from "./pages/games/Quizizz";
import IceBreakers from "./pages/games/IceBreakers";
import Jokes from "./pages/games/Jokes";
import EmojiGuess from "./pages/games/EmojiGuess";
import RandomTask from "./pages/games/RandomTask";
import AttendeeCreate from "./pages/AttendeeCreate";
import AttendeeCreateModes from "./pages/AttendeeCreateModes";
import AttendeePlan from "./pages/AttendeePlan";
import AttendeeGifts from "./pages/AttendeeGifts";
import AttendeeOutfits from "./pages/AttendeeOutfits";
import AttendeeGuide from "./pages/AttendeeGuide";
import AttendeeEtiquette from "./pages/AttendeeEtiquette";
import EventSpeeches from "./pages/EventSpeeches";
import EventFAQs from "./pages/EventFAQs";
import EventChat from "./pages/EventChat";
import EventCall from "./pages/EventCall";
import EventBlogs from "./pages/EventBlogs";
import EventBlogPost from "./pages/EventBlogPost";
import ManageBlogs from "./pages/ManageBlogs";
import EventWinner from "./pages/EventWinner";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Pricing from "./pages/Pricing";
import EventFood from "./pages/EventFood";
import EventSouvenirs from "./pages/EventSouvenirs";
import EventWeather from "./pages/EventWeather";
import EventSponsors from "./pages/EventSponsors";
import CheckIn from "./pages/CheckIn";
import EventTheme from "./pages/EventTheme";
import EventFlights from "./pages/EventFlights";
import EventDecor from "./pages/EventDecor";
import EventLocation from "./pages/EventLocation";
import Surveys from "./pages/Surveys";
import CreateSurvey from "./pages/CreateSurvey";
import FillSurvey from "./pages/FillSurvey";
import EventMemories from "./pages/EventMemories";
import Docs from "./pages/Docs";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <ClerkAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create" element={<CreateEvent />} />
            <Route path="/find-events" element={<FindEvents />} />
            <Route path="/join-by-code" element={<JoinByCode />} />
            <Route path="/event/:eventId" element={<ProtectedEventRoute><EventPlan /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/plan" element={<ProtectedEventRoute><EventPlanner /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/details" element={<ProtectedEventRoute><EventDetails /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/budget" element={<ProtectedEventRoute><EventBudget /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/invites" element={<ProtectedEventRoute><EventInvites /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/timeline" element={<ProtectedEventRoute><EventTimeline /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/full-plan" element={<ProtectedEventRoute><EventFullPlan /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/vendors" element={<ProtectedEventRoute><EventVendors /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/guests" element={<ProtectedEventRoute allowPublic><EventGuests /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/manage-tickets" element={<ProtectedEventRoute><ManageTickets /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/purchase-ticket" element={<ProtectedEventRoute allowPublic><PurchaseTicket /></ProtectedEventRoute>} />
            <Route path="/invite/:eventId" element={<ProtectedEventRoute allowPublic><EventInvite /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/games/trivia/:roomCode" element={<ProtectedEventRoute allowPublic><AITrivia /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/games/jeopardy/:roomCode" element={<ProtectedEventRoute allowPublic><Jeopardy /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/games/quizizz/:roomCode" element={<ProtectedEventRoute allowPublic><Quizizz /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/games/icebreakers/:roomCode" element={<ProtectedEventRoute allowPublic><IceBreakers /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/games/jokes/:roomCode" element={<ProtectedEventRoute allowPublic><Jokes /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/games/emoji/:roomCode" element={<ProtectedEventRoute allowPublic><EmojiGuess /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/games/task/:roomCode" element={<ProtectedEventRoute allowPublic><RandomTask /></ProtectedEventRoute>} />
            <Route path="/attendee-create/:eventId" element={<ProtectedEventRoute allowPublic><AttendeeCreate /></ProtectedEventRoute>} />
            <Route path="/attendee-create-modes/:eventId" element={<ProtectedEventRoute allowPublic><AttendeeCreateModes /></ProtectedEventRoute>} />
            <Route path="/attendee/:eventId" element={<ProtectedEventRoute allowPublic><AttendeePlan /></ProtectedEventRoute>} />
            <Route path="/attendee/:eventId/gifts" element={<ProtectedEventRoute allowPublic><AttendeeGifts /></ProtectedEventRoute>} />
            <Route path="/attendee/:eventId/outfits" element={<ProtectedEventRoute allowPublic><AttendeeOutfits /></ProtectedEventRoute>} />
            <Route path="/attendee/:eventId/guide" element={<ProtectedEventRoute allowPublic><AttendeeGuide /></ProtectedEventRoute>} />
            <Route path="/attendee/:eventId/etiquette" element={<ProtectedEventRoute allowPublic><AttendeeEtiquette /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/speeches" element={<ProtectedEventRoute><EventSpeeches /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/faqs" element={<ProtectedEventRoute allowPublic><EventFAQs /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/chat" element={<ProtectedEventRoute><EventChat /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/call" element={<ProtectedEventRoute><EventCall /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/blogs" element={<ProtectedEventRoute allowPublic><EventBlogs /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/blogs/:blogNumber" element={<ProtectedEventRoute allowPublic><EventBlogPost /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/manage-blogs" element={<ProtectedEventRoute><ManageBlogs /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/event-winner" element={<ProtectedEventRoute allowPublic><EventWinner /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/food" element={<ProtectedEventRoute><EventFood /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/souvenirs" element={<ProtectedEventRoute><EventSouvenirs /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/weather" element={<ProtectedEventRoute allowPublic><EventWeather /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/sponsors" element={<ProtectedEventRoute><EventSponsors /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/theme" element={<ProtectedEventRoute><EventTheme /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/flights" element={<ProtectedEventRoute><EventFlights /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/decor" element={<ProtectedEventRoute><EventDecor /></ProtectedEventRoute>} />
            <Route path="/event/:eventId/location" element={<ProtectedEventRoute allowPublic><EventLocation /></ProtectedEventRoute>} />
            <Route path="/check-in/:eventId/:attendeeName" element={<ProtectedEventRoute allowPublic><CheckIn /></ProtectedEventRoute>} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/p/:username" element={<PublicProfile />} />
            <Route path="/p/user/:userId" element={<PublicProfile />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/surveys" element={<Surveys />} />
            <Route path="/create-survey" element={<CreateSurvey />} />
            <Route path="/survey/:surveyId" element={<FillSurvey />} />
            <Route path="/event/:eventId/memories" element={<ProtectedEventRoute><EventMemories /></ProtectedEventRoute>} />
            <Route path="/docs" element={<Docs />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ClerkAuthProvider>
  </ThemeProvider>
</QueryClientProvider>
);

export default App;
