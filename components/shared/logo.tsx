import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "size-7 rounded-lg overflow-hidden transition-transform hover:scale-105",
        className,
      )}
      aria-hidden="true"
    >
      <rect x="0" y="0" width="140" height="140" rx="32" fill="#061309" />
      <rect x="14" y="14" width="24" height="24" rx="5" fill="#0C2613" />
      <rect x="44" y="14" width="24" height="24" rx="5" fill="#143D1F" />
      <rect x="74" y="14" width="24" height="24" rx="5" fill="#1E5B2F" />
      <rect x="104" y="14" width="24" height="24" rx="5" fill="#143D1F" />
      <rect x="14" y="44" width="24" height="24" rx="5" fill="#143D1F" />
      <rect x="44" y="44" width="24" height="24" rx="5" fill="#1E5B2F" />
      <rect x="74" y="44" width="24" height="24" rx="5" fill="#2B8243" />
      <rect x="104" y="44" width="24" height="24" rx="5" fill="#39AC59" />
      <rect x="14" y="74" width="24" height="24" rx="5" fill="#1E5B2F" />
      <rect x="44" y="74" width="24" height="24" rx="5" fill="#2B8243" />
      <rect x="74" y="74" width="24" height="24" rx="5" fill="#39AC59" />
      <rect x="104" y="74" width="24" height="24" rx="5" fill="#56C676" />
      <rect x="14" y="104" width="24" height="24" rx="5" fill="#143D1F" />
      <rect x="44" y="104" width="24" height="24" rx="5" fill="#2B8243" />
      <rect x="74" y="104" width="24" height="24" rx="5" fill="#39AC59" />
      <rect x="104" y="104" width="24" height="24" rx="6" fill="#5ec97c" />
    </svg>
  );
}

export default Logo;
