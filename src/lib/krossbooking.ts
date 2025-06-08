import { supabase } from "@/integrations/supabase/client";

interface KrossbookingReservation {
  id: string;
  guest_name: string;
  property_name: string; // This will now be the property ID from Krossbooking
  check_in_date: string;
  check_out_date: string;
  status: string;
  amount: string;
  // Add other fields as per Krossbooking API response
}

// Define the base URL for your Supabase Edge Function
const KROSSBOOKING_PROXY_URL = "https://dkjaejzwmmwwzhokpbgs.supabase.co/functions/v1/krossbooking-proxy";

/**
 * Fetches reservations from Krossbooking API via the Supabase Edge Function proxy.
 * @param roomId The ID of the room/property to fetch reservations for.
 * @returns A promise that resolves to an array of KrossbookingReservation objects.
 */
export async function fetchKrossbookingReservations(roomId: string): Promise<KrossbookingReservation[]> {
  try {
    console.log(`Attempting to fetch Krossbooking reservations for room ID: ${roomId}`);

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
      body: JSON.stringify({
        action: 'get_reservations',
        id_room: roomId, // Changed from room_id to id_room as per Krossbooking API doc
      }),
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
    console.log("Parsed Krossbooking response from proxy:", krossbookingResponse); // Added log

    // Check if krossbookingResponse.data exists and is an array
    if (krossbookingResponse && Array.isArray(krossbookingResponse.data)) {
      // Removed client-side filtering by id_property to display all data returned by Krossbooking
      // const filteredReservations = krossbookingResponse.data.filter((res: any) => 
      //   res.id_property.toString() === roomId // Krossbooking response still uses id_property
      // );
      // console.log(`Found ${filteredReservations.length} filtered reservations for room ID ${roomId}.`); // Added log

      return krossbookingResponse.data.map((res: any) => ({
        id: res.id_reservation.toString(), // Map id_reservation to id
        guest_name: res.label || 'N/A', // Map label to guest_name
        property_name: res.id_property.toString(), // Map id_property to property_name
        check_in_date: res.arrival, // Map arrival to check_in_date
        check_out_date: res.departure, // Map departure to check_out_date
        status: res.cod_reservation_status, // Map cod_reservation_status to status
        amount: res.charge_total_amount ? `${res.charge_total_amount}€` : '0€', // Map charge_total_amount to amount
      }));
    } else {
      console.warn("Unexpected Krossbooking API response structure or no data array:", krossbookingResponse);
      return [];
    }
  } catch (error: any) {
    console.error("Error fetching Krossbooking reservations:", error.message);
    throw error;
  }
}