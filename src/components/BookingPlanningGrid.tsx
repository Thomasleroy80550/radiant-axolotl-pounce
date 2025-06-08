import React, { useState, useEffect, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addDays } from 'date-fns';
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
  channel_id?: string; // Added to store the OTA channel ID
}

// Définir l'ID et le nom de la chambre par défaut à afficher
const defaultRoomId = '36'; // Remplacez par l'ID de la chambre Krossbooking que vous souhaitez afficher
const defaultRoomName = 'Ma Chambre par défaut (2c)'; // Nom affiché pour cette chambre

// Mapping des IDs de canal Krossbooking vers des noms et couleurs
const channelColors: { [key: string]: { name: string; bgColor: string; textColor: string; } } = {
  '1': { name: 'Airbnb', bgColor: 'bg-red-600', textColor: 'text-white' },
  '2': { name: 'Booking.com', bgColor: 'bg-blue-700', textColor: 'text-white' },
  '4': { name: 'Abritel', bgColor: 'bg-orange-600', textColor: 'text-white' },
  'DIRECT': { name: 'Direct', bgColor: 'bg-purple-600', textColor: 'text-white' },
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
                  const lastNight = addDays(parseISO(reservation.check_out_date), -1);

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

                  const channelInfo = channelColors[reservation.channel_id || 'UNKNOWN'] || channelColors['UNKNOWN'];
                  let barBorderRadius = '';

                  if (isSameDay(effectiveStartDay, checkIn)) {
                    barBorderRadius += 'rounded-l-md ';
                  }
                  if (isSameDay(effectiveEndDay, lastNight)) {
                    barBorderRadius += 'rounded-r-md ';
                  }
                  if (isSameDay(effectiveStartDay, checkIn) && isSameDay(effectiveEndDay, lastNight) && colSpan === 1) {
                    barBorderRadius = 'rounded-md'; 
                  } else if (isSameDay(effectiveStartDay, checkIn) && isSameDay(effectiveEndDay, lastNight) && colSpan > 1) {
                    barBorderRadius = 'rounded-md';
                  }

                  return (
                    <div
                      key={reservation.id}
                      className={`absolute h-8 flex items-center justify-center text-xs font-semibold overflow-hidden whitespace-nowrap px-1 ${channelInfo.bgColor} ${channelInfo.textColor} ${barBorderRadius} shadow-sm cursor-pointer hover:opacity-90 transition-opacity`}
                      style={{
                        gridRow: 'auto',
                        top: `${(0 + 2) * 40 + 2}px`, // +2 for header rows, +2px for margin-top. '0' because it's the first (and only) property row.
                        left: `${150 + startColIndex * dayCellWidth}px`,
                        width: `${colSpan * dayCellWidth}px`,
                        height: '36px',
                      }}
                      title={`${reservation.guest_name} (${channelInfo.name}, ${reservation.status}) - Du ${format(checkIn, 'dd/MM', { locale: fr })} au ${format(lastNight, 'dd/MM', { locale: fr })}`}
                    >
                      {reservation.guest_name}
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