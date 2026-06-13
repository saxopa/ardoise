"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string | null; message: string | null };

function safeNext(next: unknown): string {
  // Anti open-redirect : uniquement des chemins internes.
  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/admin";
}

export async function signIn(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Email et mot de passe requis.", message: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Identifiants invalides.", message: null };
  }
  redirect(safeNext(formData.get("next")));
}

export async function signUp(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 8) {
    return {
      error: "Email valide et mot de passe d'au moins 8 caractères requis.",
      message: null,
    };
  }

  const supabase = await createClient();
  // emailRedirectTo : le lien de confirmation renvoie vers /auth/confirm,
  // qui pose la session → l'utilisateur arrive connecté sur /admin.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl}/auth/confirm?next=/admin`,
    },
  });
  if (error) {
    return { error: "Inscription impossible : " + error.message, message: null };
  }
  // Si la confirmation email est activée côté Supabase, pas de session immédiate.
  if (!data.session) {
    return {
      error: null,
      message:
        "Compte créé. Vérifiez votre boîte mail : le lien vous connecte directement.",
    };
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
