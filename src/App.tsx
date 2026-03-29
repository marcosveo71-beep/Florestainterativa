/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Environment, Html, useProgress } from '@react-three/drei';
import { Forest } from './components/Forest';
import { Player } from './components/Player';
import { Ground } from './components/Ground';
import { MobileControls } from './components/MobileControls';
import { Grass } from './components/Grass';
import { Lake } from './components/Lake';
import { Mushrooms } from './components/Mushrooms';
import { Rain } from './components/Rain';
import { Snow } from './components/Snow';
import { FallingLeaves } from './components/FallingLeaves';
import { SnowAccumulation } from './components/SnowAccumulation';
import { MultiplayerManager } from './components/MultiplayerManager';

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center bg-black/80 text-white p-8 rounded-2xl backdrop-blur-md">
        <div className="text-2xl font-bold mb-4">Gerando Floresta...</div>
        <div className="w-64 h-4 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 text-sm text-gray-300">{progress.toFixed(0)}%</div>
      </div>
    </Html>
  );
}

const SEASONS = {
  spring: {
    name: 'Primavera',
    leafColor: '#88ff88',
    grassColor: '#5ebd4b',
    groundColor: '#3e5a2f',
    skyColor: '#87CEEB',
    sunPosition: [50, 60, 50],
    ambientIntensity: 0.6,
    lightIntensity: 1.2,
  },
  summer: {
    name: 'Verão',
    leafColor: '#2d5a27',
    grassColor: '#3a7a28',
    groundColor: '#2e4a1f',
    skyColor: '#4ba3e3',
    sunPosition: [10, 100, 10],
    ambientIntensity: 0.7,
    lightIntensity: 1.5,
  },
  autumn: {
    name: 'Outono',
    leafColor: '#d95a2b',
    grassColor: '#8b7335',
    groundColor: '#5c4a2e',
    skyColor: '#a8b5b2',
    sunPosition: [80, 30, 80],
    ambientIntensity: 0.4,
    lightIntensity: 1.0,
  },
  winter: {
    name: 'Inverno',
    leafColor: '#ffffff',
    grassColor: '#e0eaf5',
    groundColor: '#c2d1e0',
    skyColor: '#b0c4de',
    sunPosition: [100, 15, 100],
    ambientIntensity: 0.3,
    lightIntensity: 0.8,
  }
};

const seasonKeys = Object.keys(SEASONS) as Array<keyof typeof SEASONS>;

export default function App() {
  const [seasonIndex, setSeasonIndex] = useState(1); // Start at summer
  const [timeLeft, setTimeLeft] = useState(100);
  const [isRaining, setIsRaining] = useState(true);
  const [playerCount, setPlayerCount] = useState(1);

  useEffect(() => {
    const handlePlayerCount = (e: any) => setPlayerCount(e.detail);
    window.addEventListener('playerCountChange', handlePlayerCount);
    return () => window.removeEventListener('playerCountChange', handlePlayerCount);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setSeasonIndex((idx) => (idx + 1) % seasonKeys.length);
          return 100;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const seasonKey = seasonKeys[seasonIndex];
  const season = SEASONS[seasonKey];

  // Se estiver chovendo, o céu fica mais cinza e a neblina mais densa
  const currentSkyColor = isRaining ? '#667788' : season.skyColor;
  const fogNear = isRaining ? 2 : 10;
  const fogFar = isRaining ? 40 : 150;
  const ambientIntensity = isRaining ? season.ambientIntensity * 0.5 : season.ambientIntensity;
  const lightIntensity = isRaining ? season.lightIntensity * 0.2 : season.lightIntensity;

  return (
    <div className="w-full h-screen overflow-hidden relative" style={{ backgroundColor: currentSkyColor, transition: 'background-color 2s ease' }}>
      <Canvas dpr={1} camera={{ fov: 75, near: 0.1, far: 1000 }}>
        <fog attach="fog" args={[currentSkyColor, fogNear, fogFar]} />
        <ambientLight intensity={ambientIntensity} />
        <directionalLight 
          position={season.sunPosition as any} 
          intensity={lightIntensity} 
        />
        
        <Sky 
          sunPosition={season.sunPosition as any} 
          turbidity={isRaining ? 20 : 0.1} 
          rayleigh={isRaining ? 0.01 : 0.5} 
          mieCoefficient={0.005} 
          mieDirectionalG={0.8} 
        />
        <Environment preset="park" />
        
        <Suspense fallback={<Loader />}>
          <Forest leafColor={season.leafColor} />
          <Grass color={season.grassColor} />
          <Lake />
          <Mushrooms visible={seasonKey === 'autumn'} />
          <Rain visible={isRaining && seasonKey !== 'winter'} />
          <Snow visible={isRaining && seasonKey === 'winter'} />
          <FallingLeaves visible={seasonKey === 'autumn'} />
          <SnowAccumulation isWinter={seasonKey === 'winter'} />
          <Player />
          <MultiplayerManager />
        </Suspense>
        
        <Ground color={season.groundColor} />
      </Canvas>
      
      <MobileControls />
      
      <div className="absolute top-4 left-4 text-white/80 text-sm pointer-events-none drop-shadow-md z-10">
        Arraste o dedo na tela para olhar ao redor.<br/>
        Use os botões ou WASD/Setas para andar.<br/>
        <span className="text-green-400 font-bold">Multiplayer Online Ativado!</span><br/>
        <span className="text-blue-300 font-semibold">Jogadores na sala: {playerCount}/3</span>
      </div>

      <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-10">
        <div className="bg-black/40 backdrop-blur-md text-white px-4 py-3 rounded-xl border border-white/20 flex flex-col items-end shadow-lg pointer-events-none">
          <span className="text-[10px] text-white/80 uppercase tracking-wider font-semibold">Estação Atual</span>
          <span className="text-xl font-bold mb-2">{season.name}</span>
          <div className="w-32 h-1.5 bg-black/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-1000 ease-linear"
              style={{ width: `${timeLeft}%` }}
            />
          </div>
          <span className="text-[10px] text-white/60 mt-1">{timeLeft}s restantes</span>
        </div>
        
        <button
          onClick={() => setIsRaining(!isRaining)}
          className={`mt-2 w-full px-4 py-2 rounded-lg backdrop-blur-md transition-colors border shadow-lg ${
            isRaining 
              ? 'bg-blue-500/40 text-white border-blue-300/50' 
              : 'bg-black/40 text-white/80 border-white/20 hover:bg-black/60'
          }`}
        >
          {isRaining ? (seasonKey === 'winter' ? '❄️ Nevando' : '🌧️ Com Chuva') : '☀️ Céu Limpo'}
        </button>
      </div>
    </div>
  );
}
