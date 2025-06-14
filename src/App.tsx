import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import CalendarPage from "./pages/CalendarPage";
import BookingsPage from "./pages/BookingsPage";
import PerformancePage from "./pages/PerformancePage";
import ReviewsPage from "./pages/ReviewsPage";
import AccountingPage from "./pages/AccountingPage";
import BalancesPage from "./pages/BalancesPage";
import ReportsPage from "./pages/ReportsPage";
import HelpPage from "./pages/HelpPage";
import ModulesPage from "./pages/ModulesPage";
import RoadmapPage from "./pages/RoadmapPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import PageCreator from "./components/PageCreator";
import ContentPage from "./pages/ContentPage";
import ProfilePage from "./pages/ProfilePage";
import GoogleSheetDataPage from "./pages/GoogleSheetDataPage"; // Import the new GoogleSheetDataPage
import { SessionContextProvider } from "./components/SessionContextProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/pages" element={<PageCreator />} />
            <Route path="/pages/:slug" element={<ContentPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/my-google-sheet-data" element={<GoogleSheetDataPage />} /> {/* New route for Google Sheet Data Page */}
            <Route path="/" element={<DashboardPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/performance" element={<PerformancePage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/accounting" element={<AccountingPage />} />
            <Route path="/balances" element={<BalancesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/modules" element={<ModulesPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;