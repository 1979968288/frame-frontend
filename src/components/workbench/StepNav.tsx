interface Props {
  steps: string[];
  current: number;
  completed: boolean[];
  onSelect: (i: number) => void;
}

export default function StepNav({ steps, current, completed, onSelect }: Props) {
  return (
    <div
      className="flex items-center"
      style={{
        padding: "0 0 12px",
        borderBottom: "1px solid var(--color-mist)",
        marginBottom: "20px",
        gap: "0",
      }}
    >
      {steps.map((step, i) => {
        const isCurrent = i === current;
        const isDone = completed[i];
        const isLast = i === steps.length - 1;

        return (
          <div
            key={step}
            className="flex items-center"
            style={{ flex: isLast ? "0 0 auto" : "1 1 auto" }}
          >
            <button
              type="button"
              onClick={() => onSelect(i)}
              className="flex items-center cursor-pointer bg-transparent border-none"
              style={{
                gap: "8px",
                transition: "all 200ms var(--ease-out)",
              }}
            >
              {/* Number circle */}
              <span
                className="flex items-center justify-center shrink-0"
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: isCurrent || isDone
                    ? "var(--color-accent)"
                    : "transparent",
                  border: isCurrent || isDone
                    ? "1px solid var(--color-accent)"
                    : "1px solid var(--color-mist)",
                  color: isCurrent || isDone ? "var(--color-paper)" : "var(--color-mid)",
                  fontFamily: "var(--font-body)",
                  fontSize: "11px",
                  fontWeight: 500,
                  fontVariantNumeric: "tabular-nums",
                  transition: "all 200ms var(--ease-out)",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* Text label */}
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  fontWeight: isCurrent ? 500 : 400,
                  color: isCurrent
                    ? "var(--color-accent-deep)"
                    : isDone
                    ? "var(--color-charcoal)"
                    : "var(--color-mid)",
                  letterSpacing: "0.01em",
                  transition: "color 200ms var(--ease-out)",
                }}
              >
                {step}
              </span>
            </button>

            {/* Connecting line */}
            {!isLast && (
              <div
                className="mx-[8px] shrink-0"
                style={{
                  flex: "1 1 auto",
                  height: "1px",
                  background: isDone ? "var(--color-accent)" : "var(--color-mist)",
                  maxWidth: "26px",
                  transition: "background 200ms var(--ease-out)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
