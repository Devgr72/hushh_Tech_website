import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

export async function verifyUser(req: Request): Promise<{
  user_id: string;
  error?: never;
} | {
  user_id?: never;
  error: string;
}> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { error: "Missing Authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseClient = createClient(
    SUPABASE_URL,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser(token);

  if (error || !user) {
    return { error: error?.message || "Invalid token" };
  }

  return { user_id: user.id };
}
