import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts"; // Using djwt for JWT creation

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to get Google Sheets API access token using JWT
async function getGoogleAccessToken(): Promise<string> {
  const GOOGLE_SERVICE_ACCOUNT_EMAIL = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const GOOGLE_PRIVATE_KEY = Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
  
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw new Error("Missing Google Sheets API credentials in environment variables.");
  }

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const payload = {
    iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: getNumericDate(60 * 60), // 1 hour expiration
    iat: getNumericDate(new Date()),
  };

  // The private key needs to be in JWK format or a CryptoKey.
  // For simplicity, we'll use the raw private key string with `create` which expects a string.
  // In a production environment, you might want to parse this into a CryptoKey for better security.
  const jwt = await create(header, payload, GOOGLE_PRIVATE_KEY);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Failed to get Google Access Token:", response.status, errorBody);
    throw new Error(`Failed to get Google Access Token: ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error("Access token not found in Google response.");
  }
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate with Supabase to get the user's session
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized: User not authenticated." }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      console.warn(`Access denied for user ${user.id}. Role: ${profile?.role}`);
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required." }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const GOOGLE_SHEET_ID = Deno.env.get('GOOGLE_SHEET_ID');
    if (!GOOGLE_SHEET_ID) {
      throw new Error("Missing GOOGLE_SHEET_ID in environment variables.");
    }

    const googleAccessToken = await getGoogleAccessToken();

    const requestBody = await req.json();
    const { action, ...params } = requestBody;

    let responseData: any;

    switch (action) {
      case 'read_sheet':
        const range = params.range || 'Sheet1!A1:Z100';
        const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${range}`;
        const readResponse = await fetch(readUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${googleAccessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!readResponse.ok) {
          const errorBody = await readResponse.text();
          console.error("Google Sheets Read API Error:", readResponse.status, errorBody);
          throw new Error(`Failed to read sheet: ${readResponse.statusText} - ${errorBody}`);
        }
        const readData = await readResponse.json();
        responseData = readData.values;
        break;

      case 'write_sheet':
        const updateRange = params.range || 'Sheet1!A1';
        const values = params.values;
        if (!values || !Array.isArray(values)) {
          throw new Error("Invalid 'values' provided for write_sheet action.");
        }
        const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${updateRange}?valueInputOption=RAW`;
        const writeResponse = await fetch(writeUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${googleAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values }),
        });

        if (!writeResponse.ok) {
          const errorBody = await writeResponse.text();
          console.error("Google Sheets Write API Error:", writeResponse.status, errorBody);
          throw new Error(`Failed to write sheet: ${writeResponse.statusText} - ${errorBody}`);
        }
        responseData = await writeResponse.json();
        break;

      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    return new Response(JSON.stringify({ data: responseData }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in gsheet-proxy function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});