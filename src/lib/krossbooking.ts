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

// Define the base URL for your Supabase Edge Function
const KROSSBOOKING_PROXY_URL = "https://dkjaejzwmmwwzhokpbgs.supabase.co/functions/v1/krossbooking-proxy";

/**
 * Fetches reservations from Krossbooking API via the Supabase Edge Function proxy.
 * @param roomId Optional: The ID of the room/property to fetch reservations for. If not provided, fetches all reservations.
 * @returns A promise that resolves to an array of KrossbookingReservation objects.
 */
export async function fetchKrossbookingReservations(roomId?: string): Promise<KrossbookingReservation[]> {
  try {
    console.log(`Attempting to fetch Krossbooking reservations via proxy for room: ${roomId || 'all rooms'}`);

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

    const payload: { action: string; id_room?: string } = {
      action: 'get_reservations',
    };
    if (roomId) {
      payload.id_room = roomId;
    }

    const response = await fetch(KROSSBOOKING_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`, // Add the authorization header
      },
      body: JSON.stringify(payload),
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
      throw new Error(`Failed to fetch reservations: Edge Function returned a non-2xx status code. Details: ${JSON.stringify(errorData)}`);
    }

    const krossbookingResponse = JSON.parse(responseText);
    console.log(`Parsed Krossbooking response from proxy (full data):`, krossbookingResponse); 

    if (krossbookingResponse && Array.isArray(krossbookingResponse.data)) {
      return krossbookingResponse.data.map((res: any) => {
        // For the bookings list, we want the room name, not just the ID.
        // Krossbooking reservation object has a 'rooms' array, take the label of the first room.
        const roomLabel = res.rooms?.[0]?.label || res.rooms?.[0]?.id_room?.toString() || 'N/A';
        
        return {
          id: res.id_reservation.toString(), 
          guest_name: res.label || 'N/A', 
          property_name: roomLabel, // Use the extracted room label
          check_in_date: res.arrival, 
          check_out_date: res.departure, 
          status: res.cod_reservation_status, 
          amount: res.charge_total_amount ? `${res.charge_total_amount}€` : '0€', 
          cod_channel: res.cod_channel, // Récupère cod_channel
          ota_id: res.ota_id,           // Récupère ota_id
          channel_identifier: res.cod_channel || 'UNKNOWN', // Utilise cod_channel pour l'identifiant de couleur
        };
      });
    } else {
      console.warn("Unexpected Krossbooking API response structure or no data array:", krossbookingResponse);
      return [];
    }
  } catch (error: any) {
    console.error("Error fetching Krossbooking reservations:", error.message);
    throw error;
  }
}