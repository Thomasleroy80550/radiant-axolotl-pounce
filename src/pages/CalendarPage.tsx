import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BookingPlanningGrid from '@/components/BookingPlanningGrid'; // Import the new component
import MobileBookingList from '@/components/MobileBookingList'; // Import the new mobile list component
import { useIsMobile } from '@/hooks/use-mobile'; // Import useIsMobile hook
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addDays, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { fetchKrossbookingReservations } from '@/lib/krossbooking';
import { getUserRooms, UserRoom } from '@/lib/user-room-api'; // Import user room API

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

const CalendarPage: React.FC = () => {
  // We no longer need isMobile for conditional rendering of the main grid,
  // but it can be kept if other mobile-specific UI elements are planned.
  // const isMobile = useIsMobile(); 
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [userRooms, setUserRooms] = useState<UserRoom[]>([]); // State to store user's rooms
  const [reservations, setReservations] = useState<KrossbookingReservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedUserRooms = await getUserRooms();
        setUserRooms(fetchedUserRooms);

        const roomIds = fetchedUserRooms.map(room => room.room_id);

        if (roomIds.length === 0) {
          setReservations([]);
          setLoading(false);
          return;
        }

        console.log(`DEBUG: Fetching reservations for room IDs: ${roomIds.join(', ')}`);
        const fetchedReservations = await fetchKrossbookingReservations(roomIds);
        setReservations(fetchedReservations);
        console.log("DEBUG: Fetched reservations for user rooms:", fetchedReservations); 
      } catch (err: any) {
        setError(`Erreur lors du chargement des réservations : ${err.message}`);
        console.error("DEBUG: Error in loadData for CalendarPage:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []); // Empty dependency array means this runs once on mount

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Filter reservations for the current month to pass to MobileBookingList
  // This part is no longer strictly needed if MobileBookingList is removed,
  // but keeping it for now as the component is still imported.
  const currentMonthReservations = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return reservations.filter(res => {
      const checkIn = parseISO(res.check_in_date);
      const checkOut = parseISO(res.check_out_date);
      // A reservation is relevant if it starts or ends within the current month, or spans across it
      return (
        (checkIn <= monthEnd && checkOut >= monthStart)
      );
    }).sort((a, b) => parseISO(a.check_in_date).getTime() - parseISO(b.check_in_date).getTime());
  }, [reservations, currentMonth]);


  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Calendrier</h1>
        
        {/* Always render BookingPlanningGrid for a consistent monthly view */}
        <BookingPlanningGrid />
        
        {/* You can keep or remove the "Événements à venir" section as it's separate from the grid */}
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
      </div>
    </MainLayout>
  );
};

export default CalendarPage;