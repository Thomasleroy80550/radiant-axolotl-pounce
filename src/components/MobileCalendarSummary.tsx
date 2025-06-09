import React, { useState, useEffect, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isValid, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Home, LogIn, LogOut, Sparkles, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Correction ici: '=>' remplacé par 'from'
import { Terminal } from 'lucide-react';
import { fetchKrossbookingReservations, fetchKrossbookingHousekeepingTasks, KrossbookingHousekeepingTask } from '@/lib/krossbooking';
import { getUserRooms, UserRoom } from '@/lib/user-room-api';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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

const channelColors: { [key: string]: { name: string; bgColor: string; textColor: string; } } = {
  'AIRBNB': { name: 'Airbnb', bgColor: 'bg-red-600', textColor: 'text-white' },
  'BOOKING': { name: 'Booking.com', bgColor: 'bg-blue-700', textColor: 'text-white' },
  'ABRITEL': { name: 'Abritel', bgColor: 'bg-orange-600', textColor: 'text-white' },
  'DIRECT': { name: 'Direct', bgColor: 'bg-purple-600', textColor: 'text-white' },
  'HELLOKEYS': { name: 'Hello Keys', bgColor: 'bg-green-600', textColor: 'text-white' },
  'UNKNOWN': { name: 'Autre', bgColor: 'bg-gray-600', textColor: 'text-white' },
};

const getTaskIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
    default: return <Sparkles className="h-4 w-4 text-purple-500" />;
  }
};

