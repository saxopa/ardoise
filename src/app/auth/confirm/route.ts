import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback de confirmation email → connexion directe.
 * Gère les deux schémas Supabase :
 *  - flux PKCE par défaut : `?code=...` (template natif {{ .ConfirmationURL }}
 *    + emailRedirectTo vers cette route) → exchangeCodeForSession
 *  - template custom : `?token_hash=...&type=signup` → verifyOtp
 * Pose la session (cookies), puis redirige connecté vers `next` (défaut /admin).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? "/admin";

  // Anti open-redirect : uniquement des chemins internes.
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/admin";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }

  return NextResponse.redirect(
    new URL("/login?error=confirmation_invalide", request.url)
  );
}
