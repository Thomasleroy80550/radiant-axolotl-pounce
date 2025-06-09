import React, { useState, useEffect, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addDays, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale'; // Pour le formatage en français
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
// Removed fetchKrossbookingReservations as data will be passed via props

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

interface BookingPlanningGridProps {
  reservations: KrossbookingReservation[];
  loading: boolean;
  error: string | null;
  channelColors: { [key: string]: { name: string; bgColor: string; textColor: string; } };
}

// Définir l'ID et le nom de la chambre par défaut à afficher
const defaultRoomId = '36'; // Remplacez par l'ID de la chambre Krossbooking que vous souhaitez afficher
const defaultRoomName = 'Ma Chambre par défaut (2c)'; // Nom affiché pour cette chambre

const BookingPlanningGrid: React.FC<BookingPlanningGridProps> = ({ reservations, loading, error, channelColors }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // Reservations, loading, error, channelColors are now props

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

  const dayCellWidth = 80; // px, width of each full day column
  const propertyColumnWidth = 150; // px, width of the property name column

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
            gridTemplateColumns: `minmax(${propertyColumnWidth}px, 0.5fr) repeat(${daysInMonth.length}, ${dayCellWidth}px)`,
            minWidth: `${propertyColumnWidth + daysInMonth.length * dayCellWidth}px`, // Ensure minimum width for scroll
            gridAutoRows: '40px', // Height of each row (header, property row)
            position: 'relative', // For absolute positioning of reservation bars
          }}>
            {/* Header Row 1: Empty cell + Day numbers */}
            <div className="grid-cell header-cell sticky left-0 z-10 bg-white dark:bg-gray-950 border-b border-r col-span-1"></div>
            {daysInMonth.map((day, index) => (
              <div
                key={index}
                className="grid-cell header-cell text-center font-semibold border-b border-r"
                style={{ width: `${dayCellWidth}px` }}
              >
                {format(day, 'dd', { locale: fr })}
              </div>
            ))}

            {/* Header Row 2: Empty cell + Day names */}
            <div className="grid-cell header-cell sticky left-0 z-10 bg-white dark:bg-gray-950 border-b border-r col-span-1"></div>
            {daysInMonth.map((day, index) => (
              <div
                key={`day-name-${index}`}
                className="grid-cell header-cell text-center text-xs text-gray-500 border-b border-r"
                style={{ width: `${dayCellWidth}px` }}
              >
                {format(day, 'EEE', { locale: fr })}
              </div>
            ))}

            {/* Property Row */}
            <React.Fragment>
              {/* Property Name Cell */}
              <div className="grid-cell property-name-cell sticky left-0 z-10 bg-white dark:bg-gray-950 border-r border-b flex items-center px-2">
                <Home className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium text-sm">{defaultRoomName}</span>
              </div>

              {/* Day Cells (Background Grid) for the property row */}
              {daysInMonth.map((day, dayIndex) => (
                <div
                  key={`${defaultRoomId}-${format(day, 'yyyy-MM-dd')}-bg`}
                  className={`grid-cell border-b border-r ${isSameDay(day, new Date()) ? 'bg-blue-50 dark:bg-blue-950' : 'bg-gray-50 dark:bg-gray-800'}`}
                  style={{ width: `${dayCellWidth}px` }}
                ></div>
              ))}

              {/* Reservation Bars (Overlay) */}
              {reservations
                .filter(reservation => reservation.property_name === defaultRoomName) // Filter for the default room
                .map((reservation) => {
                  const checkIn = parseISO(reservation.check_in_date);
                  const checkOut = parseISO(reservation.check_out_date);

                  const monthStart = startOfMonth(currentMonth);
                  const monthEnd = endOfMonth(currentMonth);

                  // Determine the effective visible start and end of the reservation bar within the current month
                  const visibleCheckIn = checkIn < monthStart ? monthStart : checkIn;
                  const visibleCheckOut = checkOut > monthEnd ? monthEnd : checkOut;

                  // If reservation doesn't overlap with current month, don't render
                  if (visibleCheckIn > visibleCheckOut) {
                    return null;
                  }

                  const startIndex = daysInMonth.findIndex(d => isSameDay(d, visibleCheckIn));
                  const endIndex = daysInMonth.findIndex(d => isSameDay(d, visibleCheckOut));

                  if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
                    console.warn(`DEBUG: Reservation ${reservation.id} dates not found in current month's days array or invalid range. Visible range: ${format(visibleCheckIn, 'yyyy-MM-dd')} to ${format(visibleCheckOut, 'yyyy-MM-dd')}. Start Index: ${startIndex}, End Index: ${endIndex}`);
                    return null;
                  }

                  // Calculate left position: property column width + (start day index * day cell width)
                  const barLeft = propertyColumnWidth + (startIndex * dayCellWidth);
                  
                  // Calculate width: (number of days spanned) * day cell width
                  // We need to include the check-out day in the span for visual representation
                  const daysSpanned = differenceInDays(addDays(visibleCheckOut, 1), visibleCheckIn); // +1 to include the check-out day visually
                  const barWidth = daysSpanned * dayCellWidth;

                  // Determine rounding classes
                  let barBorderClasses = '';
                  if (isSameDay(checkIn, visibleCheckIn)) {
                    barBorderClasses += ' rounded-l-full';
                  }
                  if (isSameDay(checkOut, visibleCheckOut)) {
                    barBorderClasses += ' rounded-r-full';
                  }

                  const channelInfo = channelColors[reservation.channel_identifier || 'UNKNOWN'] || channelColors['UNKNOWN'];
                  const numberOfNights = differenceInDays(checkOut, checkIn);

                  return (
                    <div
                      key={reservation.id}
                      className={`absolute h-9 flex items-center justify-start text-xs font-semibold overflow-hidden whitespace-nowrap px-2 ${channelInfo.bgColor} ${channelInfo.textColor} ${barBorderClasses} shadow-sm cursor-pointer hover:opacity-90 transition-opacity`}
                      style={{
                        gridRow: '3', // Always on the third row (after two header rows)
                        left: `${barLeft}px`,
                        width: `${barWidth}px`,
                        height: '36px', // Adjusted for better vertical centering
                        marginTop: '2px', // Small margin from the top of the grid row
                        marginBottom: '2px', // Small margin from the bottom of the grid row
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