import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const host = Deno.env.get('EXTERNAL_DB_HOST')!;
    const port = parseInt(Deno.env.get('EXTERNAL_DB_PORT') || '5432');
    const database = Deno.env.get('EXTERNAL_DB_NAME')!;
    const user = Deno.env.get('EXTERNAL_DB_USER')!;
    const password = Deno.env.get('EXTERNAL_DB_PASSWORD')!;

    const { query, params } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use Deno's built-in postgres client
    const { Client } = await import("https://deno.land/x/postgres@v0.19.3/mod.ts");

    const client = new Client({
      hostname: host,
      port,
      database,
      user,
      password,
      tls: { enabled: false },
    });

    await client.connect();
    const result = await client.queryObject(query, params || []);
    await client.end();

    return new Response(JSON.stringify({ rows: result.rows, rowCount: result.rowCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('DB Query error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
