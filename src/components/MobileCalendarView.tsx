import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Home, CalendarDays, DollarSign } from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

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

interface MobileCalendarViewProps {
  reservations: KrossbookingReservation[];
  loading: boolean;
  error: string | null;
  channelColors: { [key: string]: { name: string; bgColor: string; textColor: string; } };
}

const MobileCalendarView: React.FC<MobileCalendarViewProps> = ({ reservations, loading, error, channelColors }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const filteredReservations = useMemo(() => {
    if (!selectedDate) {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      return reservations.filter(res => {
        const checkIn = parseISO(res.check_in_date);
        const checkOut = parseISO(res.check_out_date);
        return (checkIn <= monthEnd && checkOut >= monthStart);
      }).sort((a, b) => parseISO(a.check_in_date).getTime() - parseISO(b.check_in_date).getTime());
    } else {
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
            // No need for components.Day here, as we're not trying to draw bars on the calendar itself
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
          {loading && <p className="text-gray-500">Chargement des réservations...</p>}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!loading && !error && filteredReservations.length === 0 ? (
            <p className="text-gray-500">Aucune réservation trouvée pour cette période.</p>
          ) : (
            <div className="space-y-4">
              {filteredReservations.map((booking) => {
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
  );
};

export default MobileCalendarView;