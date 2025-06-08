import React, { useState, useEffect, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addDays, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale'; // Pour le formatage en français
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { fetchKrossbookingReservations } from '@/lib/krossbooking';

interface KrossbookingReservation {
  id: string;
  guest_name: string;
  property_name: string; // This will now be the actual room ID from Krossbooking
  check_in_date: string;
  check_out_date: string;
  status: string;
  amount: string;
  cod_channel?: string; // Nouveau champ pour le code du canal (ex: 'AIRBNB', 'BOOKING')
  ota_id?: string;      // Nouveau champ pour l'ID de référence du canal
  channel_identifier?: string; // Utilisé pour la logique de couleur dans le calendrier
}

// Définir l'ID et le nom de la chambre par défaut à afficher
const defaultRoomId = '36'; // Remplacez par l'ID de la chambre Krossbooking que vous souhaitez afficher
const defaultRoomName = 'Ma Chambre par défaut (2c)'; // Nom affiché pour cette chambre

// Mapping des codes de canal Krossbooking vers des noms et couleurs Tailwind CSS
const channelColors: { [key: string]: { name: string; bgColor: string; textColor: string; } } = {
  'AIRBNB': { name: 'Airbnb', bgColor: 'bg-red-600', textColor: 'text-white' },
  'BOOKING': { name: 'Booking.com', bgColor: 'bg-blue-700', textColor: 'text-white' },
  'ABRITEL': { name: 'Abritel', bgColor: 'bg-orange-600', textColor: 'text-white' },
  'DIRECT': { name: 'Direct', bgColor: 'bg-purple-600', textColor: 'text-white' },
  'HELLOKEYS': { name: 'Hello Keys', bgColor: 'bg-green-600', textColor: 'text-white' }, // Added Hello Keys
  'UNKNOWN': { name: 'Autre', bgColor: 'bg-gray-600', textColor: 'text-white' },
};

const BookingPlanningGrid: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
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

  const dayCellWidth = 40; // px, adjust as needed for visual spacing

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Planning des Réservations</CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-lg">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </span>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 overflow-x-auto">
        {loading && <p className="text-gray-500">Chargement des réservations...</p>}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!loading && !error && reservations.length === 0 && (
          <p className="text-gray-500">Aucune réservation trouvée pour la chambre "{defaultRoomName}".</p>
        )}
        {!loading && !error && reservations.length > 0 && (
          <div className="grid-container" style={{
            gridTemplateColumns: `minmax(150px, 0.5fr) repeat(${daysInMonth.length}, ${dayCellWidth}px)`,
            minWidth: `${150 + daysInMonth.length * dayCellWidth}px` // Ensure minimum width for scroll
          }}>
            {/* Header Row: Empty cell + Day numbers */}
            <div className="grid-cell header-cell sticky left-0 z-10 bg-white dark:bg-gray-950 border-b border-r"></div>
            {daysInMonth.map((day, index) => (
              <div
                key={index}
                className="grid-cell header-cell text-center font-semibold border-b border-r"
                style={{ width: `${dayCellWidth}px` }}
              >
                {format(day, 'dd', { locale: fr })}
              </div>
            ))}

            {/* Header Row: Empty cell + Day names */}
            <div className="grid-cell header-cell sticky left-0 z-10 bg-white dark:bg-gray-950 border-b border-r"></div>
            {daysInMonth.map((day, index) => (
              <div
                key={`day-name-${index}`}
                className="grid-cell header-cell text-center text-xs text-gray-500 border-b border-r"
                style={{ width: `${dayCellWidth}px` }}
              >
                {format(day, 'EEE', { locale: fr })}
              </div>
            ))}

            {/* Single Property Row */}
            <React.Fragment>
              {/* Property Name Cell */}
              <div className="grid-cell property-name-cell sticky left-0 z-10 bg-white dark:bg-gray-950 border-r border-b flex items-center px-2">
                <Home className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium text-sm">{defaultRoomName}</span>
              </div>

              {/* Day Cells (Background Grid) */}
              {daysInMonth.map((day, dayIndex) => (
                <div
                  key={`${defaultRoomId}-${format(day, 'yyyy-MM-dd')}-bg`}
                  className={`grid-cell border-b border-r ${isSameDay(day, new Date()) ? 'bg-blue-50 dark:bg-blue-950' : 'bg-gray-50 dark:bg-gray-800'}`}
                  style={{ width: `${dayCellWidth}px` }}
                ></div>
              ))}

              {/* Reservation Bars (Overlay) */}
              {reservations
                .map((reservation) => {
                  const checkIn = parseISO(reservation.check_in_date);
                  const checkOut = parseISO(reservation.check_out_date);
                  const lastNight = addDays(checkOut, -1); // The last night the guest stays

                  const monthStart = startOfMonth(currentMonth);
                  const monthEnd = endOfMonth(currentMonth);

                  const overlapsWithMonth = 
                    (checkIn <= monthEnd && lastNight >= monthStart);

                  if (!overlapsWithMonth) {
                    return null;
                  }

                  const effectiveStartDay = checkIn < monthStart ? monthStart : checkIn;
                  const effectiveEndDay = lastNight > monthEnd ? monthEnd : lastNight;

                  const startColIndex = eachDayOfInterval({ start: monthStart, end: effectiveStartDay }).length - 1;
                  const endColIndex = eachDayOfInterval({ start: monthStart, end: effectiveEndDay }).length - 1;

                  if (startColIndex === -1 || endColIndex === -1 || startColIndex > endColIndex) {
                    console.warn(`DEBUG: Could not find valid start/end day in current month for reservation ${reservation.id}. Effective range: ${format(effectiveStartDay, 'yyyy-MM-dd')} to ${format(effectiveEndDay, 'yyyy-MM-dd')}. Start Index: ${startColIndex}, End Index: ${endColIndex}`);
                    return null;
                  }

                  const colSpan = endColIndex - startColIndex + 1;

                  // Utilise channel_identifier pour trouver les informations de couleur
                  const channelInfo = channelColors[reservation.channel_identifier || 'UNKNOWN'] || channelColors['UNKNOWN'];
                  
                  let barBorderClasses = 'rounded-none'; // Default to no rounding
                  
                  // Check if the visible start of the bar is the actual check-in date
                  if (isSameDay(effectiveStartDay, checkIn)) {
                    barBorderClasses += ' rounded-l-full';
                  }
                  // Check if the visible end of the bar is the actual last night date
                  if (isSameDay(effectiveEndDay, lastNight)) {
                    barBorderClasses += ' rounded-r-full';
                  }

                  const numberOfNights = differenceInDays(checkOut, checkIn);

                  return (
                    <div
                      key={reservation.id}
                      className={`absolute h-9 flex items-center justify-start text-xs font-semibold overflow-hidden whitespace-nowrap px-2 ${channelInfo.bgColor} ${channelInfo.textColor} ${barBorderClasses} shadow-sm cursor-pointer hover:opacity-90 transition-opacity`}
                      style={{
                        gridRow: 'auto',
                        top: `${(0 + 2) * 40 + 2}px`, // +2 for header rows, +2px for margin-top. '0' because it's the first (and only) property row.
                        left: `${150 + startColIndex * dayCellWidth}px`,
                        width: `${colSpan * dayCellWidth}px`,
                        height: '36px', // Adjusted to 36px for better vertical centering
                      }}
                      title={`${reservation.guest_name} (${channelInfo.name}, ${reservation.status}) - Du ${format(checkIn, 'dd/MM', { locale: fr })} au ${format(checkOut, 'dd/MM', { locale: fr })}`}
                    >
                      <span className="mr-1">{channelInfo.name.charAt(0).toUpperCase()}.</span>
                      <span className="mr-1">€ {numberOfNights}</span>
                      <span className="mx-1">|</span>
                      <span className="truncate">{reservation.guest_name}</span>
                    </div>
                  );
                })}
            </React.Fragment>
          </div>
        )}

        {/* Legend for OTA Platforms */}
        <div className="mt-8 p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
          <h3 className="text-md font-semibold mb-3">Légende des plateformes</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(channelColors).map(([key, value]) => (
              <div key={key} className="flex items-center">
                <span className={`w-4 h-4 rounded-full mr-2 ${value.bgColor}`}></span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{value.name}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingPlanningGrid;