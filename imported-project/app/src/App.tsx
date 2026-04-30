import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  User,
  Pause,
  RotateCcw,
  Home,
  ChevronLeft,
  Trophy,
  Star,
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Zap,
  Globe,
  Mail,
  Phone,
  Linkedin,
  Github,
  ExternalLink,
  Brain,
  Target,
  TrendingUp,
  Cpu,
  Rocket,
} from 'lucide-react';

/* ==================================================================
   TYPES
   ================================================================== */
type Screen = 'menu' | 'game' | 'profile' | 'about';
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type GameState = 'playing' | 'paused' | 'over';

interface Position {
  x: number;
  y: number;
}

/* ==================================================================
   CONSTANTS
   ================================================================== */
const GRID_SIZE = 20;
const CELL_SIZE = 18;
const GAME_SPEED = 120;
const SKILL_FOODS = [
  'REACT', 'AI', 'SEO', 'LLM', 'NODE', 'PYTHON', 'THREE',
  'N8N', 'HUBSPOT', 'ZAPIER', 'GSAP', 'FIGMA', 'DOCKER',
  'SQL', 'NEXT', 'TYPE', 'DATA', 'ML', 'ADS', 'GIT',
];

const COLORS = [
  '#FF2A2A', '#FF0066', '#DFFF00', '#00FFFF', '#FF44FF',
  '#44FF44', '#4488FF', '#FF8844', '#FF4444', '#44FF88',
];

/* ==================================================================
   PARTICLE FIELD BACKGROUND
   ================================================================== */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: 1 + Math.random() * 2,
        color: Math.random() > 0.5 ? '#FF2A2A' : '#FF0066',
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.5;
        ctx.fill();

        // Draw connections
        particles.forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = 0.08 * (1 - dist / 120);
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

/* ==================================================================
   GLITCH TITLE COMPONENT
   ================================================================== */
function GlitchTitle({ text, className = '' }: { text: string; className?: string }) {
  return (
    <h1
      className={`glitch-text font-black tracking-tighter ${className}`}
      data-text={text}
    >
      {text}
    </h1>
  );
}

/* ==================================================================
   SNAKE GAME COMPONENT
   ================================================================== */
