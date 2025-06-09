import { supabase } from "@/integrations/supabase/client";

interface KrossbookingReservation {
  id: string;
  guest_name: string;
  property_name: string; // This will now be the actual room name from Krossbooking
  check_in_date: string;
  check_out_date: string;
  status: string;
  amount: string;
  cod_channel?: string; // Nouveau champ pour le code du canal (ex: 'AIRBNB', 'BOOKING')
  ota_id?: string;      // Nouveau champ pour l'ID de référence du canal
  channel_identifier?: string; // Utilisé pour la logique de couleur dans le calendrier
}

// Define interface for Housekeeping Task
export interface KrossbookingHousekeepingTask {
  id_task: number;
  id_room: number;
  room_label: string;
  date: string; // yyyy-mm-dd
  status: 'pending' | 'completed' | 'in_progress' | 'cancelled';
  task_type: 'check_in' | 'check_out' | 'daily' | 'extra';
  notes?: string;
  assigned_to?: string;
}

// Define the base URL for your Supabase Edge Function
const KROSSBOOKING_PROXY_URL = "https://dkjaejzwmmwwzhokpbgs.supabase.co/functions/v1/krossbooking-proxy";

/**
 * Calls the Supabase Edge Function proxy for Krossbooking API.
 * @param action The action to perform (e.g., 'get_reservations', 'get_housekeeping_tasks').
 * @param payload The data payload for the action.
 * @returns A promise that resolves to the response data from the Edge Function.
 */
async function callKrossbookingProxy(action: string, payload?: any): Promise<any> {
  try {
    console.log(`Calling Krossbooking proxy with action: ${action}`);

    // Get the current Supabase session to include the authorization token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Error getting Supabase session:", sessionError);
      throw new Error("Could not retrieve Supabase session for authorization.");
    }

    if (!session) {
      console.warn("No active Supabase session found. Cannot authorize Edge Function call.");
      throw new Error("User not authenticated. Please log in.");
    }

    const response = await fetch(KROSSBOOKING_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`, // Add the authorization header
      },
      body: JSON.stringify({ action, ...payload }), // Send action and payload
    });

    console.log(`Response status from Edge Function: ${response.status}`);
    const responseText = await response.text();
    console.log(`Raw response from Edge Function: ${responseText}`);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = responseText;
      }
      console.error("Error from Edge Function:", errorData);
      throw new Error(`Failed to perform Krossbooking action: Edge Function returned a non-2xx status code. Details: ${JSON.stringify(errorData)}`);
    }

    const krossbookingResponse = JSON.parse(responseText);
    console.log(`Parsed Krossbooking response from proxy (full data):`, krossbookingResponse); 

    return krossbookingResponse.data; // Return the 'data' array from the proxy response
  } catch (error: any) {
    console.error("Error calling Krossbooking proxy:", error.message);
    throw error;
  }
}

/**
 * Fetches reservations from Krossbooking API via the Supabase Edge Function proxy.
 * @param roomId Optional: The ID of the room/property to fetch reservations for. If not provided, fetches all reservations.
 * @param dateFrom Optional: Start date (yyyy-mm-dd) for filtering reservations.
 * @param dateTo Optional: End date (yyyy-mm-dd) for filtering reservations.
 * @returns A promise that resolves to an array of KrossbookingReservation objects.
 */
export async function fetchKrossbookingReservations(roomId?: string, dateFrom?: string, dateTo?: string): Promise<KrossbookingReservation[]> {
  const payload: any = { id_room: roomId };
  if (dateFrom) payload.date_from = dateFrom;
  if (dateTo) payload.date_to = dateTo;

  const data = await callKrossbookingProxy('get_reservations', payload);
  
  if (Array.isArray(data)) {
    return data.map((res: any) => {
      const roomLabel = res.rooms?.[0]?.label || res.rooms?.[0]?.id_room?.toString() || 'N/A';
      
      return {
        id: res.id_reservation.toString(), 
        guest_name: res.label || 'N/A', 
        property_name: roomLabel,
        check_in_date: res.arrival || '', // Ensure it's a string
        check_out_date: res.departure || '', // Ensure it's a string
        status: res.cod_reservation_status, 
        amount: res.charge_total_amount ? `${res.charge_total_amount}€` : '0€', 
        cod_channel: res.cod_channel,
        ota_id: res.ota_id,
        channel_identifier: res.cod_channel || 'UNKNOWN',
      };
    });
  } else {
    console.warn("Unexpected Krossbooking API response structure for reservations or no data array:", data);
    return [];
  }
}

/**
 * Fetches housekeeping tasks from Krossbooking API via the Supabase Edge Function proxy.
 * @param dateFrom Start date (yyyy-mm-dd).
 * @param dateTo End date (yyyy-mm-dd).
 * @param idProperty Optional: The ID of the property to fetch tasks for.
 * @param idRoom Optional: The ID of the room to fetch tasks for.
 * @returns A promise that resolves to an array of KrossbookingHousekeepingTask objects.
 */
export async function fetchKrossbookingHousekeepingTasks(
  dateFrom: string,
  dateTo: string,
  idProperty?: number,
  idRoom?: number
): Promise<KrossbookingHousekeepingTask[]> {
  const data = await callKrossbookingProxy('get_housekeeping_tasks', {
    date_from: dateFrom,
    date_to: dateTo,
    id_property: idProperty,
    id_room: idRoom,
  });

  if (Array.isArray(data)) {
    return data.map((task: any) => ({
      id_task: task.id_task,
      id_room: task.id_room,
      room_label: task.room_label || 'N/A',
      date: task.date || '', // Ensure it's a string
      status: task.cod_status, // Assuming 'cod_status' is the status field
      task_type: task.cod_task_type, // Assuming 'cod_task_type' is the task type field
      notes: task.notes,
      assigned_to: task.assigned_to,
    }));
  } else {
    console.warn("Unexpected Krossbooking API response structure for housekeeping tasks or no data array:", data);
    return [];
  }
}