const MobileCalendarSummary: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [userRooms, setUserRooms] = useState<UserRoom[]>([]);
  const [reservations, setReservations] = useState<KrossbookingReservation[]>([]);
  const [housekeepingTasks, setHousekeepingTasks] = useState<KrossbookingHousekeepingTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedUserRooms = await getUserRooms();
        setUserRooms(fetchedUserRooms);

        const roomIds = fetchedUserRooms.map(room => room.room_id);
        const roomIdsAsNumbers = fetchedUserRooms.map(room => parseInt(room.room_id)).filter(id => !isNaN(id));

        if (roomIds.length === 0) {
          setReservations([]);
          setHousekeepingTasks([]);
          setLoading(false);
          return;
        }

        const monthStartFormatted = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
        const monthEndFormatted = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
        
        const fetchedReservations = await fetchKrossbookingReservations(roomIds);
        setReservations(fetchedReservations);

        const fetchedTasks = await fetchKrossbookingHousekeepingTasks(monthStartFormatted, monthEndFormatted, roomIdsAsNumbers);
        setHousekeepingTasks(fetchedTasks);

      } catch (err: any) {
        setError(`Erreur lors du chargement des données : ${err.message}`);
        console.error("Error in MobileCalendarSummary loadData:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentMonth]);

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

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Calendrier Mobile</CardTitle>
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
      <CardContent className="p-4">
        {loading && <p className="text-gray-500">Chargement du calendrier...</p>}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!loading && !error && userRooms.length === 0 && (
          <p className="text-gray-500">
            Aucune chambre configurée. Veuillez ajouter des chambres via la page "Mon Profil" pour les voir ici.
          </p>
        )}
        {!loading && !error && userRooms.length > 0 && (
          <div className="space-y-4">
            {daysInMonth.map((day) => {
              const dayEvents: { type: 'check_in' | 'check_out' | 'stay' | 'task'; data: KrossbookingReservation | KrossbookingHousekeepingTask; roomName: string; }[] = [];

              userRooms.forEach(room => {
                // Filter reservations for this day and room
                reservations.forEach(res => {
                  const checkIn = isValid(parseISO(res.check_in_date)) ? parseISO(res.check_in_date) : null;
                  const checkOut = isValid(parseISO(res.check_out_date)) ? parseISO(res.check_out_date) : null;

                  if (!checkIn || !checkOut) return;

                  if (isSameDay(checkIn, day) && (res.property_name === room.room_name || res.property_name === room.room_id)) {
                    dayEvents.push({ type: 'check_in', data: res, roomName: room.room_name });
                  }
                  if (isSameDay(checkOut, day) && (res.property_name === room.room_name || res.property_name === room.room_id)) {
                    // For same-day stays, avoid double counting check-out if already counted as check-in
                    if (!isSameDay(checkIn, checkOut)) {
                      dayEvents.push({ type: 'check_out', data: res, roomName: room.room_name });
                    }
                  }
                  // For stays that span this day (but not check-in/out day)
                  if (day > checkIn && day < checkOut && (res.property_name === room.room_name || res.property_name === room.room_id)) {
                    dayEvents.push({ type: 'stay', data: res, roomName: room.room_name });
                  }
                });

                // Filter tasks for this day and room
                housekeepingTasks.forEach(task => {
                  const taskDate = isValid(parseISO(task.date)) ? parseISO(task.date) : null;
                  if (taskDate && isSameDay(taskDate, day) && task.id_room.toString() === room.room_id) {
                    dayEvents.push({ type: 'task', data: task, roomName: room.room_name });
                  }
                });
              });

              // Remove duplicates for 'stay' type if a reservation spans multiple days
              const uniqueDayEvents = Array.from(new Map(dayEvents.map(item => {
                if (item.type === 'task') return [`task-${(item.data as KrossbookingHousekeepingTask).id_task}-${item.roomName}`, item];
                return [`${item.type}-${(item.data as KrossbookingReservation).id}-${item.roomName}`, item];
              })).values());

              // Sort events for better display: check-ins first, then check-outs, then stays, then tasks
              uniqueDayEvents.sort((a, b) => {
                if (a.type === 'check_in' && b.type !== 'check_in') return -1;
                if (a.type !== 'check_in' && b.type === 'check_in') return 1;
                if (a.type === 'check_out' && b.type === 'stay') return -1;
                if (a.type === 'stay' && b.type === 'check_out') return 1;
                if (a.type === 'task' && (b.type === 'check_in' || b.type === 'check_out' || b.type === 'stay')) return 1;
                if ((a.type === 'check_in' || a.type === 'check_out' || a.type === 'stay') && b.type === 'task') return -1;
                return 0;
              });

              return (
                <div key={format(day, 'yyyy-MM-dd')} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                  <h3 className={cn("font-bold text-lg mb-2", isSameDay(day, new Date()) ? 'text-blue-600 dark:text-blue-400' : '')}>
                    {format(day, 'EEEE dd MMMM', { locale: fr })}
                  </h3>
                  {uniqueDayEvents.length === 0 && (
                    <p className="text-sm text-gray-500">Aucun événement ce jour.</p>
                  )}

                  <div className="space-y-2">
                    {uniqueDayEvents.map((event, index) => {
                      if (event.type === 'task') {
                        const task = event.data as KrossbookingHousekeepingTask;
                        return (
                          <div key={`task-${task.id_task}-${event.roomName}-${index}`} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                            {getTaskIcon(task.status)}
                            <span className="ml-2">
                              <span className="font-semibold">{event.roomName}:</span> Tâche {task.task_type.replace('_', ' ')} ({task.status})
                            </span>
                          </div>
                        );
                      } else {
                        const reservation = event.data as KrossbookingReservation;
                        const channelInfo = channelColors[reservation.channel_identifier || 'UNKNOWN'] || channelColors['UNKNOWN'];
                        const checkIn = isValid(parseISO(reservation.check_in_date)) ? parseISO(reservation.check_in_date) : null;
                        const checkOut = isValid(parseISO(reservation.check_out_date)) ? parseISO(reservation.check_out_date) : null;
                        const numberOfNights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;

                        let icon = null;
                        let eventLabel = '';

                        if (event.type === 'check_in') {
                          icon = <LogIn className="h-4 w-4 flex-shrink-0" />;
                          eventLabel = `Arrivée de ${reservation.guest_name}`;
                        } else if (event.type === 'check_out') {
                          icon = <LogOut className="h-4 w-4 flex-shrink-0" />;
                          eventLabel = `Départ de ${reservation.guest_name}`;
                        } else if (event.type === 'stay') {
                          icon = <Sparkles className="h-4 w-4 flex-shrink-0" />; // Generic icon for middle of stay
                          eventLabel = `Séjour de ${reservation.guest_name}`;
                        }

                        return (
                          <Tooltip key={`res-${reservation.id}-${event.type}-${event.roomName}-${index}`}>
                            <TooltipTrigger asChild>
                              <div className={cn(
                                `flex items-center p-2 rounded-md text-sm font-medium ${channelInfo.bgColor} ${channelInfo.textColor} shadow-sm cursor-pointer`,
                                {
                                  'bg-opacity-80': event.type === 'stay', // Make stay events slightly less prominent
                                }
                              )}>
                                {icon && <span className="mr-2">{icon}</span>}
                                <span className="flex-grow truncate">
                                  <span className="font-semibold">{event.roomName}:</span> {eventLabel} ({channelInfo.name})
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="p-2 text-sm">
                              <p className="font-bold">{reservation.guest_name}</p>
                              <p>Du {checkIn ? format(checkIn, 'dd/MM/yyyy', { locale: fr }) : 'N/A'} au {checkOut ? format(checkOut, 'dd/MM/yyyy', { locale: fr }) : 'N/A'}</p>
                              <p>{numberOfNights} nuit(s)</p>
                              <p>Statut: {reservation.status}</p>
                              <p>Montant: {reservation.amount}</p>
                              <p>Canal: {channelInfo.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MobileCalendarSummary;