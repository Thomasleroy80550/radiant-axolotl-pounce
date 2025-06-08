import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const KROSSBOOKING_API_BASE_URL = "https://api.krossbooking.com/v5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to get the authentication token from Krossbooking
async function getAuthToken(): Promise<string> {
  const KROSSBOOKING_API_KEY = Deno.env.get('KROSSBOOKING_API_KEY');
  const KROSSBOOKING_HOTEL_ID = Deno.env.get('KROSSBOOKING_HOTEL_ID');
  const KROSSBOOKING_USERNAME = Deno.env.get('KROSSBOOKING_USERNAME');
  const KROSSBOOKING_PASSWORD = Deno.env.get('KROSSBOOKING_PASSWORD');

  console.log("--- Krossbooking Auth Attempt ---");
  console.log(`API Key (first 5 chars): ${KROSSBOOKING_API_KEY ? KROSSBOOKING_API_KEY.substring(0, 5) + '...' : 'NOT SET'}`);
  console.log(`Hotel ID: ${KROSSBOOKING_HOTEL_ID || 'NOT SET'}`);
  console.log(`Username: ${KROSSBOOKING_USERNAME || 'NOT SET'}`);
  console.log(`Password (first 5 chars): ${KROSSBOOKING_PASSWORD ? KROSSBOOKING_PASSWORD.substring(0, 5) + '...' : 'NOT SET'}`);

  if (!KROSSBOOKING_API_KEY || !KROSSBOOKING_HOTEL_ID || !KROSSBOOKING_USERNAME || !KROSSBOOKING_PASSWORD) {
    throw new Error("Missing Krossbooking API credentials in environment variables.");
  }

  const authPayload = {
    api_key: KROSSBOOKING_API_KEY,
    hotel_id: KROSSBOOKING_HOTEL_ID,
    username: KROSSBOOKING_USERNAME,
    password: KROSSBOOKING_PASSWORD,
  };

  console.log("Auth Payload sent:", JSON.stringify(authPayload));

  const response = await fetch(`${KROSSBOOKING_API_BASE_URL}/auth/get-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
    body: JSON.stringify(authPayload),
  });

  console.log(`Krossbooking Auth Response Status: ${response.status}`);
  console.log(`Krossbooking Auth Response Status Text: ${response.statusText}`);

  const clonedResponse = response.clone();
  const rawResponseText = await clonedResponse.text();
  console.log("Krossbooking Raw Auth Response Body:", rawResponseText);

  if (!response.ok) {
    let errorData;
    try {
      errorData = JSON.parse(rawResponseText);
    } catch (e) {
      errorData = rawResponseText;
    }
    console.error("Failed to get Krossbooking token. Error data:", errorData);
    throw new Error(`Failed to get Krossbooking token: ${response.statusText} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  console.log("Krossbooking token response data (parsed JSON):", data);
  if (data && data.auth_token) { 
    return data.auth_token;
  } else {
    throw new Error("Krossbooking token not found in response.");
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authToken = await getAuthToken();
    console.log("Successfully obtained Krossbooking auth token.");

    let action: string | undefined;
    let requestedRoomId: string | undefined; // Renamed to avoid confusion

    const contentLength = req.headers.get('content-length');
    console.log(`Received Content-Length: ${contentLength}`);

    if (req.method === 'POST') {
      const contentType = req.headers.get('content-type');
      console.log(`Received Content-Type for POST: ${contentType}`);
      if (contentType && contentType.includes('application/json')) {
        try {
          const requestBody = await req.json();
          action = requestBody.action;
          requestedRoomId = requestBody.id_room; // Store the requested room ID
        } catch (jsonParseError) {
          console.error("Error parsing request body as JSON:", jsonParseError);
          return new Response(JSON.stringify({ error: "Invalid JSON in request body." }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
      } else {
        console.error(`Received POST request with unexpected Content-Type: ${contentType}`);
        return new Response(JSON.stringify({ error: "Expected 'application/json' for POST requests." }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    } else {
      console.warn(`Received unsupported HTTP method: ${req.method}`);
      return new Response(JSON.stringify({ error: `Unsupported HTTP method: ${req.method}` }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    console.log(`Received action: ${action}, requested_room_id: ${requestedRoomId}`); 

    let krossbookingUrl = '';
    let krossbookingMethod = 'POST'; 
    let krossbookingBody: string | undefined;

    if (action === 'get_reservations') {
      // Do NOT pass id_room to Krossbooking API directly, fetch all and filter later
      const payload: any = {
        with_rooms: true, 
      };
      krossbookingUrl = `${KROSSBOOKING_API_BASE_URL}/reservations/get-list`;
      krossbookingBody = JSON.stringify(payload);
    } else {
      throw new Error(`Unsupported action: ${action}`);
    }

    console.log(`Calling Krossbooking API with URL: ${krossbookingUrl}, Method: ${krossbookingMethod}, Body: ${krossbookingBody || 'N/A'}`);

    const response = await fetch(krossbookingUrl, {
      method: krossbookingMethod,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...corsHeaders,
      },
      body: krossbookingBody,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Krossbooking API returned non-OK status: ${response.status} ${response.statusText}`);
      console.error("Krossbooking API Error Body:", errorBody);
      throw new Error(`Krossbooking API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    console.log("Krossbooking API response (full data, before filtering):", data); 

    let filteredData = data.data || [];

    // Apply filtering by requestedRoomId here in the Edge Function
    if (requestedRoomId) {
      filteredData = filteredData.filter((reservation: any) => {
        // Check if any room in the reservation matches the requestedRoomId
        return reservation.rooms && reservation.rooms.some((room: any) => {
          // Add explicit check for null/undefined id_room
          if (room.id_room == null) {
            console.warn(`DEBUG_EDGE: room.id_room is null or undefined for reservation ID: ${reservation.id_reservation}. Skipping this room for filtering.`);
            return false; // Skip this room if id_room is null/undefined
          }
          return room.id_room.toString() === requestedRoomId;
        });
      });
      console.log(`Filtered data for room ${requestedRoomId}:`, filteredData);
    }

    return new Response(JSON.stringify({ data: filteredData, total_count: filteredData.length, count: filteredData.length, limit: data.limit, offset: data.offset }), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in krossbooking-proxy function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
});