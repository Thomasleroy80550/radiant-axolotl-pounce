import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { google } from 'https://deno.land/x/googleapis@0.12.0/mod.ts'; // Using googleapis for Deno

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Google Sheets API authentication
    const GOOGLE_SERVICE_ACCOUNT_EMAIL = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const GOOGLE_PRIVATE_KEY = Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n'); // Handle newline characters
    const GOOGLE_SHEET_ID = Deno.env.get('GOOGLE_SHEET_ID');

    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHEET_ID) {
      throw new Error("Missing Google Sheets API credentials in environment variables.");
    }

    const auth = new google.auth.JWT(
      GOOGLE_SERVICE_ACCOUNT_EMAIL,
      undefined,
      GOOGLE_PRIVATE_KEY,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    await auth.authorize();
    const sheets = google.sheets({ version: 'v4', auth });

    const requestBody = await req.json();
    const { action, ...params } = requestBody;

    let responseData: any;

    switch (action) {
      case 'read_sheet':
        // Example: Read data from a specific range
        const range = params.range || 'Sheet1!A1:Z100'; // Default range
        const sheetResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: GOOGLE_SHEET_ID,
          range: range,
        });
        responseData = sheetResponse.data.values;
        break;
      case 'write_sheet':
        // Example: Write data to a specific range
        const updateRange = params.range || 'Sheet1!A1';
        const values = params.values; // Expects an array of arrays for rows/columns
        if (!values || !Array.isArray(values)) {
          throw new Error("Invalid 'values' provided for write_sheet action.");
        }
        const updateResponse = await sheets.spreadsheets.values.update({
          spreadsheetId: GOOGLE_SHEET_ID,
          range: updateRange,
          valueInputOption: 'RAW',
          requestBody: { values },
        });
        responseData = updateResponse.data;
        break;
      // Add more actions as needed (e.g., 'append_row', 'clear_sheet')
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