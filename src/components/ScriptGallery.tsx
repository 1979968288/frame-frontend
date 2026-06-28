import { useState, useCallback } from "react";
import covers from "../data/covers";
import type { ScriptCover } from "../data/covers";

const LOAD_COUNT = 6;

export default function ScriptGallery() {
  const [visibleCount, setVisibleCount] = useState(LOAD_COUNT);
  const visible = covers.slice(0, visibleCount);
  const hasMore = visibleCount < covers.length;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + LOAD_COUNT, covers.length));
  }, []);

  return (
    <section className="w-full" style={{ maxWidth: "var(--width-max)", margin: "0 auto" }}>
      {/* Section label */}
      <div className="flex items-center justify-between mb-[40px]">
        <div>
          <p
            className="text-[11px] tracking-[0.12em] uppercase m-0"
            style={{
              color: "var(--color-mid)",
              fontFamily: "var(--font-body)",
              fontWeight: 500,
            }}>
            案例作品
          </p>
          <h2
            className="text-[clamp(1.75rem,4vw,2.5rem)] font-normal leading-[1.2] m-0 mt-[8px]"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-ink)",
            }}>
            精选剧本
          </h2>
        </div>
      </div>

      {/* Cover grid — responsive auto-fit, avoids identical card grid */}
      <div className="grid gap-[24px]"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        }}>
        {visible.map((script, i) => (
          <CoverCard key={script.id} script={script} index={i} />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center mt-[48px]">
          <button
            onClick={loadMore}
            className="cursor-pointer transition-all duration-200"
            style={{
              background: "var(--color-ink)",
              color: "var(--color-paper)",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              fontWeight: 500,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              border: "none",
              borderRadius: "var(--radius-none)",
              padding: "14px 40px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-accent)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--color-ink)";
              e.currentTarget.style.transform = "translateY(0)";
            }}>
            加载更多
          </button>
        </div>
      )}
    </section>
  );
}

function CoverCard({ script }: { script: ScriptCover; index: number }) {
  return (
    <div
      className="group relative overflow-hidden cursor-pointer transition-all duration-400"
      style={{
        borderRadius: "var(--radius-md)",
        aspectRatio: "3 / 4",
        background: script.coverColor,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.04)";
        e.currentTarget.style.boxShadow = "var(--shadow-lifted)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "none";
      }}>
      {/* Abstract cover composition */}
      <div className="absolute inset-0 flex flex-col justify-between p-[20px]">
        {/* Top row — geometric accent cluster */}
        <div className="flex gap-[8px]">
          <div className="w-[28px] h-[28px] rounded-full opacity-25"
            style={{ background: script.accentColor }} />
          <div className="w-[12px] h-[12px] rounded-full opacity-15 mt-[6px]"
            style={{ background: script.accentColor }} />
          <div className="w-[48px] h-[2px] opacity-20 mt-[13px]"
            style={{ background: script.accentColor }} />
        </div>

        {/* Middle — spine line + title block */}
        <div className="flex flex-col">
          {/* Hairline spine */}
          <div className="w-full h-[1px] mb-[14px] opacity-20"
            style={{ background: script.accentColor }} />
          <span
            className="text-[8px] tracking-[0.15em] uppercase mb-[4px]"
            style={{
              color: script.accentColor,
              fontFamily: "var(--font-mono)",
              opacity: 0.65,
            }}>
            {script.genre}
          </span>
          <span
            className="text-[clamp(1.05rem,2vw,1.35rem)] font-medium leading-[1.15]"
            style={{
              color: script.accentColor,
              fontFamily: "var(--font-display)",
            }}>
            {script.title}
          </span>
          <span
            className="text-[11px] mt-[6px] opacity-45"
            style={{ color: script.accentColor }}>
            {script.author}
          </span>
        </div>

        {/* Bottom — page-count mimic */}
        <div className="flex gap-[3px] items-end">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="w-[6px] opacity-20"
              style={{
                height: `${4 + i * 2}px`,
                background: script.accentColor,
              }}
            />
          ))}
        </div>
      </div>

      {/* Hover overlay + view button */}
      <div
        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: "rgba(0,0,0,0.45)" }}>
        <span
          className="px-[24px] py-[10px] text-[13px] tracking-[0.05em] transition-all duration-300 group-hover:translate-y-0 translate-y-[6px]"
          style={{
            border: `1px solid ${script.accentColor}`,
            color: script.accentColor,
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            borderRadius: "var(--radius-none)",
          }}>
          查看
        </span>
      </div>
    </div>
  );
}
