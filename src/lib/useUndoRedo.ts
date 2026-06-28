import { useRef, useCallback, useState, useEffect } from "react";

export function useUndoRedo(initial: string) {
  const pastRef = useRef<string[]>([]);
  const presentRef = useRef<string>(initial);
  const futureRef = useRef<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use a counter to force re-render for canUndo/canRedo changes
  const [, setTick] = useState(0);
  const rerender = () => setTick((t) => t + 1);

  const canUndo = pastRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  // Save a snapshot before an AI action
  const pushSnapshot = useCallback((value?: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pastRef.current = [...pastRef.current, presentRef.current];
    if (value !== undefined) presentRef.current = value;
    futureRef.current = [];
    rerender();
  }, []);

  // For continuous typing: update present immediately, debounce snapshot
  const setValue = useCallback((value: string) => {
    presentRef.current = value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pastRef.current = [...pastRef.current, presentRef.current];
      futureRef.current = [];
      rerender();
    }, 2000);
    rerender();
  }, []);

  const undo = useCallback((): string | null => {
    if (pastRef.current.length === 0) return null;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const past = [...pastRef.current];
    const previous = past.pop()!;
    futureRef.current = [presentRef.current, ...futureRef.current];
    pastRef.current = past;
    presentRef.current = previous;
    rerender();
    return previous;
  }, []);

  const redo = useCallback((): string | null => {
    if (futureRef.current.length === 0) return null;
    const future = [...futureRef.current];
    const next = future.shift()!;
    pastRef.current = [...pastRef.current, presentRef.current];
    futureRef.current = future;
    presentRef.current = next;
    rerender();
    return next;
  }, []);

  const reset = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pastRef.current = [];
    presentRef.current = value;
    futureRef.current = [];
    rerender();
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    value: presentRef.current,
    setValue,
    pushSnapshot,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
  };
}