function SnakeGame({ onGameOver, onScoreChange }: { onGameOver: (score: number) => void; onScoreChange: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const snakeRef = useRef<Position[]>([{ x: 10, y: 10 }]);
  const foodRef = useRef<Position & { word: string; color: string }>({
    x: 15,
    y: 8,
    word: SKILL_FOODS[0],
    color: COLORS[0],
  });
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const scoreRef = useRef(0);
  const [, setScore] = useState(0);
  const [shake, setShake] = useState(false);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>>([]);

  const spawnFood = useCallback(() => {
    const snake = snakeRef.current;
    let pos: Position;
    do {
      pos = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snake.some((s) => s.x === pos.x && s.y === pos.y));

    foodRef.current = {
      ...pos,
      word: SKILL_FOODS[Math.floor(Math.random() * SKILL_FOODS.length)],
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }, []);

  const resetGame = useCallback(() => {
    snakeRef.current = [{ x: 10, y: 10 }];
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    scoreRef.current = 0;
    setScore(0);
    onScoreChange(0);
    particlesRef.current = [];
    spawnFood();
  }, [spawnFood, onScoreChange]);

  // Handle swipe controls
  useEffect(() => {
    const handleTouch = (() => {
      let startX = 0;
      let startY = 0;

      return {
        start: (e: TouchEvent) => {
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
        },
        end: (e: TouchEvent) => {
          const dx = e.changedTouches[0].clientX - startX;
          const dy = e.changedTouches[0].clientY - startY;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);

          if (Math.max(absDx, absDy) < 20) return;

          const currentDir = directionRef.current;
          if (absDx > absDy) {
            if (dx > 0 && currentDir !== 'LEFT') nextDirectionRef.current = 'RIGHT';
            else if (dx < 0 && currentDir !== 'RIGHT') nextDirectionRef.current = 'LEFT';
          } else {
            if (dy > 0 && currentDir !== 'UP') nextDirectionRef.current = 'DOWN';
            else if (dy < 0 && currentDir !== 'DOWN') nextDirectionRef.current = 'UP';
          }
        },
      };
    })();

    document.addEventListener('touchstart', handleTouch.start, { passive: true });
    document.addEventListener('touchend', handleTouch.end, { passive: true });

    // Keyboard controls
    const handleKey = (e: KeyboardEvent) => {
      const currentDir = directionRef.current;
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
          if (currentDir !== 'DOWN') nextDirectionRef.current = 'UP';
          break;
        case 'ArrowDown': case 's': case 'S':
          if (currentDir !== 'UP') nextDirectionRef.current = 'DOWN';
          break;
        case 'ArrowLeft': case 'a': case 'A':
          if (currentDir !== 'RIGHT') nextDirectionRef.current = 'LEFT';
          break;
        case 'ArrowRight': case 'd': case 'D':
          if (currentDir !== 'LEFT') nextDirectionRef.current = 'RIGHT';
          break;
      }
    };
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('touchstart', handleTouch.start);
      document.removeEventListener('touchend', handleTouch.end);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  // Game loop
  useEffect(() => {
    resetGame();

    gameLoopRef.current = setInterval(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const snake = snakeRef.current;
      directionRef.current = nextDirectionRef.current;
      const dir = directionRef.current;

      const head = { ...snake[0] };
      switch (dir) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      // Collision check
      if (
        head.x < 0 || head.x >= GRID_SIZE ||
        head.y < 0 || head.y >= GRID_SIZE ||
        snake.some((s) => s.x === head.x && s.y === head.y)
      ) {
        clearInterval(gameLoopRef.current!);
        setShake(true);
        setTimeout(() => setShake(false), 400);
        onGameOver(scoreRef.current);
        return;
      }

      snake.unshift(head);

      // Eat food
      const food = foodRef.current;
      if (head.x === food.x && head.y === food.y) {
        scoreRef.current += 10;
        setScore(scoreRef.current);
        onScoreChange(scoreRef.current);

        // Spawn particles
        for (let i = 0; i < 8; i++) {
          particlesRef.current.push({
            x: food.x * CELL_SIZE + CELL_SIZE / 2,
            y: food.y * CELL_SIZE + CELL_SIZE / 2,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1,
            color: food.color,
          });
        }

        spawnFood();
      } else {
        snake.pop();
      }

      // Render
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = 'rgba(255, 42, 42, 0.06)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= GRID_SIZE; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, GRID_SIZE * CELL_SIZE);
        ctx.stroke();
      }
      for (let y = 0; y <= GRID_SIZE; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(GRID_SIZE * CELL_SIZE, y * CELL_SIZE);
        ctx.stroke();
      }

      // Draw food with glow
      const fx = food.x * CELL_SIZE;
      const fy = food.y * CELL_SIZE;
      ctx.save();
      ctx.shadowColor = food.color;
      ctx.shadowBlur = 20;
      ctx.fillStyle = food.color;
      ctx.beginPath();
      ctx.arc(fx + CELL_SIZE / 2, fy + CELL_SIZE / 2, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw food word
      ctx.font = 'bold 7px "Inter", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(food.word, fx + CELL_SIZE / 2, fy + CELL_SIZE / 2);

      // Draw snake
      snake.forEach((seg, i) => {
        const sx = seg.x * CELL_SIZE;
        const sy = seg.y * CELL_SIZE;

        if (i === 0) {
          // Head
          ctx.save();
          ctx.shadowColor = '#FF2A2A';
          ctx.shadowBlur = 15;
          ctx.fillStyle = '#FF2A2A';
          const pad = 1;
          ctx.beginPath();
          roundRect(ctx, sx + pad, sy + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2, 5);
          ctx.fill();
          ctx.restore();

          // Eyes
          ctx.fillStyle = '#FFFFFF';
          if (dir === 'RIGHT' || dir === 'LEFT') {
            ctx.fillRect(sx + (dir === 'RIGHT' ? 12 : 4), sy + 4, 3, 3);
            ctx.fillRect(sx + (dir === 'RIGHT' ? 12 : 4), sy + 10, 3, 3);
          } else {
            ctx.fillRect(sx + 4, sy + (dir === 'DOWN' ? 12 : 4), 3, 3);
            ctx.fillRect(sx + 10, sy + (dir === 'DOWN' ? 12 : 4), 3, 3);
          }
        } else {
          // Body
          const alpha = Math.max(0.3, 1 - i / (snake.length + 5));
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = i % 2 === 0 ? '#CC0000' : '#FF2A2A';
          const pad = 2;
          ctx.beginPath();
          roundRect(ctx, sx + pad, sy + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2, 4);
          ctx.fill();
          ctx.restore();
        }
      });

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        if (p.life <= 0) return false;

        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return true;
      });
    }, GAME_SPEED);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [resetGame, spawnFood, onGameOver, onScoreChange]);

  return (
    <div className={`relative w-full flex items-center justify-center ${shake ? 'screen-shake' : ''}`}>
      <canvas
        ref={canvasRef}
        width={GRID_SIZE * CELL_SIZE}
        height={GRID_SIZE * CELL_SIZE}
        className="game-canvas rounded-lg border border-neon-red/20"
        style={{
          boxShadow: '0 0 30px rgba(255, 42, 42, 0.2), inset 0 0 30px rgba(255, 42, 42, 0.05)',
          maxWidth: '100%',
        }}
      />
    </div>
  );
}

