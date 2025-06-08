import React from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { fetchKrossbookingReservations } from '@/lib/krossbooking'; // Import the new utility function
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

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

  // IMPORTANT: Changed KROSSBOOKING_ROOM_ID to '36' as requested.
  const KROSSBOOKING_ROOM_ID = '62'; 

  React.useEffect(() => {
    const loadReservations = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedReservations = await fetchKrossbookingReservations(KROSSBOOKING_ROOM_ID);
        setReservations(fetchedReservations);
      } catch (err: any) {
        setError(`Erreur lors du chargement des réservations : ${err.message}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadReservations();
  }, [KROSSBOOKING_ROOM_ID]); // Re-fetch if room ID changes

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