import Image from "next/image";

export default function LoadingLogo({ size = 80 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Círculos giratorios externos */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full animate-spin"
        style={{ animationDuration: '3s' }}
      >
        {/* Arco superior derecho */}
        <path
          d="M 97 50 A 47 47 0 0 0 50 3"
          fill="none"
          stroke="url(#gradient1)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Arco inferior izquierdo */}
        <path
          d="M 3 50 A 47 47 0 0 0 50 97"
          fill="none"
          stroke="url(#gradient2)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="gradient2" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>
      </svg>

      {/* Logo DC - Imagen real */}
      <div className="absolute inset-0 flex items-center justify-center p-2">
        <Image
          src="/charging-logo.png"
          alt="DermaCore"
          width={size * 0.7}
          height={size * 0.7}
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}