type Props = {
  className?: string;
};

export default function LogoComponent({ className = "" }: Props) {
  return (
    <span
      className={`font-semibold tracking-tight leading-none ${className}`}
    >
      <span className="text-sky-500">Derma</span>
      <span className="bg-gradient-to-r from-cyan-400 to-sky-500 bg-clip-text text-transparent">
        Core
      </span>
    </span>
  );
}
