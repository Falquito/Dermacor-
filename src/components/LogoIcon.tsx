type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

export default function LogoIcon({ size = "md", className = "" }: Props) {
  const sizes = {
    sm: "h-6 w-6 text-sm",
    md: "h-8 w-8 text-base",
    lg: "h-10 w-10 text-lg",
  };

  return (
    <div
      className={`${sizes[size]} rounded-lg bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center text-white font-bold shadow-sm ${className}`}
    >
      D
    </div>
  );
}
