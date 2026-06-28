import { useState, useEffect, useRef } from "react";

interface Props {
  open: boolean;
  title: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export default function NameDialog({
  open,
  title,
  placeholder = "为这个项目取个名字…",
  defaultValue = "未命名项目",
  confirmLabel = "创建",
  onConfirm,
  onCancel,
}: Props) {
  const [name, setName] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(defaultValue);
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter" && name.trim()) {
        onConfirm(name.trim());
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, name, onConfirm, onCancel]);

  if (!open) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.35)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "380px",
          padding: "32px",
          background: "var(--color-paper)",
          borderRadius: "var(--radius-md)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "18px",
            fontWeight: 500,
            color: "var(--color-ink)",
            margin: "0 0 24px",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h2>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%",
            height: "40px",
            padding: "0 12px",
            border: "1px solid var(--color-mist)",
            borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            color: "var(--color-ink)",
            outline: "none",
            background: "var(--color-warm-cream)",
            marginBottom: "24px",
            boxSizing: "border-box",
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
        <div className="flex" style={{ gap: "8px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              height: "36px",
              padding: "0 20px",
              background: "transparent",
              color: "var(--color-charcoal)",
              border: "1px solid var(--color-mist)",
              borderRadius: "var(--radius-none)",
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => name.trim() && onConfirm(name.trim())}
            disabled={!name.trim()}
            style={{
              height: "36px",
              padding: "0 20px",
              background: "var(--color-ink)",
              color: "var(--color-paper)",
              border: "1px solid var(--color-ink)",
              borderRadius: "var(--radius-none)",
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              cursor: name.trim() ? "pointer" : "not-allowed",
              opacity: name.trim() ? 1 : 0.4,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
