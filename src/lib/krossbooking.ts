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

/**
 * Fetches reservations from Krossbooking API via the Supabase Edge Function proxy.
 * @param roomId The ID of the room/property to fetch reservations for.
 * @returns A promise that resolves to an array of KrossbookingReservation objects.
 */
export async function fetchKrossbookingReservations(roomId: string): Promise<KrossbookingReservation[]> {
  try {
    // Pass query parameters directly to the invoke method's 'query' option
    // Supabase will append these to the Edge Function's URL
    const { data, error } = await supabase.functions.invoke('krossbooking-proxy', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      query: { // Correctly pass query parameters here
        action: 'get_reservations', // This is an assumption, please verify with Krossbooking API docs
        room_id: roomId,
        // Add any other necessary parameters for the Krossbooking API
      },
    });

    if (error) {
      console.error("Error invoking krossbooking-proxy:", error);
      throw new Error(`Failed to fetch reservations: ${error.message}`);
    }

    // Assuming the Edge Function returns the Krossbooking API response directly
    // You might need to adjust this based on the actual structure of the Krossbooking API response
    const krossbookingResponse = data;

    // Example of expected Krossbooking response structure (adjust as needed)
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