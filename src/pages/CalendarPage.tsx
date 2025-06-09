import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BookingPlanningGrid from '@/components/BookingPlanningGrid';
import { useIsMobile } from '@/hooks/use-mobile'; // Keep import for potential future use or other mobile-specific UI if needed
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addDays, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Home, CalendarDays, User, DollarSign } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { fetchKrossbookingReservations } from '@/lib/krossbooking';
import { Calendar } from '@/components/ui/calendar'; // Keep import for potential future use or if other parts rely on it
import { Badge } from '@/components/ui/badge';
import CustomCalendarDay from '@/components/CustomCalendarDay'; // Keep import for potential future use

interface KrossbookingReservation {
  id: string;
  guest_name: string;
  property_name: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  amount: string;
  cod_channel?: string;
  ota_id?: string;
  channel_identifier?: string;
}

const defaultRoomId = '36';
const defaultRoomName = 'Ma Chambre par défaut (2c)';

// Mapping des codes de canal Krossbooking vers des noms et couleurs Tailwind CSS
const channelColors: { [key: string]: { name: string; bgColor: string; textColor: string; } } = {
  'AIRBNB': { name: 'Airbnb', bgColor: 'bg-red-600', textColor: 'text-white' },
  'BOOKING': { name: 'Booking.com', bgColor: 'bg-blue-700', textColor: 'text-white' },
  'ABRITEL': { name: 'Abritel', bgColor: 'bg-orange-600', textColor: 'text-white' },
  'DIRECT': { name: 'Direct', bgColor: 'bg-purple-600', textColor: 'text-white' },
  'HELLOKEYS': { name: 'Hello Keys', bgColor: 'bg-green-600', textColor: 'text-white' },
  'UNKNOWN': { name: 'Autre', bgColor: 'bg-gray-600', textColor: 'text-white' },
};

const CalendarPage: React.FC = () => {
  // useIsMobile is still available if you need to conditionally render other elements
  // const isMobile = useIsMobile(); 
  const [reservations, setReservations] = useState<KrossbookingReservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReservations = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`DEBUG: Fetching reservations for single room ID: ${defaultRoomId}`);
        const fetchedReservations = await fetchKrossbookingReservations(defaultRoomId);
        setReservations(fetchedReservations);
        console.log("DEBUG: Fetched reservations for default room:", fetchedReservations); 
      } catch (err: any) {
        setError(`Erreur lors du chargement des réservations : ${err.message}`);
        console.error("DEBUG: Error in loadReservations:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReservations();
  }, []);

  // The dayReservationSegments and filteredReservations useMemos are no longer needed here
  // as BookingPlanningGrid will handle its own filtering based on its internal state.
  // The detailed reservation list below the grid/calendar will also be handled by BookingPlanningGrid.

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Calendrier</h1>
        
        {loading && <p className="text-gray-500">Chargement des réservations...</p>}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && (
          <>
            {/* Always render BookingPlanningGrid */}
            <BookingPlanningGrid />

            {/* You can keep the 'Événements à venir' card here as it's generic */}
            <Card className="shadow-md mt-6">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Événements à venir (Exemple)</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                    <p className="font-medium">15 juillet 2025 : Arrivée de M. Dupont</p>
                    <p className="text-sm text-gray-500">Appartement Paris - 3 nuits</p>
                  </li>
                  <li className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                    <p className="font-medium">20 juillet 2025 : Départ de Mme. Martin</p>
                    <p className="text-sm text-gray-500">Studio Nice</p>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default CalendarPage;