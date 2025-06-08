import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const KROSSBOOKING_API_BASE_URL = "https://api.krossbooking.com/apiv5/";
const KROSSBOOKING_API_KEY = "4dca02430245d21024ffb18d806bcca6"; // IMPORTANT: In a real production app, this should be an environment variable/secret. For this example, it's hardcoded.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/krossbooking-proxy', ''); // Remove the function path
    const query = url.searchParams.toString(); // This now correctly gets the query params from the Edge Function's URL

    console.log("Edge Function received query params:", query); // Added for debugging

    // Construct the Krossbooking API URL
    const krossbookingUrl = `${KROSSBOOKING_API_BASE_URL}?api_key=${KROSSBOOKING_API_KEY}&${query}`;
    console.log("Calling Krossbooking API:", krossbookingUrl);

    const response = await fetch(krossbookingUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders, // Apply CORS headers to the response
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