import { useState, useRef, useEffect, type ReactNode } from "react";

const FIELD_GAP = 20;

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  counter?: string;
  children: ReactNode;
}

export function Field({ label, required, hint, counter, children }: FieldProps) {
  return (
    <div style={{ marginBottom: FIELD_GAP }}>
      <div
        className="flex items-baseline"
        style={{ marginBottom: "8px", gap: "6px" }}
      >
        <label
          className="m-0"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "0.01em",
            color: "var(--color-ink)",
          }}
        >
          {label}
        </label>
        {required && (
          <span style={{ color: "var(--color-accent)", fontSize: "12px" }}>
            *
          </span>
        )}
        {hint && (
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "var(--color-mid)",
            }}
          >
            {hint}
          </span>
        )}
        {counter && (
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "var(--color-mid)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {counter}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

const controlStyle: React.CSSProperties = {
  width: "100%",
  height: "40px",
  padding: "0 14px",
  background: "var(--color-paper)",
  border: "1px solid var(--color-mist)",
  borderRadius: "var(--radius-sm)",
  fontFamily: "var(--font-body)",
  fontSize: "14px",
  color: "var(--color-ink)",
  outline: "none",
  transition: "border-color 180ms var(--ease-out), box-shadow 180ms var(--ease-out)",
};

interface TextInputProps {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
}

export function TextInput({ value, onChange, placeholder }: TextInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      style={controlStyle}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "var(--color-accent)";
        e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-accent-whisper)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "var(--color-mist)";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

interface TextAreaProps {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  height?: number;
  maxLength?: number;
}

export function TextArea({
  value,
  onChange,
  placeholder,
  height = 96,
  maxLength,
}: TextAreaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      style={{
        ...controlStyle,
        height,
        padding: "12px 14px",
        resize: "none",
        lineHeight: 1.6,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "var(--color-accent)";
        e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-accent-whisper)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "var(--color-mist)";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

interface SelectProps {
  value?: string;
  onChange?: (v: string) => void;
  options: string[];
  placeholder?: string;
}

export function Select({ value, onChange, options, placeholder }: SelectProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Scroll selected into view on open
  useEffect(() => {
    if (!open || !listRef.current || !value) return;
    const el = listRef.current.querySelector(`[data-value="${CSS.escape(value)}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center cursor-pointer"
        style={{
          ...controlStyle,
          paddingRight: "36px",
          color: value ? "var(--color-ink)" : "var(--color-mid)",
          textAlign: "left",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--color-accent)";
          e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-accent-whisper)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--color-mist)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <span className="truncate">{value || (placeholder ?? "请选择")}</span>
      </button>
      <svg
        width="10" height="6" viewBox="0 0 10 6" fill="none"
        style={{
          position: "absolute",
          right: "14px",
          top: "50%",
          transform: open ? "translateY(-50%) rotate(180deg)" : "translateY(-50%)",
          pointerEvents: "none",
          transition: "transform 180ms var(--ease-out)",
        }}
      >
        <path d="M1 1l4 4 4-4" stroke="var(--color-mid)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {open && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 z-30"
          style={{
            top: "calc(100% + 4px)",
            maxHeight: "220px",
            overflowY: "auto",
            background: "var(--color-paper)",
            border: "1px solid var(--color-mist)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-hover)",
          }}
        >
          {options.map((opt) => {
            const active = opt === value;
            return (
              <button
                key={opt}
                type="button"
                data-value={opt}
                onClick={() => { onChange?.(opt); setOpen(false); }}
                className="flex items-center w-full cursor-pointer border-none text-left"
                style={{
                  height: "36px",
                  padding: "0 14px",
                  background: active ? "var(--color-accent-whisper)" : "transparent",
                  color: active ? "var(--color-accent-deep)" : "var(--color-charcoal)",
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  transition: "background 100ms",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "var(--color-accent-whisper)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface RadioGroupProps {
  options: string[];
  value?: string;
  onChange?: (v: string) => void;
}

export function RadioGroup({ options, value, onChange }: RadioGroupProps) {
  return (
    <div className="flex" style={{ gap: "8px" }}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange?.(opt)}
            className="cursor-pointer transition-all duration-150"
            style={{
              height: "40px",
              padding: "0 20px",
              borderRadius: "var(--radius-sm)",
              background: active ? "var(--color-accent-whisper)" : "var(--color-paper)",
              border: active
                ? "1px solid var(--color-accent)"
                : "1px solid var(--color-mist)",
              color: active ? "var(--color-accent-deep)" : "var(--color-charcoal)",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              letterSpacing: "0.02em",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
}

export function Button({ children, onClick, variant = "primary", disabled }: ButtonProps) {
  const base: React.CSSProperties = {
    height: "36px",
    padding: "0 18px",
    fontFamily: "var(--font-body)",
    fontSize: "12px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background 150ms var(--ease-out), color 150ms var(--ease-out), border-color 150ms var(--ease-out)",
    opacity: disabled ? 0.4 : 1,
    borderRadius: 0,
  };

  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: "var(--color-ink)",
      color: "var(--color-paper)",
      border: "1px solid var(--color-ink)",
    },
    secondary: {
      background: "transparent",
      color: "var(--color-charcoal)",
      border: "1px solid var(--color-mist)",
    },
    ghost: {
      background: "transparent",
      color: "var(--color-charcoal)",
      border: "1px solid transparent",
    },
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    onClick?.();
    if (variant === "primary") {
      e.currentTarget.style.background = "var(--color-accent-deep)";
      e.currentTarget.style.borderColor = "var(--color-accent-deep)";
    } else if (variant === "secondary") {
      e.currentTarget.style.borderColor = "var(--color-accent)";
      e.currentTarget.style.color = "var(--color-accent-deep)";
    }
  };

  const handleLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (variant === "primary") {
      e.currentTarget.style.background = "var(--color-ink)";
      e.currentTarget.style.borderColor = "var(--color-ink)";
    } else if (variant === "secondary") {
      e.currentTarget.style.borderColor = "var(--color-mist)";
      e.currentTarget.style.color = "var(--color-charcoal)";
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseLeave={handleLeave}
      disabled={disabled}
      style={{ ...base, ...styles[variant] }}
    >
      {children}
    </button>
  );
}
