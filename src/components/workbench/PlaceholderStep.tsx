import { Button } from "./FormControls";

interface Props {
  step: string;
  index: number;
  description: string;
  points: string[];
  onBack?: () => void;
}

export default function PlaceholderStep({ step, index, description, points, onBack }: Props) {
  return (
    <div style={{ maxWidth: "640px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h2
          className="m-0"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "22px",
            fontWeight: 500,
            color: "var(--color-ink)",
            letterSpacing: "-0.01em",
          }}
        >
          {step}
        </h2>
        <p
          className="m-0"
          style={{
            marginTop: "6px",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            color: "var(--color-mid)",
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
      </div>

      <div
        className="flex flex-col items-center justify-center"
        style={{
          padding: "48px 24px",
          background: "var(--color-paper)",
          border: "1px solid var(--color-mist)",
          borderRadius: "var(--radius-md)",
          textAlign: "center",
        }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "var(--color-accent-whisper)",
            color: "var(--color-accent)",
            marginBottom: "16px",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="13" y2="17" />
          </svg>
        </div>

        <h3
          className="m-0"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "15px",
            fontWeight: 500,
            color: "var(--color-ink)",
            marginBottom: "8px",
          }}
        >
          完成「故事梗概」后开启此步骤
        </h3>

        <p
          className="m-0"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "12px",
            color: "var(--color-mid)",
            lineHeight: 1.6,
            maxWidth: "360px",
          }}
        >
          此模块正在开发中。本步骤将包含：
        </p>

        <ul
          className="m-0 p-0"
          style={{
            listStyle: "none",
            marginTop: "16px",
            fontFamily: "var(--font-body)",
            fontSize: "12px",
            color: "var(--color-charcoal)",
            lineHeight: 1.8,
            textAlign: "left",
          }}
        >
          {points.map((p) => (
            <li
              key={p}
              style={{ paddingLeft: "16px", position: "relative", marginBottom: "4px" }}
            >
              <span style={{ position: "absolute", left: 0, color: "var(--color-accent)" }}>·</span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      <div
        className="flex items-center"
        style={{ marginTop: "24px", gap: "12px" }}
      >
        {onBack && (
          <Button variant="secondary" onClick={onBack}>
            ← 返回上一步
          </Button>
        )}
        <span
          className="ml-auto"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            color: "var(--color-mid)",
            letterSpacing: "0.04em",
          }}
        >
          步骤 {String(index + 1).padStart(2, "0")} / 04
        </span>
      </div>
    </div>
  );
}
