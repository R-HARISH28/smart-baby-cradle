import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SoundDetectionPayload {
  intensity: number;
  status: 'crying' | 'noise_detected' | 'sleeping';
  duration?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const path = url.pathname.replace('/baby-monitor-api', '');

    if (req.method === 'POST' && path === '/sound-detected') {
      const payload: SoundDetectionPayload = await req.json();

      const { intensity, status, duration = 0 } = payload;

      if (intensity < 0 || intensity > 100) {
        return new Response(
          JSON.stringify({ error: 'Intensity must be between 0 and 100' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: eventData, error: eventError } = await supabase
        .from('cry_events')
        .insert({
          intensity,
          status,
          duration,
          detected_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (eventError) {
        throw eventError;
      }

      const { error: statusError } = await supabase
        .from('system_status')
        .update({
          current_status: status,
          last_cry_detected: status === 'crying' ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', (await supabase.from('system_status').select('id').single()).data?.id);

      if (statusError) {
        throw statusError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Sound event recorded',
          data: eventData,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method === 'GET' && path === '/status') {
      const { data, error } = await supabase
        .from('system_status')
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'GET' && path === '/history') {
      const limit = url.searchParams.get('limit') || '50';

      const { data, error } = await supabase
        .from('cry_events')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(parseInt(limit));

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true, data, count: data.length }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Route not found' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
