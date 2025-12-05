import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SimulationEngine } from './services/simulation';
import FloorCanvas from './components/FloorCanvas';
import StatsPanel from './components/StatsPanel';
import { SimulationStats, CellType } from './types';
import { NUM_FLOORS, GRID_WIDTH, GRID_HEIGHT } from './constants';
import { analyzeSafety } from './services/geminiService';
import { Play, Pause, RefreshCw, Flame, Wind, Cpu } from 'lucide-react';

const App: React.FC = () => {
  const engineRef = useRef<SimulationEngine>(new SimulationEngine());
  const [frame, setFrame] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [history, setHistory] = useState<{time: number, smoke: number}[]>([]);
  
  // Calculate Stats
  const calculateStats = useCallback((): SimulationStats => {
    let activeFireCells = 0;
    let totalSmokeMass = 0;
    let totalTemp = 0;
    let cellCount = 0;
    const floorStats = [];

    for (let f = 0; f < NUM_FLOORS; f++) {
      let floorFire = 0;
      let floorSmoke = 0;
      for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
          const cell = engineRef.current.floors[f][y][x];
          if (cell.type !== CellType.WALL) {
            cellCount++;
            totalTemp += cell.temperature;
            totalSmokeMass += cell.smoke;
            floorSmoke += cell.smoke;
            if (cell.fire > 0) {
              activeFireCells++;
              floorFire++;
            }
          }
        }
      }
      floorStats.push({
        floorIndex: f,
        dangerLevel: Math.min(100, (floorFire * 2) + (floorSmoke * 0.5)),
      });
    }

    return {
      activeFireCells,
      totalSmokeMass,
      averageTemperature: cellCount > 0 ? totalTemp / cellCount : 0,
      floorStats,
    };
  }, []);

  const [stats, setStats] = useState<SimulationStats>(calculateStats());

  // Animation Loop
  useEffect(() => {
    let animationId: number;
    const loop = () => {
      if (isRunning) {
        engineRef.current.update();
        setFrame(f => f + 1);
        
        if (frame % 5 === 0) {
           const currentStats = calculateStats();
           setStats(currentStats);
           setHistory(prev => {
             const newHist = [...prev, { time: Date.now(), smoke: currentStats.totalSmokeMass }];
             if (newHist.length > 50) newHist.shift();
             return newHist;
           });
        }
      }
      animationId = requestAnimationFrame(loop);
    };
    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [isRunning, frame, calculateStats]);

  const handleIgnite = (floor: number, x: number, y: number) => {
    engineRef.current.ignite(floor, x, y);
    // Force a single update to show feedback even if paused
    if (!isRunning) {
        setFrame(f => f + 1);
        setStats(calculateStats()); // Update immediately to show jump
    }
  };

  const handleReset = () => {
    engineRef.current.reset();
    setHistory([]);
    setAiAnalysis('');
    setFrame(0);
    setStats(calculateStats());
  };

  const handleAIAnalysis = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    const result = await analyzeSafety(stats);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  // Calculate global smoke opacity for overlay
  // Max smoke mass ~100000 realistically implies 0 opacity. Let's scale it.
  // 3 floors * 60 * 40 * 100 smoke = 720,000 max.
  // Let's say 20,000 is "hazy", 100,000 is "thick".
  const smokeOpacity = Math.min(0.8, stats.totalSmokeMass / 50000);

  return (
    <div className="relative h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden flex">
      
      {/* GLOBAL SMOKE OVERLAY */}
      <div 
        className="absolute inset-0 z-50 pointer-events-none transition-colors duration-1000 ease-in-out mix-blend-hard-light"
        style={{ backgroundColor: `rgba(50, 60, 80, ${smokeOpacity})`, backdropFilter: `blur(${smokeOpacity * 4}px)` }}
      />

      {/* Sidebar / Stats */}
      <aside className="w-80 border-r border-slate-800 bg-slate-900/90 backdrop-blur flex flex-col p-4 gap-6 z-50 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="bg-orange-600 p-2 rounded-lg shadow-[0_0_15px_rgba(234,88,12,0.5)]">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">PyroFlow</h1>
            <p className="text-xs text-slate-500">Physics Engine v2.1</p>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-3 gap-2">
          <button 
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center justify-center p-3 rounded transition-all ${isRunning ? 'bg-amber-900/30 text-amber-500 border border-amber-900' : 'bg-emerald-900/30 text-emerald-500 border border-emerald-900 hover:bg-emerald-900/50'}`}
          >
            {isRunning ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button 
             onClick={handleReset}
             className="flex items-center justify-center p-3 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw size={20} />
          </button>
          <button 
             className="flex items-center justify-center p-3 rounded bg-blue-900/20 border border-blue-900/50 text-blue-400 hover:bg-blue-900/30 transition-colors opacity-50 cursor-not-allowed"
             title="Wind Control (Auto-enabled)"
          >
             <Wind size={20} />
          </button>
        </div>

        {/* Stats Component */}
        <div className="flex-1 overflow-hidden">
          <StatsPanel stats={stats} history={history} />
        </div>

        {/* AI Section */}
        <div className="mt-auto bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-indigo-400 flex items-center gap-2">
              <Cpu size={14} /> HAZARD ANALYSIS
            </span>
            <button 
              onClick={handleAIAnalysis}
              disabled={isAnalyzing}
              className="text-[10px] bg-indigo-600 hover:bg-indigo-500 px-2 py-1 rounded text-white transition-colors disabled:opacity-50"
            >
              {isAnalyzing ? 'SCANNING...' : 'GENERATE REPORT'}
            </button>
          </div>
          <div className="text-xs text-slate-400 min-h-[60px] max-h-[100px] overflow-y-auto leading-relaxed scrollbar-thin">
            {aiAnalysis ? (
               <div dangerouslySetInnerHTML={{ __html: aiAnalysis }} />
            ) : (
              <span className="italic opacity-50">System ready. Await analysis command.</span>
            )}
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-950 z-0">
        <div className="flex justify-between items-center">
            <div className="text-sm text-slate-400">
               <span className="font-mono text-xs opacity-50 mr-2">SIM_STATUS:</span>
               <span className={isRunning ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>{isRunning ? "RUNNING" : "PAUSED"}</span>
               <span className="mx-4 text-slate-700">|</span>
               <span className="font-mono text-xs opacity-50 mr-2">TICK:</span>
               {frame}
            </div>
            <div className="text-xs text-slate-500 border border-slate-800 bg-slate-900/50 px-3 py-1 rounded-full flex gap-4">
                <span>🔥 Click fire again to force vertical breach</span>
                <span>🧱 Walls fail at 800°C</span>
            </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-10">
          {engineRef.current.floors.map((grid, index) => (
             <div key={index} className="flex flex-col gap-2">
                <FloorCanvas 
                  grid={grid} 
                  floorIndex={index} 
                  onIgnite={handleIgnite}
                  width={600}
                  height={400} 
                />
             </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;