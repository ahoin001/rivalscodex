import { InputHTMLAttributes } from "react";

type RivalsInputProps = InputHTMLAttributes<HTMLInputElement>;

export function RivalsInput({ className = "", ...props }: RivalsInputProps) {
  return (
    <input
      className={`w-full border border-brand-gold/45 bg-[#111523]/90 px-3 py-2 text-sm text-white outline-none placeholder:text-muted-foreground focus:border-brand-gold ${className}`.trim()}
      {...props}
    />
  );
}
