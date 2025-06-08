import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const KROSSBOOKING_API_BASE_URL = "https://api.krossbooking.com/v5"; // Updated base URL

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

  if (!KROSSBOOKING_API_KEY || !KROSSBOOKING_HOTEL_ID || !KROSSBOOKING_USERNAME || !KROSSBOOKING_PASSWORD) {
    throw new Error("Missing Krossbooking API credentials in environment variables.");
  }

  console.log("Attempting to get Krossbooking auth token...");
  const response = await fetch(`${KROSSBOOKING_API_BASE_URL}/auth/get-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
    body: JSON.stringify({
      api_key: KROSSBOOKING_API_KEY,
      hotel_id: KROSSBOOKING_HOTEL_ID,
      username: KROSSBOOKING_USERNAME,
      password: KROSSBOOKING_PASSWORD,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Failed to get Krossbooking token:", response.status, errorData);
    throw new Error(`Failed to get Krossbooking token: ${response.statusText} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  console.log("Krossbooking token response:", data);
  if (data && data.token) {
    return data.token;
  } else {
    throw new Error("Krossbooking token not found in response.");
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authentication token
    const authToken = await getAuthToken();
    console.log("Successfully obtained Krossbooking auth token.");

    const url = new URL(req.url);
    // The path will be something like /krossbooking-proxy?action=get_reservations&room_id=1
    // We need to extract the actual Krossbooking endpoint path from the query parameters
    // Assuming the client passes the Krossbooking endpoint as a query parameter, e.g., `endpoint=reservations`
    // Or, more simply, we can assume the proxy is only for specific actions like 'get_reservations'
    // For now, let's assume the 'action' query parameter dictates the Krossbooking API path.
    // This needs to be clarified with Krossbooking API docs for specific endpoints.
    // For 'get_reservations', the doc doesn't specify a direct endpoint like /reservations,
    // but rather parameters for the base URL. Let's stick to passing all query params.

    const queryParams = url.searchParams.toString(); // Gets all query params from the Edge Function's URL

    // Construct the Krossbooking API URL with all query parameters
    // The Krossbooking API documentation implies that parameters like 'action' and 'room_id'
    // are part of the query string for the base API URL, not separate paths.
    // Example: https://api.krossbooking.com/v5?action=get_reservations&room_id=1
    const krossbookingUrl = `${KROSSBOOKING_API_BASE_URL}?${queryParams}`;
    console.log("Calling Krossbooking API with token:", krossbookingUrl);

    const response = await fetch(krossbookingUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`, // Include the Bearer token
        ...corsHeaders,
      },
      // No body for GET requests here, as parameters are in the URL
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
  } catch (error) {
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