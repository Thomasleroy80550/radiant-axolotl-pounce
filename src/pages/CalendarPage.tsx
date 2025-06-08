import React from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { fetchKrossbookingReservations } from '@/lib/krossbooking';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { eachDayOfInterval, parseISO, isSameDay, addDays } from 'date-fns'; // Import addDays

interface KrossbookingReservation {
  id: string;
  guest_name: string;
  property_name: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  amount: string;
  // Add other fields as per Krossbooking API response
}

const CalendarPage: React.FC = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [reservations, setReservations] = React.useState<KrossbookingReservation[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // New states for distinct highlighted dates
  const [arrivalDates, setArrivalDates] = React.useState<Date[]>([]);
  const [departureDates, setDepartureDates] = React.useState<Date[]>([]);
  const [middleDates, setMiddleDates] = React.useState<Date[]>([]);

  const KROSSBOOKING_ROOM_ID = '62'; 

  React.useEffect(() => {
    const loadReservations = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedReservations = await fetchKrossbookingReservations(KROSSBOOKING_ROOM_ID);
        setReservations(fetchedReservations);

        const newArrivalDates: Date[] = [];
        const newDepartureDates: Date[] = [];
        const newMiddleDates: Date[] = [];

        fetchedReservations.forEach(res => {
          try {
            const start = parseISO(res.check_in_date);
            const end = parseISO(res.check_out_date);

            newArrivalDates.push(start);
            // Departure day is the day *before* the actual check-out for styling purposes
            // If check-in and check-out are the same day, it's just an arrival/departure
            if (!isSameDay(start, end)) {
              newDepartureDates.push(end);
            }
            
            // Calculate middle days
            const intervalDays = eachDayOfInterval({ start: addDays(start, 1), end: addDays(end, -1) });
            newMiddleDates.push(...intervalDays);

          } catch (dateError) {
            console.error("Error parsing date for reservation:", res, dateError);
          }
        });
        
        setArrivalDates(newArrivalDates);
        setDepartureDates(newDepartureDates);
        setMiddleDates(newMiddleDates);

      } catch (err: any) {
        setError(`Erreur lors du chargement des réservations : ${err.message}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadReservations();
  }, [KROSSBOOKING_ROOM_ID]);

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Calendrier</h1>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Votre calendrier des réservations</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border shadow"
              modifiers={{ 
                arrival: arrivalDates, 
                departure: departureDates, 
                reservedMiddle: middleDates 
              }}
              modifiersClassNames={{ 
                arrival: 'rdp-day_arrival', 
                departure: 'rdp-day_departure', 
                reservedMiddle: 'rdp-day_reserved-middle' 
              }}
            />
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              Date sélectionnée : {date ? date.toLocaleDateString('fr-FR') : 'Aucune'}
            </p>

            <div className="mt-6 w-full">
              <h2 className="text-xl font-semibold mb-3">Réservations Krossbooking</h2>
              {loading && <p className="text-gray-500">Chargement des réservations...</p>}
              {error && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Erreur</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {!loading && !error && reservations.length === 0 && (
                <p className="text-gray-500">Aucune réservation trouvée pour ce logement.</p>
              )}
              {!loading && !error && reservations.length > 0 && (
                <ul className="space-y-2">
                  {reservations.map((res) => (
                    <li key={res.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                      <p className="font-medium">
                        {res.guest_name} - Propriété ID: {res.property_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Du {new Date(res.check_in_date).toLocaleDateString('fr-FR')} au {new Date(res.check_out_date).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-sm text-gray-500">Statut: {res.status} - Montant: {res.amount}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 w-full">
              <h2 className="text-xl font-semibold mb-3">Légende du calendrier</h2>
              <div className="flex flex-wrap gap-4 mt-2">
                <div className="flex items-center">
                  <span className="w-4 h-4 mr-2 bg-green-500 [mask-image:linear-gradient(to_bottom_right,transparent_48%,black_48%,black_52%,transparent_52%)] [mask-size:100%_100%] [mask-repeat:no-repeat]"></span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Arrivée (ligne diagonale verte)</span>
                </div>
                <div className="flex items-center">
                  <span className="w-4 h-4 mr-2 bg-red-500 [mask-image:linear-gradient(to_bottom_left,transparent_48%,black_48%,black_52%,transparent_52%)] [mask-size:100%_100%] [mask-repeat:no-repeat]"></span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Départ (ligne diagonale rouge)</span>
                </div>
                <div className="flex items-center">
                  <span className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: 'hsl(var(--calendar-reserved-bg))' }}></span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Nuit réservée (fond coloré)</span>
                </div>
              </div>
            </div>

            <div className="mt-6 w-full">
              <h2 className="text-xl font-semibold mb-3">Événements à venir (Exemple)</h2>
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
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default CalendarPage;