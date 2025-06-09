import React, { useState, useEffect, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addDays, subDays, differenceInDays, isValid, max, min } from 'date-fns';
import { fr } from 'date-fns/locale'; // Pour le formatage en français
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Home, Sparkles, CheckCircle, Clock, XCircle, LogIn, LogOut } from 'lucide-react'; // Added LogIn, LogOut icons
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { fetchKrossbookingReservations, fetchKrossbookingHousekeepingTasks, KrossbookingHousekeepingTask } from '@/lib/krossbooking'; // Import fetchKrossbookingReservations and KrossbookingHousekeepingTask
import { Tooltip, TooltipContent, TooltipTrigger } => '@/components/ui/tooltip'; // Import Tooltip components

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
  'HELLOKEYS': { name: 'Hello Keys', bgColor: 'bg-green-600', textColor: 'text-white' },
  'UNKNOWN': { name: 'Autre', bgColor: 'bg-gray-600', textColor: 'text-white' },
};

const BookingPlanningGrid: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reservations, setReservations] = useState<KrossbookingReservation[]>([]);
  const [housekeepingTasks, setHousekeepingTasks] = useState<KrossbookingHousekeepingTask[]>([]); // New state for tasks
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReservationsAndTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`DEBUG: Fetching reservations for single room ID: ${defaultRoomId}`);
        const fetchedReservations = await fetchKrossbookingReservations(defaultRoomId);
        setReservations(fetchedReservations);
        console.log("DEBUG: Fetched reservations for default room:", fetchedReservations); 

        // Fetch housekeeping tasks for the current month
        const monthStartFormatted = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
        const monthEndFormatted = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
        console.log(`DEBUG: Fetching housekeeping tasks for room ${defaultRoomId} from ${monthStartFormatted} to ${monthEndFormatted}`);
        const fetchedTasks = await fetchKrossbookingHousekeepingTasks(monthStartFormatted, monthEndFormatted, undefined, parseInt(defaultRoomId));
        setHousekeepingTasks(fetchedTasks);
        console.log("DEBUG: Fetched housekeeping tasks:", fetchedTasks);

      } catch (err: any) {
        setError(`Erreur lors du chargement des données : ${err.message}`);
        console.error("DEBUG: Error in loadReservationsAndTasks:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReservationsAndTasks();
  }, [currentMonth]); // Re-fetch when month changes

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

  // Function to get icon based on task status
  const getTaskIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'pending': return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'cancelled': return <XCircle className="h-3 w-3 text-red-500" />;
      default: return <Sparkles className="h-3 w-3 text-purple-500" />;
    }
  };

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
        {loading && <p className="text-gray-500">Chargement des réservations et tâches...</p>}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!loading && !error && reservations.length === 0 && housekeepingTasks.length === 0 && (
          <p className="text-gray-500">Aucune réservation ou tâche trouvée pour la chambre "{defaultRoomName}".</p>
        )}
        {!loading && !error && (reservations.length > 0 || housekeepingTasks.length > 0) && (
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
              {daysInMonth.map((day, dayIndex) => {
                const tasksForThisDay = housekeepingTasks.filter(task =>
                  isValid(parseISO(task.date)) && isSameDay(parseISO(task.date), day) && task.id_room.toString() === defaultRoomId
                );

                // Find reservations that start or end on this specific day
                const arrivalsOnThisDay = reservations.filter(res =>
                  isValid(parseISO(res.check_in_date)) && isSameDay(parseISO(res.check_in_date), day)
                );
                const departuresOnThisDay = reservations.filter(res =>
                  isValid(parseISO(res.check_out_date)) && isSameDay(parseISO(res.check_out_date), day)
                );

                // Determine if it's a "changeover" day (arrival and departure on the same day)
                const isChangeoverDay = arrivalsOnThisDay.some(arr =>
                  departuresOnThisDay.some(dep => dep.id === arr.id)
                );

                return (
                  <div
                    key={`${defaultRoomId}-${format(day, 'yyyy-MM-dd')}-bg`}
                    className={`grid-cell border-b border-r relative flex flex-col justify-center items-center ${isSameDay(day, new Date()) ? 'bg-blue-50 dark:bg-blue-950' : 'bg-gray-50 dark:bg-gray-800'}`}
                    style={{ width: `${dayCellWidth}px` }}
                  >
                    {/* Housekeeping Tasks Icon */}
                    {tasksForThisDay.length > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 cursor-pointer z-20">
                            {tasksForThisDay.length > 1 ? (
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{tasksForThisDay.length}</span>
                            ) : (
                              getTaskIcon(tasksForThisDay[0].status)
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="p-2 text-sm">
                          <p className="font-bold mb-1">Tâches de ménage ({format(day, 'dd/MM', { locale: fr })}):</p>
                          {tasksForThisDay.map((task, idx) => (
                            <p key={idx} className="flex items-center">
                              {getTaskIcon(task.status)}
                              <span className="ml-1 capitalize">{task.task_type.replace('_', ' ')} - {task.status}</span>
                            </p>
                          ))}
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Arrival/Departure Icons */}
                    {isChangeoverDay ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white z-10">
                            <Sparkles className="h-4 w-4" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="p-2 text-sm">
                          Arrivée et Départ le même jour
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <>
                        {arrivalsOnThisDay.length > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white z-10">
                                <LogIn className="h-4 w-4" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="p-2 text-sm">
                              Jour d'arrivée
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {departuresOnThisDay.length > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white z-10">
                                <LogOut className="h-4 w-4" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="p-2 text-sm">
                              Jour de départ
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </div>
                );
              })}

              {/* Reservation Bars (Overlay) */}
              {reservations
                .map((reservation) => {
                  const checkIn = isValid(parseISO(reservation.check_in_date)) ? parseISO(reservation.check_in_date) : null;
                  const checkOut = isValid(parseISO(reservation.check_out_date)) ? parseISO(reservation.check_out_date) : null;

                  if (!checkIn || !checkOut) {
                    console.warn(`DEBUG: Skipping reservation ${reservation.id} due to invalid dates: check_in_date=${reservation.check_in_date}, check_out_date=${reservation.check_out_date}`);
                    return null;
                  }

                  const monthStart = startOfMonth(currentMonth);
                  const monthEnd = endOfMonth(currentMonth);

                  // Calculate the number of nights. If 0, it's a same-day arrival/departure.
                  const numberOfNights = differenceInDays(checkOut, checkIn);

                  // For the bar, we want it to represent the *occupied nights*.
                  // So, if check-in is April 7 and check-out is April 8 (1 night), the bar covers April 7.
                  // If check-in is April 7 and check-out is April 7 (0 nights), it's a single-day event.
                  const barStartDate = checkIn;
                  const barEndDate = numberOfNights > 0 ? subDays(checkOut, 1) : checkIn; // Bar ends on the last *occupied* night

                  // Determine the effective visible start and end of the reservation bar within the current month
                  const visibleBarStart = max([barStartDate, monthStart]);
                  const visibleBarEnd = min([barEndDate, monthEnd]);

                  // If reservation doesn't overlap with current month's occupied nights, don't render the bar
                  if (visibleBarStart > visibleBarEnd) {
                    return null;
                  }

                  const startIndex = daysInMonth.findIndex(d => isSameDay(d, visibleBarStart));
                  const endIndex = daysInMonth.findIndex(d => isSameDay(d, visibleBarEnd));

                  if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
                    console.warn(`DEBUG: Reservation ${reservation.id} bar dates not found in current month's days array or invalid range. Visible bar range: ${format(visibleBarStart, 'yyyy-MM-dd')} to ${format(visibleBarEnd, 'yyyy-MM-dd')}. Start Index: ${startIndex}, End Index: ${endIndex}`);
                    return null;
                  }

                  // Calculate left position: property column width + (start day index * day cell width)
                  const barLeft = propertyColumnWidth + (startIndex * dayCellWidth);
                  
                  // Calculate width: (number of visible occupied days) * day cell width
                  const numberOfVisibleOccupiedDays = differenceInDays(visibleBarEnd, visibleBarStart) + 1;
                  const barWidth = (numberOfVisibleOccupiedDays * dayCellWidth);

                  const channelInfo = channelColors[reservation.channel_identifier || 'UNKNOWN'] || channelColors['UNKNOWN'];

                  // Only render the bar if there's at least one occupied night
                  if (numberOfNights === 0 && !isSameDay(checkIn, checkOut)) {
                    // This case should ideally not happen if checkIn and checkOut are valid and different
                    return null;
                  }

                  return (
                    <Tooltip key={reservation.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={`absolute h-9 flex items-center justify-center text-xs font-semibold overflow-hidden whitespace-nowrap ${channelInfo.bgColor} ${channelInfo.textColor} shadow-sm cursor-pointer hover:opacity-90 transition-opacity rounded-full`}
                          style={{
                            gridRow: '3', // Always on the third row (after two header rows)
                            left: `${barLeft}px`,
                            width: `${barWidth}px`,
                            height: '36px', // Adjusted for better vertical centering
                            marginTop: '2px', // Small margin from the top of the grid row
                            marginBottom: '2px', // Small margin from the bottom of the grid row
                            zIndex: 5, // Ensure bars are above background cells but below icons
                          }}
                        >
                          <span className="px-2">
                            <span className="mr-1">{channelInfo.name.charAt(0).toUpperCase()}.</span>
                            <span className="mr-1">€ {numberOfNights}</span>
                            <span className="mx-1">|</span>
                            <span className="truncate">{reservation.guest_name}</span>
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="p-2 text-sm">
                        <p className="font-bold">{reservation.guest_name}</p>
                        <p>Du {format(checkIn, 'dd/MM/yyyy', { locale: fr })} au {format(checkOut, 'dd/MM/yyyy', { locale: fr })}</p>
                        <p>{numberOfNights} nuit(s)</p>
                        <p>Statut: {reservation.status}</p>
                        <p>Montant: {reservation.amount}</p>
                        <p>Canal: {channelInfo.name}</p>
                      </TooltipContent>
                    </Tooltip>
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
          <h3 className="text-md font-semibold mt-4 mb-3">Légende des tâches de ménage et mouvements</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Tâche générique / Autre</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Tâche terminée</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-yellow-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Tâche en attente / en cours</span>
            </div>
            <div className="flex items-center">
              <XCircle className="h-4 w-4 mr-2 text-red-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Tâche annulée</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 mr-2 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-full">2+</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">Plusieurs tâches</span>
            </div>
            <div className="flex items-center">
              <LogIn className="h-4 w-4 mr-2 text-white bg-green-600 rounded-full p-0.5" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Jour d'arrivée (icône sur le jour)</span>
            </div>
            <div className="flex items-center">
              <LogOut className="h-4 w-4 mr-2 text-white bg-red-600 rounded-full p-0.5" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Jour de départ (icône sur le jour)</span>
            </div>
            <div className="flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-white bg-purple-500 rounded-full p-0.5" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Arrivée & Départ le même jour</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingPlanningGrid;