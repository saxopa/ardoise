import { type ComponentProps } from "react";

/* Système UI Ardoise — volontairement minimal et typé.
   Pas de variants superflus : primaire / secondaire / ghost, point. */

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const base =
    "press inline-flex h-11 items-center justify-center gap-2 rounded-[4px] px-5 text-[15px] font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";
  const variants = {
    primary: "bg-terracotta text-craie hover:bg-terracotta-dark",
    secondary:
      "border-[1.5px] border-terracotta bg-transparent text-terracotta hover:bg-terracotta/5",
    ghost:
      "text-ardoise-mid underline decoration-ardoise-mid/40 underline-offset-[3px] hover:text-encre",
    danger:
      "border-[1.5px] border-[#a33b2e] bg-transparent text-[#a33b2e] hover:bg-[#a33b2e]/5",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return (
    <input
      className={`h-11 w-full rounded-[4px] border border-ardoise-deep/15 bg-craie px-3 text-[15px] text-encre outline-none transition-colors duration-150 placeholder:text-ardoise-mid/60 focus:border-terracotta ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = "", ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={`w-full rounded-[4px] border border-ardoise-deep/15 bg-craie px-3 py-2.5 text-[15px] text-encre outline-none transition-colors duration-150 placeholder:text-ardoise-mid/60 focus:border-terracotta ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return (
    <select
      className={`h-11 w-full rounded-[4px] border border-ardoise-deep/15 bg-craie px-3 text-[15px] text-encre outline-none transition-colors duration-150 focus:border-terracotta ${className}`}
      {...props}
    />
  );
}

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-[8px] border border-ardoise-deep/12 bg-craie p-6 shadow-[0_2px_8px_rgba(26,31,31,0.08)] ${className}`}
      {...props}
    />
  );
}

export function Label({ className = "", ...props }: ComponentProps<"label">) {
  return (
    <label
      className={`mb-1.5 block text-[14px] font-medium text-ardoise-deep ${className}`}
      {...props}
    />
  );
}

export function Badge({
  tone = "neutral",
  className = "",
  ...props
}: ComponentProps<"span"> & {
  tone?: "neutral" | "warm" | "success" | "danger";
}) {
  const tones = {
    neutral: "bg-ardoise-deep/8 text-ardoise-deep",
    warm: "bg-terracotta/12 text-terracotta-dark",
    success: "bg-sauge/15 text-[#4a6b4a]",
    danger: "bg-[#a33b2e]/10 text-[#a33b2e]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-[4px] px-2 py-0.5 text-[12px] font-semibold ${tones[tone]} ${className}`}
      {...props}
    />
  );
}
