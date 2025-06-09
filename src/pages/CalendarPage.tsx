import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BookingPlanningGrid from '@/components/BookingPlanningGrid';
import { useIsMobile } from '@/hooks/use-mobile';
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Home, CalendarDays, DollarSign } from 'lucide-react';
import { fetchKrossbookingReservations } from '@/lib/krossbooking';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import CustomCalendarDay from '@/components/CustomCalendarDay'; // Ensure this is imported

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
  const isMobile = useIsMobile(); 
  const [reservations, setReservations] = useState<KrossbookingReservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date()); // For the mobile calendar's month navigation

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

  // Memoized calculation of reservation segments for CustomCalendarDay
  const dayReservationSegments = useMemo(() => {
    const map = new Map<string, { type: 'arrival' | 'departure' | 'middle' | 'single', channel: string }[]>();
    reservations.forEach(res => {
      const checkIn = parseISO(res.check_in_date);
      const checkOut = parseISO(res.check_out_date); // This is the day *after* the last night

      const numberOfNights = differenceInDays(checkOut, checkIn);

      if (numberOfNights <= 0) { 
        return; // Skip invalid reservations (e.g., check-out before or on check-in)
      }

      if (numberOfNights === 1) { // Single night stay
        const dayKey = format(checkIn, 'yyyy-MM-dd');
        const segmentsForDay = map.get(dayKey) || [];
        segmentsForDay.push({
          type: 'single', // New type for single-day bookings
          channel: res.channel_identifier || 'UNKNOWN',
        });
        map.set(dayKey, segmentsForDay);
      } else { // Multi-night stay
        eachDayOfInterval({ start: checkIn, end: addDays(checkOut, -1) }).forEach(day => {
          const dayKey = format(day, 'yyyy-MM-dd');
          let type: 'arrival' | 'departure' | 'middle' | 'single';
          if (isSameDay(day, checkIn)) {
            type = 'arrival';
          } else if (isSameDay(day, addDays(checkOut, -1))) { // Last night of the stay
            type = 'departure';
          } else {
            type = 'middle';
          }

          const segmentsForDay = map.get(dayKey) || [];
          segmentsForDay.push({
            type: type,
            channel: res.channel_identifier || 'UNKNOWN',
          });
          map.set(dayKey, segmentsForDay);
        });
      }
    });
    return map;
  }, [reservations]);

  // Filtered reservations for the list below the calendar (mobile view)
  const filteredReservationsForList = useMemo(() => {
    if (!selectedDate) {
      // If no specific date is selected, show reservations for the current month
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      return reservations.filter(res => {
        const checkIn = parseISO(res.check_in_date);
        const checkOut = parseISO(res.check_out_date);
        return (checkIn <= monthEnd && checkOut >= monthStart);
      }).sort((a, b) => parseISO(a.check_in_date).getTime() - parseISO(b.check_in_date).getTime());
    } else {
      // Show reservations for the selected date
      return reservations.filter(res => {
        const checkIn = parseISO(res.check_in_date);
        const checkOut = parseISO(res.check_out_date);
        // A reservation is relevant if the selected date is between check-in (inclusive) and check-out (exclusive)
        return isSameDay(selectedDate, checkIn) || (selectedDate > checkIn && selectedDate < checkOut);
      }).sort((a, b) => parseISO(a.check_in_date).getTime() - parseISO(b.check_in_date).getTime());
    }
  }, [reservations, selectedDate, currentMonth]);

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'confirmée':
        return 'default';
      case 'pending':
      case 'en attente':
        return 'secondary';
      case 'cancelled':
      case 'annulée':
        return 'destructive';
      default:
        return 'outline';
    }
  };

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
            {isMobile ? (
              <>
                <Card className="shadow-md mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Sélectionner une date</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      month={currentMonth}
                      onMonthChange={setCurrentMonth}
                      locale={fr}
                      className="rounded-md border"
                      numberOfMonths={12} // Display 12 months for mobile
                      components={{
                        Day: (props) => (
                          <CustomCalendarDay
                            {...props}
                            dayReservationSegments={dayReservationSegments}
                            channelColors={channelColors}
                            displayMonth={currentMonth} // Pass currentMonth to CustomCalendarDay
                          />
                        ),
                      }}
                    />
                  </CardContent>
                </Card>

                <Card className="shadow-md mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                      Réservations pour {selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: fr }) : 'le mois en cours'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {filteredReservationsForList.length === 0 ? (
                      <p className="text-gray-500">Aucune réservation trouvée pour cette période.</p>
                    ) : (
                      <div className="space-y-4">
                        {filteredReservationsForList.map((booking) => {
                          const channelInfo = channelColors[booking.channel_identifier || 'UNKNOWN'] || channelColors['UNKNOWN'];
                          return (
                            <Card key={booking.id} className="shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden">
                              <div className={`absolute left-0 top-0 bottom-0 w-2 ${channelInfo.bgColor}`}></div>
                              <CardContent className="p-4 pl-6">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center">
                                    <h3 className="font-bold text-md">{booking.guest_name}</h3>
                                  </div>
                                  <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                  <p className="flex items-center"><Home className="h-4 w-4 mr-2" /> {booking.property_name}</p>
                                  <p className="flex items-center"><CalendarDays className="h-4 w-4 mr-2" /> Du {format(parseISO(booking.check_in_date), 'dd/MM', { locale: fr })} au {format(parseISO(booking.check_out_date), 'dd/MM', { locale: fr })}</p>
                                  <p className="flex items-center"><DollarSign className="h-4 w-4 mr-2" /> {booking.amount} ({channelInfo.name})</p>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <BookingPlanningGrid />
            )}

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