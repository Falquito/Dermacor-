import Image from "next/image";

type Props = {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  showIcon?: boolean;
};

export default function LogoComponent({ size = "md", className = "", showIcon = false }: Props) {
  const sizes = {
    xs: "text-lg",
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const iconSizes = {
    xs: 20,
    sm: 24,
    md: 28,
    lg: 32,
  };

  return (
    <span
      className={`font-semibold tracking-tight leading-none flex items-center gap-2 ${sizes[size]} ${className}`}
    >
      {showIcon && (
        <Image 
          src="/favicon.ico" 
          alt="DermaCore Logo" 
          width={iconSizes[size]} 
          height={iconSizes[size]}
          className="rounded-md shrink-0"
        />
      )}
      <span>
        <span className="text-sky-500">Derma</span>
        <span className="bg-linear-to-r from-cyan-400 to-sky-500 bg-clip-text text-transparent">
          Core
        </span>
      </span>
    </span>
  );
}
