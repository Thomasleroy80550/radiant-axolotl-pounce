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
  property_name: string; // This will now be the actual room ID from Krossbooking
  check_in_date: string;
  check_out_date: string;
  status: string;
  amount: string;
}

interface Property {
  id: string;
  name: string;
}

// Define your properties here with their actual Krossbooking room IDs
const properties: Property[] = [
  { id: '62', name: '2c' },
  { id: '63', name: 'Plein sud' },
];

const BookingPlanningGrid: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [allReservations, setAllReservations] = useState<KrossbookingReservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReservationsForProperties = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedReservations: KrossbookingReservation[] = [];
        // Fetch reservations for each defined property ID
        for (const property of properties) {
          console.log(`DEBUG: Fetching reservations for property ID: ${property.id}`);
          const reservationsForProperty = await fetchKrossbookingReservations(property.id);
          fetchedReservations.push(...reservationsForProperty);
        }
        setAllReservations(fetchedReservations);
        console.log("DEBUG: All fetched reservations (combined from multiple property calls):", fetchedReservations); 
      } catch (err: any) {
        setError(`Erreur lors du chargement des réservations : ${err.message}`);
        console.error("DEBUG: Error in loadReservationsForProperties:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReservationsForProperties();
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
            {properties.map((property) => {
              console.log(`DEBUG: Processing property: ${property.name} (ID: ${property.id})`);
              // Filter reservations for this specific property ID
              const reservationsForThisProperty = allReservations.filter(res => res.property_name === property.id);
              console.log(`DEBUG: Found ${reservationsForThisProperty.length} reservations for property ${property.id}.`);

              return (
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
                  {reservationsForThisProperty
                    .map((reservation) => {
                      const checkIn = parseISO(reservation.check_in_date);
                      // Krossbooking check_out_date is the day *after* the last night.
                      // For planning, we want to show the reservation *up to and including* the last night.
                      // So, the effective last night is check_out_date - 1 day.
                      const lastNight = addDays(parseISO(reservation.check_out_date), -1);

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
                      // daysInInterval returns an array of dates, its length gives us the count of days.
                      // We subtract 1 to get a 0-indexed position for array access.
                      const startColIndex = eachDayOfInterval({ start: monthStart, end: effectiveStartDay }).length - 1;
                      const endColIndex = eachDayOfInterval({ start: monthStart, end: effectiveEndDay }).length - 1;

                      if (startColIndex === -1 || endColIndex === -1 || startColIndex > endColIndex) {
                        console.warn(`DEBUG: Could not find valid start/end day in current month for reservation ${reservation.id}. Effective range: ${format(effectiveStartDay, 'yyyy-MM-dd')} to ${format(effectiveEndDay, 'yyyy-MM-dd')}. Start Index: ${startColIndex}, End Index: ${endColIndex}`);
                        return null;
                      }

                      const colSpan = endColIndex - startColIndex + 1;
                      // const gridColumnStart = startColIndex + 1; // CSS grid columns are 1-indexed, plus 1 for the property name column

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
                      // Only round if the effective start/end is the actual reservation start/end
                      if (isSameDay(effectiveStartDay, checkIn)) {
                        barBorderRadius += 'rounded-l-md ';
                      }
                      if (isSameDay(effectiveEndDay, lastNight)) {
                        barBorderRadius += 'rounded-r-md ';
                      }
                      // If it's a single day reservation or fully contained within the month and not spanning
                      if (isSameDay(effectiveStartDay, checkIn) && isSameDay(effectiveEndDay, lastNight) && colSpan === 1) {
                        barBorderRadius = 'rounded-md'; 
                      } else if (isSameDay(effectiveStartDay, checkIn) && isSameDay(effectiveEndDay, lastNight) && colSpan > 1) {
                        barBorderRadius = 'rounded-md';
                      }


                      console.log(`DEBUG: Drawing reservation ${reservation.id} for property ${reservation.property_name}. Dates: ${format(checkIn, 'yyyy-MM-dd')} to ${format(lastNight, 'yyyy-MM-dd')} (last night). Effective: ${format(effectiveStartDay, 'yyyy-MM-dd')} to ${format(effectiveEndDay, 'yyyy-MM-dd')}. Grid: col ${startColIndex + 1} / span ${colSpan}`);

                      return (
                        <div
                          key={reservation.id}
                          className={`absolute h-8 flex items-center justify-center text-xs font-semibold overflow-hidden whitespace-nowrap px-1 ${backgroundColor} ${textColor} ${barBorderRadius} shadow-sm cursor-pointer hover:opacity-90 transition-opacity`}
                          style={{
                            // gridColumn: `${gridColumnStart} / span ${colSpan}`, // This is for grid-template-columns, not absolute positioning
                            gridRow: 'auto', // This ensures it's within the current property's row
                            top: `${(properties.findIndex(p => p.id === property.id) + 2) * 40 + 2}px`, // +2 for header rows, +2px for margin-top
                            left: `${150 + startColIndex * dayCellWidth}px`, // 150px for property name column, then start at correct day
                            width: `${colSpan * dayCellWidth}px`, // Width based on span
                            height: '36px', // Slightly less than row height for visual spacing
                          }}
                          title={`${reservation.guest_name} (${reservation.status}) - Du ${format(checkIn, 'dd/MM', { locale: fr })} au ${format(lastNight, 'dd/MM', { locale: fr })}`}
                        >
                          {reservation.guest_name}
                        </div>
                      );
                    })}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingPlanningGrid;