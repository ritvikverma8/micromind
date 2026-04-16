// src/hooks/useSimulation.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import type { MazeSolver, Position, StepResult } from '../core/types';
import { AStar } from '../core/AStar';
import { Dijkstra } from '../core/Dijkstra';
import { QLearningAgent } from '../core/QLearningAgent';
import { DQLAgent } from '../core/DQLAgent';

export type SimulationStatus = 'idle' | 'running' | 'finished';
export type AlgorithmType = 'AStar' | 'Dijkstra' | 'QLearning' | 'DQL';

// Fix 2: Named speed levels (ms per tick) exposed to the UI
export const SPEED_LEVELS = [
  { label: 'Slow',   ms: 200 },
  { label: 'Normal', ms: 50  },
  { label: 'Fast',   ms: 16  },
  { label: 'Turbo',  ms: 4   },
];

export function useSimulation(
    maze: number[][],
    start: Position,
    goal: Position,
    algorithm: AlgorithmType
) {
    // --- UI STATE ---
    const [visitedNodes, setVisitedNodes] = useState<Position[]>([]);
    const [pathFound, setPathFound] = useState<Position[]>([]);
    const [currentPosition, setCurrentPosition] = useState<Position | null>(null); // Fix 6
    const [status, setStatus] = useState<SimulationStatus>('idle');
    const [metadata, setMetadata] = useState<StepResult['metadata']>({});
    const [qValues, setQValues] = useState<Map<string, number>>(new Map());

    // Fix 2: Speed is now controllable state (index into SPEED_LEVELS)
    const [speedIndex, setSpeedIndex] = useState<number>(2); // Default: Fast (16ms)

    // Time tracking
    const [elapsedMs, setElapsedMs] = useState<number | null>(null);
    const startTimeRef = useRef<number | null>(null);

    // --- INTERNAL ENGINE STATE ---
    const solverRef = useRef<MazeSolver>(new AStar());
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const reset = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);

        solverRef.current = algorithm === 'AStar'
            ? new AStar()
            : algorithm === 'Dijkstra'
            ? new Dijkstra()
            : algorithm === 'DQL'
            ? new DQLAgent()
            : new QLearningAgent();

        solverRef.current.initialize(maze, start, goal);

        setVisitedNodes([]);
        setPathFound([]);
        setCurrentPosition(null);
        setMetadata({});
        setQValues(new Map());
        setElapsedMs(null);
        startTimeRef.current = null;
        setStatus('idle');
    }, [maze, start, goal, algorithm]);

    useEffect(() => {
        if (maze.length > 0) reset();
    }, [maze, algorithm, reset]);

    const step = useCallback(() => {
        // Start the clock on the very first step
        if (!startTimeRef.current) startTimeRef.current = performance.now();

        let result = solverRef.current.step();

        if ((algorithm === 'QLearning' || algorithm === 'DQL') && !result.isFinished) {
            // DQL: cram as many training steps as possible per frame for speed
            // QL: moderate batching
            const stepsPerFrame = algorithm === 'DQL'
                ? (maze.length > 30 ? 800 : 1500)
                : (maze.length > 30 ? 99 : 49);
            for (let i = 0; i < stepsPerFrame; i++) {
                result = solverRef.current.step();
                if (result.isFinished) break;
            }
        }

        // Update elapsed time on every tick
        setElapsedMs(performance.now() - startTimeRef.current);

        setVisitedNodes([...result.visitedNodes]);
        setCurrentPosition(result.isFinished ? null : result.currentPosition); // Fix 6
        setMetadata(result.metadata);
        if (result.qValues) setQValues(new Map(result.qValues));

        if (result.isFinished) {
            setPathFound([...result.pathFound]);
            setStatus('finished');
            if (timerRef.current) clearInterval(timerRef.current);
            // Clock freezes at finish — no more updates after this
        }
    }, [algorithm, maze.length]);

    const togglePlay = useCallback(() => {
        if (status === 'finished') return;

        // Fix 5: Always clear any existing interval before deciding what to do next
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (status === 'running') {
            setStatus('idle');
        } else {
            setStatus('running');
            const ms = SPEED_LEVELS[speedIndex].ms;
            timerRef.current = window.setInterval(step, ms);
        }
    }, [status, speedIndex, step]);

    // Fix 2 + Fix 5: When speed changes mid-run, restart the interval at the new rate
    const setSpeed = useCallback((index: number) => {
        setSpeedIndex(index);
        if (status === 'running') {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = window.setInterval(step, SPEED_LEVELS[index].ms);
        }
    }, [status, step]);

    return {
        visitedNodes,
        pathFound,
        currentPosition,
        status,
        metadata,
        qValues,
        elapsedMs,
        speedIndex,
        setSpeed,
        step,
        togglePlay,
        reset
    };
}