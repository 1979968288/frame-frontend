import { useState } from "react";

export default function Navbar() {
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState("中文");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[62px] flex items-center px-[32px] border-b border-[var(--color-mist)]"
      style={{ background: "var(--color-warm-cream)" }}>
      {/* Logo */}
      <a href="/" className="flex items-center gap-[10px] no-underline">
        <img src="/logo.png" alt="Frame" style={{ height: "30px", width: "auto" }} />
        <span
          className="text-[26px] tracking-[-0.5px] leading-none italic font-semibold"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-accent)" }}
        >
          FRAME
        </span>
      </a>

      {/* Right cluster */}
      <div className="flex items-center gap-[32px] ml-auto">
        {/* Language dropdown */}
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-[4px] text-[14px] tracking-[0.03em] cursor-pointer bg-transparent border-none px-0 py-[6px]"
            style={{
              color: "var(--color-charcoal)",
              fontFamily: "var(--font-body)",
            }}>
            {lang}
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {langOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
              <div className="absolute right-0 top-full mt-[4px] z-20 min-w-[120px] py-[4px]"
                style={{
                  background: "var(--color-paper)",
                  border: "1px solid var(--color-mist)",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: "var(--shadow-hover)",
                }}>
                {["中文", "English", "日本語"].map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLang(l);
                      setLangOpen(false);
                    }}
                    className="block w-full text-left px-[16px] py-[8px] text-[14px] cursor-pointer bg-transparent border-none transition-colors duration-150"
                    style={{
                      color: l === lang ? "var(--color-accent)" : "var(--color-charcoal)",
                      fontFamily: "var(--font-body)",
                    }}
                    onMouseEnter={(e) => {
                      if (l !== lang) e.currentTarget.style.background = "var(--color-accent-whisper)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}>
                    {l}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Membership */}
        <a href="/membership" className="text-[14px] tracking-[0.03em] no-underline transition-colors duration-200"
          style={{
            color: "var(--color-charcoal)",
            fontFamily: "var(--font-body)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-accent)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-charcoal)"; }}>
          会员
        </a>

        {/* Profile */}
        <a href="/profile" className="flex items-center justify-center w-[34px] h-[34px] rounded-full transition-colors duration-200"
          style={{ background: "var(--color-mist)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-whisper)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-mist)"; }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-charcoal)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </a>
      </div>
    </header>
  );
}
