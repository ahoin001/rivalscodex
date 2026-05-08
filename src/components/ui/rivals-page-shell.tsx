import { PropsWithChildren } from "react";

type RivalsPageShellProps = PropsWithChildren<{
  className?: string;
}>;

export function RivalsPageShell({
  className = "",
  children,
}: RivalsPageShellProps) {
  return (
    <main
      className={`mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10 ${className}`.trim()}
    >
      {children}
    </main>
  );
}
