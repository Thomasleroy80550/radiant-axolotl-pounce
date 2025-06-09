import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { fetchKrossbookingReservations } from '@/lib/krossbooking';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfYear, endOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getUserRooms, UserRoom } from '@/lib/user-room-api'; // Import user room API

interface Booking {
  id: string;
  guest_name: string;
  property_name: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  amount: string;
  cod_channel?: string;
}

const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userRooms, setUserRooms] = useState<UserRoom[]>([]);

  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedUserRooms = await getUserRooms();
        setUserRooms(fetchedUserRooms);

        const roomIds = fetchedUserRooms.map(room => room.room_id);

        if (roomIds.length === 0) {
          setBookings([]);
          setLoading(false);
          return;
        }

        const fetchedBookings = await fetchKrossbookingReservations(roomIds);
        console.log(`Fetched bookings for BookingsPage (Rooms: ${roomIds.join(', ')}):`, fetchedBookings);

        const currentYear = new Date().getFullYear();
        const yearStart = startOfYear(new Date(currentYear, 0, 1));
        const yearEnd = endOfYear(new Date(currentYear, 0, 1));

        // Filter bookings for the current year
        const filteredBookings = fetchedBookings.filter(booking => {
          const checkInDate = parseISO(booking.check_in_date);
          return isWithinInterval(checkInDate, { start: yearStart, end: yearEnd });
        });

        // Sort bookings by check-in date
        const sortedBookings = filteredBookings.sort((a, b) => {
          const dateA = parseISO(a.check_in_date).getTime();
          const dateB = parseISO(b.check_in_date).getTime();
          return dateA - dateB;
        });

        setBookings(sortedBookings);
      } catch (err: any) {
        setError(`Erreur lors du chargement des réservations : ${err.message}`);
        console.error("Error in loadBookings for BookingsPage:", err);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, []); // Empty dependency array means this runs once on mount

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

  const currentYear = new Date().getFullYear();

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Réservations pour {userRooms.length > 0 ? 'vos chambres' : 'les chambres'} ({currentYear})</h1>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Liste de vos réservations</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-gray-500">Chargement des réservations...</p>}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {!loading && !error && userRooms.length === 0 && (
              <p className="text-gray-500">
                Aucune chambre configurée. Veuillez ajouter des chambres via la page "Mon Profil" pour voir les réservations ici.
              </p>
            )}
            {!loading && !error && userRooms.length > 0 && bookings.length === 0 && (
              <p className="text-gray-500">Aucune réservation trouvée pour vos chambres en {currentYear}.</p>
            )}
            {!loading && !error && bookings.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Réservation</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Propriété</TableHead>
                      <TableHead>Canal</TableHead>
                      <TableHead>Arrivée</TableHead>
                      <TableHead>Départ</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.id}</TableCell>
                        <TableCell>{booking.guest_name}</TableCell>
                        <TableCell>{booking.property_name}</TableCell>
                        <TableCell>{booking.cod_channel || 'N/A'}</TableCell>
                        <TableCell>{format(parseISO(booking.check_in_date), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                        <TableCell>{format(parseISO(booking.check_out_date), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(booking.status)}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{booking.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default BookingsPage;