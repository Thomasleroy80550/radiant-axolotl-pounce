import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

    // Parse the request body for POST requests
    const { action, room_id: roomId } = await req.json(); // Destructure action and roomId from body
    console.log(`Received action: ${action}, room_id: ${roomId}`); // Log received parameters

    let krossbookingUrl = '';

    if (action === 'get_reservations') {
      if (!roomId) {
        throw new Error("Missing 'room_id' parameter for 'get_reservations' action.");
      }
      // Construct the URL with the specific endpoint for reservations
      krossbookingUrl = `${KROSSBOOKING_API_BASE_URL}/reservations?room_id=${roomId}`;
    } else {
      throw new Error(`Unsupported action: ${action}`);
    }

    console.log("Calling Krossbooking API with URL:", krossbookingUrl);

    const response = await fetch(krossbookingUrl, {
      method: 'GET', // Krossbooking API expects GET for reservations
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...corsHeaders,
      },
    });

    const data = await response.json();
    console.log("Krossbooking API response:", data);

    return new Response(JSON.stringify(data), {
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