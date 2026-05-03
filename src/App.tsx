import { useEffect, useRef, useState } from 'react';

function getType(level: number) {
  if (level <= 3) return "alpha";
  if (level <= 7) return "beta";
  return "gamma";
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export default function App() {
  const [level, setLevel] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const levelRef = useRef(level);
  
  // Expose spawn logic for burst on slider change
  const spawnBurstRef = useRef<(lvl: number) => void>(() => {});

  const type = getType(level);
  const color = type === "alpha" ? "#ff3b3b" : type === "beta" ? "#ffd93b" : "#00e5ff";
  const title = type === "alpha" ? "Alpha Radiation" : type === "beta" ? "Beta Radiation" : "Gamma Radiation";
  const subtitle = type === "alpha" ? "Heavy & Slow" : type === "beta" ? "Medium Penetration" : "Light Speed & High Penetration";

  const velocity = type === "alpha" ? "0.05" : type === "beta" ? "0.98" : "6.24";
  const velocityUnit = "c";
  const ionization = type === "alpha" ? "5.4" : type === "beta" ? "0.5" : "0.02";
  const decayRate = (100 - level * 4.2).toFixed(1);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cx = canvas.width / 2;
    let cy = canvas.height / 2;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cx = canvas.width / 2;
      cy = canvas.height / 2;
    };
    window.addEventListener("resize", resize);
    resize();

    const spawn = (lvl: number, isBurst = false) => {
      const pType = getType(lvl);
      let speed, pColor, pSize;

      if (pType === "alpha") {
        speed = 1.5; pColor = "#ff3b3b"; pSize = 3.5;
      } else if (pType === "beta") {
        speed = 3.5; pColor = "#ffd93b"; pSize = 2.5;
      } else {
        speed = 6.0; pColor = "#00e5ff"; pSize = 1.5;
      }

      let count = isBurst ? lvl * 15 : Math.ceil(lvl * 0.5);

      for (let i = 0; i < count; i++) {
        let angle = Math.random() * Math.PI * 2;
        let velocity = (Math.random() * 0.5 + 0.5) * speed * (lvl * 0.3 + 1);

        particlesRef.current.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          life: Math.random() * 60 + 60,
          maxLife: 120,
          color: pColor,
          size: pSize
        });
      }
    };

    spawnBurstRef.current = (lvl: number) => {
      particlesRef.current = [];
      spawn(lvl, true);
    };

    let animationId: number;

    const draw = () => {
      ctx.fillStyle = "rgba(11, 15, 26, 0.25)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const currentLevel = levelRef.current;
      spawn(currentLevel, false);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1.0;

        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    // Initial burst
    spawn(levelRef.current, true);
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLevel = parseInt(e.target.value, 10);
    setLevel(newLevel);
    spawnBurstRef.current(newLevel);
  };

  return (
    <div className="w-full h-screen bg-[#020305] text-[#e0e0e0] font-sans relative overflow-hidden flex flex-col items-center justify-center select-none">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none transition-colors duration-500">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] transition-colors duration-500"
          style={{ backgroundColor: color }}
        ></div>
      </div>

      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full block z-[2]" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 z-[3] pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      {/* Top Navigation / Status */}
      <header className="absolute top-0 w-full p-8 flex justify-between items-start z-20 pointer-events-none">
        <div className="flex flex-col gap-1">
          <div className="text-[10px] uppercase tracking-[0.3em] font-mono opacity-80 transition-colors duration-300" style={{ color }}>Instrument Model</div>
          <div className="text-xl font-bold tracking-tight text-white">RAD-SCALE PRO <span className="font-light opacity-50">v2.4</span></div>
        </div>
        <div className="flex flex-col items-end gap-1 font-mono text-[10px] opacity-60">
          <div>LAT: 35.6895° N</div>
          <div>LNG: 139.6917° E</div>
          <div className="transition-colors duration-300" style={{ color }}>STABLE EMISSION</div>
        </div>
      </header>

      {/* Left Sidebar Data Panel */}
      <aside className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-12 z-20 pointer-events-none">
        <div className="space-y-2">
          <div className="text-[9px] uppercase tracking-widest font-bold transition-colors duration-300" style={{ color }}>Velocity Map</div>
          <div className="text-3xl font-mono tracking-tighter">{velocity}<span className="text-sm opacity-40 ml-1">{velocityUnit}</span></div>
          <div className="w-16 h-px opacity-30 transition-colors duration-300" style={{ backgroundColor: color }}></div>
        </div>
        <div className="space-y-2">
          <div className="text-[9px] uppercase tracking-widest font-bold transition-colors duration-300" style={{ color }}>Ionization</div>
          <div className="text-3xl font-mono tracking-tighter">{ionization}<span className="text-sm opacity-40 ml-1">eV</span></div>
          <div className="w-16 h-px opacity-30 transition-colors duration-300" style={{ backgroundColor: color }}></div>
        </div>
        <div className="space-y-2">
          <div className="text-[9px] uppercase tracking-widest font-bold transition-colors duration-300" style={{ color }}>Decay Rate</div>
          <div className="text-3xl font-mono tracking-tighter">{decayRate}<span className="text-sm opacity-40 ml-1">%</span></div>
          <div className="w-16 h-px opacity-30 transition-colors duration-300" style={{ backgroundColor: color }}></div>
        </div>
      </aside>

      {/* Right Sidebar Spectrometer */}
      <aside className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-4 z-20 items-end font-mono pointer-events-none">
        <div className="text-[9px] uppercase tracking-widest font-bold mb-2 transition-colors duration-300" style={{ color }}>Spectrum Analysis</div>
        <div className="flex items-end gap-1 h-32">
          {[20, 40, 90, 60, 100, 30, 70].map((h, i) => (
            <div key={i} className="w-1 transition-all duration-300 opacity-50" style={{ backgroundColor: color, height: `${h * (level/10 * 0.4 + 0.6)}%` }}></div>
          ))}
        </div>
        <div className="text-[10px] text-right opacity-40 leading-tight">
          PHASE: {(level * 0.012).toFixed(3)}ms<br/>
          ATTENUATION: -{42 - level}db<br/>
          WAVE: 10e-{(12 - level/2).toFixed(1)}m
        </div>
      </aside>

      {/* Main Center Visualizer */}
      <main className="flex flex-col items-center justify-center z-10 relative pointer-events-none mt-[-100px] md:mt-0">
        <div 
          className="text-[120px] md:text-[160px] font-bold leading-none select-none tracking-tighter text-white"
          style={{
            textShadow: `0 0 ${level * 15}px ${color}`,
            transform: `scale(${1 + level * 0.12})`,
            transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), text-shadow 0.3s'
          }}
        >
          {level}
        </div>
        
        <div className="mt-4 flex flex-col items-center">
          <div className="text-xl md:text-2xl font-bold tracking-[0.4em] uppercase drop-shadow-sm transition-colors duration-300" style={{ color }}>{title}</div>
          <div className="mt-1 text-[9px] md:text-[11px] font-mono uppercase tracking-[0.2em] opacity-40">{subtitle}</div>
        </div>
      </main>

      {/* Bottom Controls */}
      <footer className="absolute bottom-8 md:bottom-12 w-full flex flex-col items-center gap-6 z-20">
        <div className="flex items-center justify-center gap-4 w-[90%] md:w-[400px]">
          <span className="font-mono text-xs opacity-50">LVL.01</span>
          <div className="flex-1 relative flex items-center group h-6 cursor-pointer">
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={level}
              onChange={handleSliderChange}
              className="absolute w-full opacity-0 cursor-pointer z-10 h-full"
              aria-label="Radiation Level"
            />
            <div className="w-full h-[2px] bg-white/10 relative rounded-full pointer-events-none">
              <div 
                className="absolute left-0 top-0 h-full transition-all duration-100"
                style={{ width: `${(level - 1) / 9 * 100}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-4 border-[#020305] shadow-lg translate-x-1/2"></div>
              </div>
            </div>
          </div>
          <span className="font-mono text-xs font-bold transition-colors duration-300" style={{ color }}>LVL.10</span>
        </div>
        
        <div className="flex gap-2">
          {['alpha', 'beta', 'gamma'].map((t) => (
             <div 
               key={t}
               className={`px-4 md:px-6 py-1 border rounded-full text-[10px] uppercase font-bold tracking-widest transition-colors duration-300 ${type === t ? 'bg-opacity-10' : 'border-white/10 text-white/40'}`}
               style={type === t ? { borderColor: color, backgroundColor: `${color}1A`, color: color } : {}}
             >
               {t === type ? `${t} Active` : t}
             </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
