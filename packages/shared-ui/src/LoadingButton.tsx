import { useCallback, useEffect, useRef, useState, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

const CELL = { type: "spring", stiffness: 520, damping: 34, mass: 0.45 } as const;
const CROSSFADE = { type: "spring", stiffness: 260, damping: 34, mass: 0.8 } as const;
const INSTANT = { duration: 0 } as const;

export type AsyncActionStatus = "idle" | "pending" | "success" | "error";

export type UseAsyncActionOptions = {
  action: () => unknown;
  resetAfter?: number;
  onError?: (error: unknown) => void;
};

export function useAsyncAction({ action, resetAfter = 1400, onError }: UseAsyncActionOptions) {
  const [status, setStatus] = useState<AsyncActionStatus>("idle");
  const phase = useRef<AsyncActionStatus>("idle");
  const runId = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  const act = useRef(action);
  const fail = useRef(onError);

  useEffect(() => { act.current = action; fail.current = onError; });

  const clear = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
  }, []);

  const run = useCallback(() => {
    if (phase.current === "pending") return;
    clear();
    const id = ++runId.current;
    phase.current = "pending";
    setStatus("pending");

    const settle = (next: "success" | "error") => {
      if (!alive.current || id !== runId.current) return;
      clear();
      phase.current = next;
      setStatus(next);
      timer.current = setTimeout(() => {
        if (!alive.current || id !== runId.current) return;
        phase.current = "idle";
        setStatus("idle");
      }, resetAfter);
    };

    Promise.resolve()
      .then(() => act.current())
      .then(() => settle("success"), (error: unknown) => { fail.current?.(error); settle("error"); });
  }, [clear, resetAfter]);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; clear(); };
  }, [clear]);

  return { status, run, pending: status === "pending" };
}

function Spinner({ still }: { still: boolean }) {
  return (
    <motion.svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true" animate={still ? undefined : { rotate: 360 }} transition={still ? undefined : { duration: 0.85, repeat: Infinity, ease: "linear" }}>
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.22" />
      <path d="M10.5 6A4.5 4.5 0 0 0 6 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </motion.svg>
  );
}

export type LoadingButtonProps = {
  onAction: () => unknown;
  children: ReactNode;
  pendingLabel?: ReactNode;
  successLabel?: ReactNode;
  errorLabel?: ReactNode;
  resetAfter?: number;
  disabled?: boolean;
  onError?: (error: unknown) => void;
  style?: React.CSSProperties;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function LoadingButton({
  onAction, children, pendingLabel = "Processing...", successLabel = "Saved ✓",
  errorLabel = "Try again", resetAfter = 1400, disabled = false, onError, style, variant = 'primary'
}: LoadingButtonProps) {
  const reduced = useReducedMotion();
  const { status, run, pending } = useAsyncAction({ action: onAction, resetAfter, onError });
  const fade = reduced ? INSTANT : CROSSFADE;

  const bgStyle = variant === 'danger' ? '#ef4444' : variant === 'secondary' ? '#f1f5f9' : '#0f172a';
  const textStyle = variant === 'secondary' ? '#0f172a' : '#ffffff';

  const faces = [
    { key: "idle", content: children },
    { key: "pending", content: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Spinner still={reduced === true} /> {pendingLabel}</span> },
    { key: "success", content: successLabel },
    { key: "error", content: errorLabel }
  ];

  return (
    <motion.button
      type="button"
      disabled={disabled || pending}
      whileTap={disabled || pending || reduced ? undefined : { scale: 0.97 }}
      transition={CELL}
      onClick={(e) => { e.preventDefault(); if (!pending) run(); }}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '12px 24px', borderRadius: '16px', border: 'none',
        backgroundColor: disabled ? '#cbd5e1' : bgStyle, color: textStyle,
        fontWeight: 700, fontSize: '0.92rem', cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.12)', transition: 'background-color 0.2s ease',
        ...style
      }}
    >
      <span style={{ display: 'grid', placeItems: 'center' }}>
        {faces.map((face) => (
          <motion.span
            key={face.key}
            initial={false}
            animate={face.key === status ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 3, filter: "blur(3px)" }}
            transition={fade}
            style={{ gridColumn: 1, gridRow: 1, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {face.content}
          </motion.span>
        ))}
      </span>
    </motion.button>
  );
}
