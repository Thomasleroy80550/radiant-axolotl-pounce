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
import Login from "./pages/Login"; // Import the new Login page
import { SessionContextProvider } from "./components/SessionContextProvider"; // Import the new SessionContextProvider

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider> {/* Wrap routes with SessionContextProvider */}
          <Routes>
            <Route path="/login" element={<Login />} /> {/* Add the login route */}
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