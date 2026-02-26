// Temporary edge function to create the nda_signatures table
// Deploy, call once, then delete

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Use the database URL for direct SQL execution
    const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;

    // Import postgres
    const { default: postgres } = await import("https://deno.land/x/postgresjs@v3.4.5/mod.js");
    const sql = postgres(dbUrl);

    // Create the nda_signatures table
    await sql`
      CREATE TABLE IF NOT EXISTS public.nda_signatures (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        signer_name TEXT NOT NULL,
        signer_email TEXT,
        signer_ip TEXT DEFAULT 'unknown',
        nda_version TEXT DEFAULT 'v1.0',
        pdf_url TEXT,
        signed_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `;

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_nda_signatures_user_id 
      ON public.nda_signatures(user_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_nda_signatures_signed_at 
      ON public.nda_signatures(signed_at)
    `;

    // Enable RLS
    await sql`
      ALTER TABLE public.nda_signatures ENABLE ROW LEVEL SECURITY
    `;

    // Create RLS policies
    await sql`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'nda_signatures' AND policyname = 'Users can view their own NDA'
        ) THEN
          CREATE POLICY "Users can view their own NDA"
            ON public.nda_signatures FOR SELECT
            TO authenticated
            USING (auth.uid() = user_id);
        END IF;
      END $$
    `;

    await sql`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'nda_signatures' AND policyname = 'Users can insert their own NDA'
        ) THEN
          CREATE POLICY "Users can insert their own NDA"
            ON public.nda_signatures FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = user_id);
        END IF;
      END $$
    `;

    await sql`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'nda_signatures' AND policyname = 'Service role has full access to NDA'
        ) THEN
          CREATE POLICY "Service role has full access to NDA"
            ON public.nda_signatures FOR ALL
            TO service_role
            USING (true);
        END IF;
      END $$
    `;

    // Grant permissions
    await sql`GRANT ALL ON public.nda_signatures TO authenticated`;
    await sql`GRANT ALL ON public.nda_signatures TO service_role`;

    // Create the check_user_nda_status RPC function
    await sql`
      CREATE OR REPLACE FUNCTION check_user_nda_status(p_user_id UUID)
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $func$
      DECLARE
        result JSONB;
      BEGIN
        SELECT jsonb_build_object(
          'hasSignedNda', signed_at IS NOT NULL,
          'signedAt', signed_at,
          'ndaVersion', nda_version,
          'signerName', signer_name
        ) INTO result
        FROM nda_signatures
        WHERE user_id = p_user_id;
        
        IF result IS NULL THEN
          RETURN jsonb_build_object(
            'hasSignedNda', false,
            'signedAt', null,
            'ndaVersion', null,
            'signerName', null
          );
        END IF;
        
        RETURN result;
      END;
      $func$
    `;

    // Create the sign_global_nda RPC function
    await sql`
      CREATE OR REPLACE FUNCTION sign_global_nda(
        p_signer_name TEXT,
        p_nda_version TEXT DEFAULT 'v1.0',
        p_pdf_url TEXT DEFAULT NULL,
        p_signer_ip TEXT DEFAULT NULL
      )
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $func$
      DECLARE
        v_user_id UUID;
      BEGIN
        v_user_id := auth.uid();
        
        IF v_user_id IS NULL THEN
          RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
        END IF;
        
        INSERT INTO nda_signatures (user_id, signer_name, nda_version, pdf_url, signer_ip, signed_at, updated_at)
        VALUES (v_user_id, p_signer_name, p_nda_version, p_pdf_url, p_signer_ip, NOW(), NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          signer_name = p_signer_name,
          nda_version = p_nda_version,
          pdf_url = COALESCE(p_pdf_url, nda_signatures.pdf_url),
          signer_ip = p_signer_ip,
          signed_at = NOW(),
          updated_at = NOW();
        
        RETURN jsonb_build_object(
          'success', true,
          'signedAt', NOW(),
          'signerName', p_signer_name,
          'ndaVersion', p_nda_version
        );
      END;
      $func$
    `;

    // Grant execute permissions
    await sql`GRANT EXECUTE ON FUNCTION check_user_nda_status(UUID) TO authenticated`;
    await sql`GRANT EXECUTE ON FUNCTION sign_global_nda(TEXT, TEXT, TEXT, TEXT) TO authenticated`;

    // Verify
    const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'nda_signatures'
    `;

    const functions = await sql`
      SELECT proname FROM pg_proc 
      WHERE proname IN ('check_user_nda_status', 'sign_global_nda')
    `;

    await sql.end();

    return new Response(
      JSON.stringify({
        success: true,
        message: "NDA table and functions created successfully",
        tables: tables.length,
        functions: functions.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