// Helper for rounded rectangles
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ==================================================================
   GAME OVER MODAL
   ================================================================== */
function GameOverModal({
  score,
  highScore,
  onRetry,
  onHome,
  onProfile,
}: {
  score: number;
  highScore: number;
  onRetry: () => void;
  onHome: () => void;
  onProfile: () => void;
}) {
  const isNewHigh = score > 0 && score >= highScore;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center modal-backdrop">
      <div className="w-full max-w-md bg-surface-elevated rounded-t-3xl p-6 animate-slide-up border-t border-neon-red/30">
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />

        {isNewHigh && (
          <div className="flex items-center justify-center gap-2 mb-4 animate-bounce-subtle">
            <Trophy className="w-6 h-6 text-acid-yellow" />
            <span className="text-acid-yellow font-bold text-lg">NEW HIGH SCORE!</span>
          </div>
        )}

        <div className="text-center mb-8">
          <p className="text-text-secondary text-sm mb-1">GAME OVER</p>
          <p className="text-6xl font-black text-neon-red score-glow">{score}</p>
          <p className="text-text-secondary text-sm mt-2">High Score: {highScore}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full h-14 bg-neon-red text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 glow-button active:scale-95 transition-transform"
          >
            <RotateCcw className="w-5 h-5" />
            Try Again
          </button>

          <button
            onClick={onProfile}
            className="w-full h-14 bg-surface border border-neon-red/30 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <User className="w-5 h-5" />
            View Profile
          </button>

          <button
            onClick={onHome}
            className="w-full h-14 bg-transparent text-text-secondary font-medium rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Home className="w-5 h-5" />
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==================================================================
   PAUSE MODAL
   ================================================================== */
function PauseModal({
  onResume,
  onRestart,
  onHome,
}: {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center modal-backdrop">
      <div className="w-full max-w-md bg-surface-elevated rounded-t-3xl p-6 animate-slide-up border-t border-neon-red/30">
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />

        <h2 className="text-2xl font-black text-center text-white mb-8 tracking-wider">PAUSED</h2>

        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full h-14 bg-neon-red text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 glow-button active:scale-95 transition-transform"
          >
            <Play className="w-5 h-5" fill="white" />
            Resume
          </button>

          <button
            onClick={onRestart}
            className="w-full h-14 bg-surface border border-neon-red/30 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <RotateCcw className="w-5 h-5" />
            Restart
          </button>

          <button
            onClick={onHome}
            className="w-full h-14 bg-transparent text-text-secondary font-medium rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Home className="w-5 h-5" />
            Quit to Menu
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==================================================================
   MENU SCREEN
   ================================================================== */
function MenuScreen({ onPlay, onProfile }: { onPlay: () => void; onProfile: () => void }) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between py-8 px-6">
      {/* Top Bar */}
      <div className="w-full flex justify-end">
        <button
          onClick={onProfile}
          className="w-12 h-12 rounded-full bg-surface border border-neon-red/30 flex items-center justify-center active:scale-90 transition-transform"
        >
          <User className="w-5 h-5 text-neon-red" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {/* Snake Icon Animation */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-2xl bg-neon-red/10 border border-neon-red/30 flex items-center justify-center animate-pulse-glow">
            <div className="grid grid-cols-3 gap-1">
              <div className="w-4 h-4 rounded-sm bg-neon-red" />
              <div className="w-4 h-4 rounded-sm bg-neon-red" />
              <div className="w-4 h-4 rounded-sm bg-transparent" />
              <div className="w-4 h-4 rounded-sm bg-transparent" />
              <div className="w-4 h-4 rounded-sm bg-neon-red" />
              <div className="w-4 h-4 rounded-sm bg-neon-red" />
              <div className="w-4 h-4 rounded-sm bg-neon-red" />
              <div className="w-4 h-4 rounded-sm bg-transparent" />
              <div className="w-4 h-4 rounded-sm bg-transparent" />
            </div>
          </div>
          {/* Orbiting dots */}
          <div className="absolute inset-0 animate-spin-slow">
            <div className="absolute -top-1 left-1/2 w-2 h-2 rounded-full bg-neon-pink" />
          </div>
        </div>

        {/* Title */}
        <GlitchTitle
          text="SNAKE"
          className="text-6xl text-white mb-2"
        />
        <p className="text-neon-red text-sm font-medium tracking-[0.3em] mb-1">DEV EDITION</p>
        <p className="text-text-secondary text-xs tracking-wider">Eat Skills. Grow Your Stack.</p>

        {/* Floating skill badges */}
        <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-xs">
          {SKILL_FOODS.slice(0, 8).map((skill, i) => (
            <span
              key={skill}
              className="px-3 py-1 rounded-full text-xs font-mono border animate-fade-in"
              style={{
                borderColor: `${COLORS[i % COLORS.length]}40`,
                color: COLORS[i % COLORS.length],
                animationDelay: `${i * 0.1}s`,
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Play Button */}
      <div className="w-full max-w-xs">
        <button
          onClick={onPlay}
          className="w-full h-16 bg-neon-red text-white font-black text-xl rounded-2xl flex items-center justify-center gap-3 glow-button active:scale-95 transition-transform tracking-wider"
        >
          <Play className="w-6 h-6" fill="white" />
          PLAY
        </button>

        <p className="text-center text-text-secondary text-xs mt-4">
          Swipe to move &middot; Eat skill tags &middot; Avoid walls
        </p>
      </div>
    </div>
  );
}

/* ==================================================================
   GAME ARENA SCREEN
   ================================================================== */
function GameArenaScreen({
  onHome,
  onProfile,
}: {
  onHome: () => void;
  onProfile: () => void;
}) {
  const [score, setScore] = useState(0);
  const [highScore] = useState(() => {
    const saved = localStorage.getItem('snake_high_score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [gameState, setGameState] = useState<GameState>('playing');
  const [finalScore, setFinalScore] = useState(0);
  const [gameKey, setGameKey] = useState(0);

  const handleGameOver = useCallback((final: number) => {
    setFinalScore(final);
    setGameState('over');
    if (final > highScore) {
      localStorage.setItem('snake_high_score', final.toString());
    }
  }, [highScore]);

  const handleRetry = () => {
    setGameKey(k => k + 1);
    setScore(0);
    setGameState('playing');
  };

  const handlePause = () => {
    setGameState('paused');
  };

  const handleResume = () => {
    setGameState('playing');
    setGameKey(k => k + 1);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center px-4 py-4">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePause}
            className="w-10 h-10 rounded-xl bg-surface border border-neon-red/20 flex items-center justify-center active:scale-90 transition-transform"
          >
            <Pause className="w-5 h-5 text-white" />
          </button>
          <div>
            <p className="text-text-secondary text-xs">SCORE</p>
            <p className="text-2xl font-black text-neon-red score-glow">{score}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right mr-2">
            <p className="text-text-secondary text-xs">BEST</p>
            <p className="text-sm font-bold text-acid-yellow">{highScore}</p>
          </div>
          <button
            onClick={onProfile}
            className="w-10 h-10 rounded-xl bg-surface border border-neon-red/20 flex items-center justify-center active:scale-90 transition-transform"
          >
            <User className="w-5 h-5 text-neon-red" />
          </button>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="flex-1 flex items-center justify-center w-full">
        {gameState === 'playing' && (
          <SnakeGame
            key={gameKey}
            onGameOver={handleGameOver}
            onScoreChange={setScore}
          />
        )}
        {gameState === 'paused' && (
          <div className="flex items-center justify-center">
            <div className="text-center animate-fade-in">
              <Pause className="w-16 h-16 text-neon-red mx-auto mb-4" />
              <p className="text-2xl font-bold text-white">PAUSED</p>
            </div>
          </div>
        )}
        {gameState === 'over' && (
          <div className="flex items-center justify-center">
            <div className="text-center animate-fade-in">
              <p className="text-text-secondary text-sm mb-2">FINAL SCORE</p>
              <p className="text-6xl font-black text-neon-red score-glow">{finalScore}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Instructions */}
      <div className="w-full flex items-center justify-center gap-6 mt-4 text-text-secondary text-xs">
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-neon-red" /> Swipe to move
        </span>
        <span className="flex items-center gap-1">
          <Star className="w-3 h-3 text-acid-yellow" /> Eat skills
        </span>
      </div>

      {/* Overlays */}
      {gameState === 'over' && (
        <GameOverModal
          score={finalScore}
          highScore={Math.max(highScore, finalScore)}
          onRetry={handleRetry}
          onHome={onHome}
          onProfile={onProfile}
        />
      )}
      {gameState === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRetry}
          onHome={onHome}
        />
      )}
    </div>
  );
}

/* ==================================================================
   PROFILE / RESUME SCREEN
   ================================================================== */
function ProfileScreen({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'about' | 'skills' | 'exp' | 'projects'>('about');

  const skills = [
    { name: 'AI & Machine Learning', level: 95, icon: Brain },
    { name: 'React / Next.js', level: 92, icon: Code },
    { name: 'Python / Node.js', level: 90, icon: Cpu },
    { name: 'SEO & Analytics', level: 93, icon: TrendingUp },
    { name: 'Marketing Automation', level: 94, icon: Zap },
    { name: 'Three.js / WebGL', level: 82, icon: Globe },
    { name: 'Data Science', level: 88, icon: Target },
    { name: 'Drone Operations', level: 85, icon: Rocket },
  ];

  const experiences = [
    {
      title: 'Founder & Lead Strategist',
      company: 'AdvertiseWV',
      period: '2022 - Present',
      location: 'Morgantown, WV',
      points: [
        'Built AI marketing agency serving WV businesses',
        'Reduced client costs by 47% via automation',
        'Manage 15+ live websites, 50+ projects shipped',
        'Full-stack dev with React, Next.js, Node.js',
      ],
    },
    {
      title: 'Founder & Remote Pilot',
      company: 'Elevated Imaging',
      period: '2019 - Present',
      location: 'WV / Canada',
      points: [
        'Commercial aerial photography & videography',
        '250+ flight hours, dual-country certified',
        'Enterprise clients: Zeitview, CBRE',
        'Thermal imaging & photogrammetry expert',
      ],
    },
  ];

  const projects = [
    { name: 'AdvertiseWV', desc: 'AI-powered marketing platform with SEO & automation', tags: ['React', 'AI', 'SEO'] },
    { name: 'NCRJ Watch', desc: 'Public safety platform with real-time data viz', tags: ['Next.js', 'Data Viz'] },
    { name: 'Dark Rose Tattoo', desc: 'Award-winning app with video backgrounds', tags: ['Three.js', 'GSAP'] },
    { name: 'Buckhannon.ai', desc: 'Hyperlocal AI for rural small-town America', tags: ['AI', 'LLM'] },
    { name: 'Body Armor MMA', desc: 'Multi-page martial arts training website', tags: ['React', 'CMS'] },
  ];

  const certifications = [
    'FAA Part 107 Remote Pilot',
    'RPAS Advanced Operations (Canada)',
    'Google Analytics Certified',
    'Google Ads Search & Display',
    'HubSpot Inbound Marketing',
    'HubSpot Content Marketing',
    'HubSpot SEO Certified',
    'Hootsuite Social Marketing',
  ];

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-void/90 backdrop-blur-lg border-b border-neon-red/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-surface border border-neon-red/20 flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-lg font-bold text-white tracking-wider">RESUME</h2>
          <div className="w-10" />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Hero Section */}
        <div className="relative px-6 pt-6 pb-8 hex-bg">
          {/* Avatar with glow */}
          <div className="relative w-28 h-28 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full bg-neon-red/20 animate-pulse-glow" />
            <img
              src="/avatar.png"
              alt="Adaryus Gillum"
              className="relative w-full h-full rounded-full object-cover border-2 border-neon-red/50"
            />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-neon-red flex items-center justify-center">
              <Award className="w-4 h-4 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-black text-center text-white mb-1">
            Adaryus R. Gillum
          </h1>
          <p className="text-neon-red text-center text-sm font-medium tracking-wider mb-3">
            AI-MARKETING STRATEGIST
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full text-xs bg-surface border border-neon-red/20 text-text-secondary flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Morgantown, WV
            </span>
          </div>

          {/* Contact Chips */}
          <div className="flex flex-wrap justify-center gap-2">
            <a href="mailto:hello@adaryus.com" className="px-3 py-1.5 rounded-lg bg-surface border border-neon-red/20 text-xs text-text-secondary flex items-center gap-1.5 active:scale-95 transition-transform">
              <Mail className="w-3 h-3 text-neon-red" /> hello@adaryus.com
            </a>
            <a href="tel:+13042907713" className="px-3 py-1.5 rounded-lg bg-surface border border-neon-red/20 text-xs text-text-secondary flex items-center gap-1.5 active:scale-95 transition-transform">
              <Phone className="w-3 h-3 text-neon-red" /> (304) 290-7713
            </a>
            <a href="https://linkedin.com/in/adaryus" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-surface border border-neon-red/20 text-xs text-text-secondary flex items-center gap-1.5 active:scale-95 transition-transform">
              <Linkedin className="w-3 h-3 text-neon-red" /> LinkedIn
            </a>
            <a href="https://github.com/adaryusrgillum" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-surface border border-neon-red/20 text-xs text-text-secondary flex items-center gap-1.5 active:scale-95 transition-transform">
              <Github className="w-3 h-3 text-neon-red" /> GitHub
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="sticky top-0 z-20 bg-void/95 backdrop-blur-lg px-4 py-2 border-b border-white/5">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {([
              { key: 'about', label: 'About', icon: User },
              { key: 'skills', label: 'Skills', icon: Star },
              { key: 'exp', label: 'Experience', icon: Briefcase },
              { key: 'projects', label: 'Projects', icon: Code },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all active:scale-95 ${
                  activeTab === tab.key
                    ? 'bg-neon-red text-white'
                    : 'bg-surface text-text-secondary border border-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 py-6 pb-24">
          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-surface-elevated rounded-2xl p-5 border border-neon-red/10">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-neon-red" /> Professional Summary
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  AI-Marketing Strategist bridging human intuition with machine precision. M.S. AI Marketing candidate at West Virginia University specializing in data science, spatial computing, and strategic marketing. Founded AdvertiseWV to deliver cutting-edge SEO, advertising automation, and AI solutions. Full-stack developer with 50+ projects shipped, 20+ certifications, and 5+ years driving measurable growth through integrated marketing and intelligent automation.
                </p>
              </div>

              <div className="bg-surface-elevated rounded-2xl p-5 border border-neon-red/10">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-neon-red" /> Education
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-semibold text-sm">M.S. in AI Marketing</p>
                        <p className="text-neon-red text-xs">West Virginia University</p>
                      </div>
                      <span className="text-text-secondary text-xs">Aug 2026</span>
                    </div>
                    <p className="text-text-secondary text-xs mt-1">Focus: AI Consumer Behavior, CRM Systems, Data Science, Spatial Computing</p>
                  </div>
                  <div className="border-t border-white/5 pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-semibold text-sm">B.S. in Integrated Marketing Communications</p>
                        <p className="text-neon-red text-xs">West Virginia University</p>
                      </div>
                      <span className="text-text-secondary text-xs">May 2025</span>
                    </div>
                    <p className="text-text-secondary text-xs mt-1">GPA: 3.17 | Advertising, Digital Media, Social Media Strategy</p>
                  </div>
                </div>
              </div>

              <div className="bg-surface-elevated rounded-2xl p-5 border border-neon-red/10">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-neon-red" /> Certifications
                </h3>
                <div className="flex flex-wrap gap-2">
                  {certifications.map((cert) => (
                    <span
                      key={cert}
                      className="px-3 py-1.5 rounded-lg bg-surface border border-neon-red/15 text-xs text-text-secondary"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SKILLS TAB */}
          {activeTab === 'skills' && (
            <div className="space-y-4 animate-fade-in">
              {skills.map((skill, i) => (
                <div
                  key={skill.name}
                  className="bg-surface-elevated rounded-2xl p-4 border border-neon-red/10 animate-fade-up"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-neon-red/10 flex items-center justify-center">
                      <skill.icon className="w-5 h-5 text-neon-red" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">{skill.name}</p>
                    </div>
                    <span className="text-neon-red font-bold text-sm">{skill.level}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-neon-red-dim to-neon-red skill-bar-fill"
                      style={{ width: `${skill.level}%`, animationDelay: `${i * 0.1}s` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* EXPERIENCE TAB */}
          {activeTab === 'exp' && (
            <div className="space-y-6 animate-fade-in">
              {experiences.map((exp, i) => (
                <div
                  key={exp.company}
                  className="bg-surface-elevated rounded-2xl p-5 border border-neon-red/10 animate-fade-up"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-white font-bold text-base">{exp.title}</h4>
                      <p className="text-neon-red text-sm font-medium">{exp.company}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-text-secondary text-xs">{exp.period}</p>
                      <p className="text-text-secondary text-xs">{exp.location}</p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {exp.points.map((point, j) => (
                      <li key={j} className="flex items-start gap-2 text-text-secondary text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-neon-red mt-2 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeTab === 'projects' && (
            <div className="space-y-4 animate-fade-in">
              {projects.map((project, i) => (
                <div
                  key={project.name}
                  className="bg-surface-elevated rounded-2xl p-5 border border-neon-red/10 card-hover animate-fade-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-white font-bold text-base">{project.name}</h4>
                    <ExternalLink className="w-4 h-4 text-text-secondary" />
                  </div>
                  <p className="text-text-secondary text-sm mb-3">{project.desc}</p>
                  <div className="flex gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-neon-red/10 text-neon-red text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                {[
                  { label: 'Projects', value: '50+', icon: Code },
                  { label: 'Certs', value: '20+', icon: Award },
                  { label: 'Years', value: '5+', icon: Briefcase },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-surface-elevated rounded-2xl p-4 border border-neon-red/10 text-center"
                  >
                    <stat.icon className="w-5 h-5 text-neon-red mx-auto mb-2" />
                    <p className="text-2xl font-black text-white">{stat.value}</p>
                    <p className="text-text-secondary text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// MapPin component since it's not imported
function MapPin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/* ==================================================================
   ABOUT / INFO SCREEN
   ================================================================== */
function AboutScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="sticky top-0 z-30 bg-void/90 backdrop-blur-lg border-b border-neon-red/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-surface border border-neon-red/20 flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-lg font-bold text-white tracking-wider">ABOUT</h2>
          <div className="w-10" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-8">
        <div className="text-center mb-8">
          <GlitchTitle text="SNAKE" className="text-5xl text-white mb-2" />
          <p className="text-neon-red text-sm tracking-widest">DEV EDITION v1.0</p>
        </div>

        <div className="bg-surface-elevated rounded-2xl p-5 border border-neon-red/10 mb-6">
          <h3 className="text-white font-bold mb-3">How to Play</h3>
          <ul className="space-y-3 text-text-secondary text-sm">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-neon-red/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="w-3 h-3 text-neon-red" />
              </span>
              <span>Swipe on screen or use arrow keys / WASD to control the snake</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-neon-red/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Star className="w-3 h-3 text-neon-red" />
              </span>
              <span>Eat the glowing skill tags to grow and earn points</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-neon-red/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Target className="w-3 h-3 text-neon-red" />
              </span>
              <span>Avoid hitting walls or your own tail</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-neon-red/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Trophy className="w-3 h-3 text-neon-red" />
              </span>
              <span>Beat your high score - it saves automatically!</span>
            </li>
          </ul>
        </div>

        <div className="bg-surface-elevated rounded-2xl p-5 border border-neon-red/10">
          <h3 className="text-white font-bold mb-3">About the Developer</h3>
          <p className="text-text-secondary text-sm leading-relaxed mb-4">
            This portfolio was built by Adaryus Gillum using React, TypeScript, and Tailwind CSS. The Snake game features skill-based food items that represent real technologies in Adaryus's stack.
          </p>
          <div className="flex gap-3">
            <a
              href="https://adaryus.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-10 rounded-xl bg-surface border border-neon-red/20 flex items-center justify-center gap-2 text-sm text-white active:scale-95 transition-transform"
            >
              <Globe className="w-4 h-4 text-neon-red" /> Website
            </a>
            <a
              href="https://github.com/adaryusrgillum"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-10 rounded-xl bg-surface border border-neon-red/20 flex items-center justify-center gap-2 text-sm text-white active:scale-95 transition-transform"
            >
              <Github className="w-4 h-4 text-neon-red" /> GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================================================================
   MAIN APP
   ================================================================== */
function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [prevScreen, setPrevScreen] = useState<Screen>('menu');

  const navigate = (target: Screen) => {
    setPrevScreen(screen);
    setScreen(target);
  };

  return (
    <div className="h-screen w-screen bg-void text-white overflow-hidden relative">
      {/* Background Effects */}
      <ParticleField />

      {/* Scanline overlay */}
      <div className="scanline-overlay" />

      {/* Main Content */}
      <div className="relative z-10 w-full h-full">
        {screen === 'menu' && (
          <MenuScreen
            onPlay={() => navigate('game')}
            onProfile={() => navigate('profile')}
          />
        )}

        {screen === 'game' && (
          <GameArenaScreen
            onHome={() => navigate('menu')}
            onProfile={() => navigate('profile')}
          />
        )}

        {screen === 'profile' && (
          <ProfileScreen onBack={() => navigate(prevScreen === 'game' ? 'game' : 'menu')} />
        )}

        {screen === 'about' && (
          <AboutScreen onBack={() => navigate('menu')} />
        )}
      </div>
    </div>
  );
}

export default App;
