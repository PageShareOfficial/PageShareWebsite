export default function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      {/* White P - bold sans-serif */}
      <span 
        className="text-white font-black leading-none" 
        style={{ 
          fontSize: `${size}px`,
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        P
      </span>
      {/* Gradient $ - green to teal to cyan */}
      <span
        className="font-black leading-none bg-gradient-to-b from-green-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent"
        style={{ 
          fontSize: `${size}px`,
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        $
      </span>
    </div>
  );
}

