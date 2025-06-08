import React, { useState, useEffect, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, parseISO, addDays } from 'date-fns';
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
  property_name: string; // This will now be the property ID from Krossbooking
  check_in_date: string;
  check_out_date: string;
  status: string;
  amount: string;
}

interface Property {
  id: string;
  name: string;
}

// Define your properties here. For now, using a hardcoded list.
// The 'id' here should correspond to the KROSSBOOKING_ROOM_ID you'd use for fetching.
const properties: Property[] = [
  { id: '1', name: 'Appartement Paris' }, // Changed ID to '1'
  { id: '1', name: 'Studio Nice' },      // Changed ID to '1'
  { id: '1', name: 'Maison Bordeaux' },  // Changed ID to '1'
  // Add more properties as needed, with their corresponding Krossbooking room IDs
];

const BookingPlanningGrid: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [allReservations, setAllReservations] = useState<KrossbookingReservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAllReservations = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch reservations only once for the common property ID '1'
        // If Krossbooking API truly returns all reservations for the hotel under id_property: 1
        const fetchedReservations = await fetchKrossbookingReservations('1'); 
        setAllReservations(fetchedReservations);
        console.log("All fetched reservations:", fetchedReservations); 
      } catch (err: any) {
        setError(`Erreur générale lors du chargement des réservations : ${err.message}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAllReservations();
  }, []); 

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
        {!loading && !error && allReservations.length === 0 && (
          <p className="text-gray-500">Aucune réservation trouvée pour les propriétés configurées.</p>
        )}
        {!loading && !error && allReservations.length > 0 && (
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

            {/* Property Rows */}
            {properties.map((property) => (
              <React.Fragment key={property.id}>
                {/* Property Name Cell */}
                <div className="grid-cell property-name-cell sticky left-0 z-10 bg-white dark:bg-gray-950 border-r border-b flex items-center px-2">
                  <Home className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium text-sm">{property.name}</span>
                </div>

                {/* Day Cells (Background Grid) */}
                {daysInMonth.map((day, dayIndex) => (
                  <div
                    key={`${property.id}-${format(day, 'yyyy-MM-dd')}-bg`}
                    className={`grid-cell border-b border-r ${isSameDay(day, new Date()) ? 'bg-blue-50 dark:bg-blue-950' : 'bg-gray-50 dark:bg-gray-800'}`}
                    style={{ width: `${dayCellWidth}px` }}
                  ></div>
                ))}

                {/* Reservation Bars (Overlay) */}
                {allReservations
                  .filter(res => res.property_name === property.id) // Filter reservations for this property
                  .map((reservation) => {
                    const checkIn = parseISO(reservation.check_in_date);
                    const checkOut = parseISO(reservation.check_out_date);
                    const lastNight = addDays(checkOut, -1);

                    const monthStart = startOfMonth(currentMonth);
                    const monthEnd = endOfMonth(currentMonth);

                    // Determine if the reservation overlaps with the current month
                    const overlapsWithMonth = 
                      (checkIn <= monthEnd && lastNight >= monthStart);

                    if (!overlapsWithMonth) {
                      return null; // Reservation is completely outside the current month
                    }

                    // Calculate the actual start and end day within the current month's visible range
                    const effectiveStartDay = checkIn < monthStart ? monthStart : checkIn;
                    const effectiveEndDay = lastNight > monthEnd ? monthEnd : lastNight;

                    // Calculate column start and span based on daysInMonth array
                    const startColIndex = daysInMonth.findIndex(d => isSameDay(d, effectiveStartDay));
                    const endColIndex = daysInMonth.findIndex(d => isSameDay(d, effectiveEndDay));

                    if (startColIndex === -1 || endColIndex === -1) {
                      console.warn(`Could not find start/end day in current month for reservation ${reservation.id}.`);
                      return null;
                    }

                    const colSpan = endColIndex - startColIndex + 1;
                    const gridColumnStart = startColIndex + 1; // CSS grid columns are 1-indexed

                    let backgroundColor = 'bg-blue-500'; // Default color
                    let textColor = 'text-white';
                    let barBorderRadius = '';

                    switch (reservation.status) {
                      case 'CONFIRMED':
                        backgroundColor = 'bg-green-500';
                        break;
                      case 'PENDING':
                        backgroundColor = 'bg-yellow-500';
                        break;
                      case 'CANCELLED':
                        backgroundColor = 'bg-red-500';
                        break;
                      default:
                        backgroundColor = 'bg-gray-500';
                    }

                    // Determine if the bar should have rounded corners on the left/right
                    if (isSameDay(effectiveStartDay, checkIn)) {
                      barBorderRadius += 'rounded-l-md ';
                    }
                    if (isSameDay(effectiveEndDay, lastNight)) {
                      barBorderRadius += 'rounded-r-md ';
                    }
                    if (isSameDay(effectiveStartDay, checkIn) && isSameDay(effectiveEndDay, lastNight)) {
                      barBorderRadius = 'rounded-md'; // Single day or fully contained within month
                    }

                    return (
                      <div
                        key={reservation.id}
                        className={`absolute h-8 flex items-center justify-center text-xs font-semibold overflow-hidden whitespace-nowrap px-1 ${backgroundColor} ${textColor} ${barBorderRadius} shadow-sm cursor-pointer hover:opacity-90 transition-opacity`}
                        style={{
                          gridColumn: `${gridColumnStart} / span ${colSpan}`,
                          marginTop: '2px', // Small offset to sit on top of grid cell
                          marginBottom: '2px',
                          zIndex: 10,
                          left: `${(gridColumnStart - 1) * dayCellWidth}px`, // Position based on column index
                          width: `${colSpan * dayCellWidth}px`, // Width based on span
                        }}
                        title={`${reservation.guest_name} (${reservation.status}) - Du ${format(checkIn, 'dd/MM', { locale: fr })} au ${format(checkOut, 'dd/MM', { locale: fr })}`}
                      >
                        {reservation.guest_name}
                      </div>
                    );
                  })}
              </React.Fragment>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingPlanningGrid;