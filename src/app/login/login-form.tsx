"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, signUp, type AuthState } from "./actions";
import { Button, Input, Label, Card } from "@/components/ui";

const initialState: AuthState = { error: null, message: null };

export default function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [state, formAction, pending] = useActionState(
    mode === "signin" ? signIn : signUp,
    initialState
  );
  const next = useSearchParams().get("next") ?? "/admin";

  return (
    <Card className="w-full max-w-md animate-fade-in">
      <Link href="/" className="font-display text-2xl font-bold">
        Ardoise
      </Link>
      <h1 className="mt-6 font-display text-[28px] font-bold">
        {mode === "signin" ? "Connexion" : "Créer un compte"}
      </h1>
      <p className="mt-1 text-[15px] text-ardoise-mid">
        {mode === "signin"
          ? "Accédez à votre tableau de bord."
          : "Votre restaurant en ligne en vingt minutes."}
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            minLength={mode === "signup" ? 8 : undefined}
            required
          />
        </div>

        {state.error && (
          <p className="rounded-[4px] bg-[#a33b2e]/10 px-3 py-2 text-sm font-medium text-[#a33b2e]">
            {state.error}
          </p>
        )}
        {state.message && (
          <p className="rounded-[4px] bg-sauge/15 px-3 py-2 text-sm font-medium text-[#4a6b4a]">
            {state.message}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending
            ? "Un instant…"
            : mode === "signin"
              ? "Se connecter"
              : "Créer mon compte"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="mt-4 text-[15px] text-ardoise-mid underline decoration-ardoise-mid/40 underline-offset-[3px] hover:text-encre"
      >
        {mode === "signin"
          ? "Pas encore de compte ? Inscrivez-vous"
          : "Déjà un compte ? Connectez-vous"}
      </button>
    </Card>
  );
}
