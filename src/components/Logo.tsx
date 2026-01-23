type Props = {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

export default function LogoComponent({ size = "md", className = "" }: Props) {
  const sizes = {
    xs: "text-lg",
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <span
      className={`font-semibold tracking-tight leading-none ${sizes[size]} ${className}`}
    >
      <span className="text-sky-500">Derma</span>
      <span className="bg-linear-to-r from-cyan-400 to-sky-500 bg-clip-text text-transparent">
        Core
      </span>
    </span>
  );
}
