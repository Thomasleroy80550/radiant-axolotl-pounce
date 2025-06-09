import React from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, CalendarDays, User, DollarSign } from 'lucide-react';

interface MobileBookingListProps {
  reservations: {
    id: string;
    guest_name: string;
    property_name: string;
    check_in_date: string;
    check_out_date: string;
    status: string;
    amount: string;
    cod_channel?: string;
  }[];
  loading: boolean;
  error: string | null;
}

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

const MobileBookingList: React.FC<MobileBookingListProps> = ({ reservations, loading, error }) => {
  if (loading) {
    return <p className="text-gray-500">Chargement des réservations...</p>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Erreur !</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  if (reservations.length === 0) {
    return <p className="text-gray-500">Aucune réservation trouvée pour le mois en cours.</p>;
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Réservations du mois</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reservations.map((booking) => (
          <div key={booking.id} className="border-b pb-4 last:border-b-0 last:pb-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-md">{booking.guest_name}</h3>
              <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p className="flex items-center"><Home className="h-4 w-4 mr-2" /> {booking.property_name}</p>
              <p className="flex items-center"><CalendarDays className="h-4 w-4 mr-2" /> Du {format(parseISO(booking.check_in_date), 'dd/MM', { locale: fr })} au {format(parseISO(booking.check_out_date), 'dd/MM', { locale: fr })}</p>
              <p className="flex items-center"><DollarSign className="h-4 w-4 mr-2" /> {booking.amount} ({booking.cod_channel || 'N/A'})</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MobileBookingList;