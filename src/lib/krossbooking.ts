import { supabase } from "@/integrations/supabase/client";

interface KrossbookingReservation {
  id: string;
  guest_name: string;
  property_name: string;
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

    const response = await fetch(KROSSBOOKING_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No need for Authorization header here unless the Edge Function itself requires client-side auth
      },
      body: JSON.stringify({ // Manually stringify the body for a direct fetch call
        action: 'get_reservations',
        room_id: roomId,
      }),
    });

    console.log(`Response status from Edge Function: ${response.status}`);
    const responseText = await response.text(); // Read as text first to handle potential non-JSON errors
    console.log(`Raw response from Edge Function: ${responseText}`);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = responseText; // If not JSON, use raw text
      }
      console.error("Error from Edge Function:", errorData);
      throw new Error(`Failed to fetch reservations: Edge Function returned a non-2xx status code. Details: ${JSON.stringify(errorData)}`);
    }

    const krossbookingResponse = JSON.parse(responseText); // Parse the response as JSON

    // Assuming the Edge Function returns the Krossbooking API response directly
    if (krossbookingResponse && krossbookingResponse.success && Array.isArray(krossbookingResponse.reservations)) {
      return krossbookingResponse.reservations.map((res: any) => ({
        id: res.id,
        guest_name: res.guest_name,
        property_name: res.property_name,
        check_in_date: res.check_in_date,
        check_out_date: res.check_out_date,
        status: res.status,
        amount: res.amount,
      }));
    } else {
      console.warn("Unexpected Krossbooking API response structure:", krossbookingResponse);
      // If the response is not as expected, log it and return an empty array
      return [];
    }
  } catch (error: any) {
    console.error("Error fetching Krossbooking reservations:", error.message);
    throw error;
  }
}