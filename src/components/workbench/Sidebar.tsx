import { useState } from "react";
import type { ModuleKey } from "./Workbench";
import { getProvider, setProvider, getModel, setModel } from "../../lib/api";

interface Props {
  active: ModuleKey;
  onSelect: (m: ModuleKey) => void;
  onExit: () => void;
  apiKey?: string;
  onSetApiKey?: (key: string) => void;
}

interface NavItem {
  key: ModuleKey;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    key: "original",
    label: "剧本原创",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
      </svg>
    ),
  },
  {
    key: "rewrite",
    label: "剧本改写",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
      </svg>
    ),
  },
  {
    key: "adapt",
    label: "网文改编",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    key: "evaluate",
    label: "剧本评估",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
];

const PROVIDER_OPTIONS: { id: string; label: string; defaultModel: string }[] = [
  { id: "deepseek", label: "DeepSeek", defaultModel: "deepseek-chat" },
  { id: "qwen", label: "通义千问", defaultModel: "qwen-plus" },
  { id: "zhipu", label: "智谱 GLM", defaultModel: "glm-4" },
  { id: "moonshot", label: "Moonshot", defaultModel: "moonshot-v1-8k" },
  { id: "siliconflow", label: "硅基流动", defaultModel: "deepseek-ai/DeepSeek-V3" },
  { id: "baichuan", label: "百川", defaultModel: "Baichuan4" },
  { id: "minimax", label: "MiniMax", defaultModel: "abab6.5s-chat" },
  { id: "yi", label: "零一万物", defaultModel: "yi-large" },
  { id: "openai", label: "OpenAI", defaultModel: "gpt-4o" },
  { id: "anthropic", label: "Anthropic Claude", defaultModel: "claude-sonnet-4-20250514" },
  { id: "groq", label: "Groq", defaultModel: "llama-3.1-70b-versatile" },
  { id: "together", label: "Together AI", defaultModel: "meta-llama/Llama-3-70b-chat-hf" },
  { id: "mistral", label: "Mistral AI", defaultModel: "mistral-large-latest" },
  { id: "xai", label: "xAI Grok", defaultModel: "grok-2" },
  { id: "custom", label: "自定义", defaultModel: "" },
];


export default function Sidebar({ active, onSelect, onExit, apiKey, onSetApiKey }: Props) {
  const [hovered, setHovered] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(() => getProvider());
  const [selectedModel, setSelectedModel] = useState(() => getModel());
  const [editingModel, setEditingModel] = useState(false);
  const [modelSettingsOpen, setModelSettingsOpen] = useState(false);
  const expanded = hovered;

  const providerDefaultModel = PROVIDER_OPTIONS.find((p) => p.id === selectedProvider)?.defaultModel || "";
  const activeModel = selectedModel || providerDefaultModel;

  return (
    <div
      style={{
        width: 64,
        height: "100vh",
        position: "relative",
        flexShrink: 0,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <aside
        style={{
          width: expanded ? 240 : 64,
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          background: "var(--color-paper)",
          borderRight: "1px solid var(--color-mist)",
          transition: "width 220ms var(--ease-out)",
          overflow: "hidden",
          zIndex: 20,
          boxShadow: expanded ? "4px 0 24px -8px rgba(0,0,0,0.08)" : "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Brand */}
        <div
          className="flex items-center"
          style={{
            height: "72px",
            paddingLeft: "18px",
            gap: "12px",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onExit}
            aria-label="返回首页"
            className="flex items-center bg-transparent border-none cursor-pointer p-0"
            style={{ color: "var(--color-ink)" }}
          >
            <img src="/logo.png" alt="Frame" style={{ height: "28px", width: "auto" }} />
          </button>
          {expanded && (
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "24px",
                fontWeight: 600,
                fontStyle: "italic",
                color: "var(--color-accent)",
                letterSpacing: "0.02em",
                whiteSpace: "nowrap",
              }}
            >
              Frame
            </span>
          )}
        </div>

        {/* Nav */}
        <nav
          style={{
            paddingTop: "16px",
            paddingLeft: "12px",
            paddingRight: "12px",
            flex: 1,
            overflowY: "auto",
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = item.key === active;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelect(item.key)}
                aria-label={item.label}
                title={item.label}
                className="flex items-center cursor-pointer border-none transition-colors duration-150 w-full"
                style={{
                  height: "44px",
                  padding: expanded ? "0 12px" : "0",
                  justifyContent: expanded ? "flex-start" : "center",
                  gap: "14px",
                  background: isActive ? "var(--color-accent-whisper)" : "transparent",
                  color: isActive ? "var(--color-accent-deep)" : "var(--color-charcoal)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "16px",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  fontWeight: isActive ? 600 : 500,
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "var(--color-accent-whisper)";
                    e.currentTarget.style.color = "var(--color-accent-deep)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--color-charcoal)";
                  }
                }}
              >
                <span className="shrink-0 flex items-center justify-center" style={{ width: "20px", height: "20px" }}>
                  {item.icon}
                </span>
                {expanded && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom: compute + user */}
        <div
          style={{
            borderTop: "1px solid var(--color-mist)",
            padding: expanded ? "16px" : "12px 8px",
            flexShrink: 0,
          }}
        >
          {expanded ? (
            <>
              {/* 模型设置 */}
              <div style={{ marginBottom: "16px" }}>
                <button
                  type="button"
                  onClick={() => setModelSettingsOpen(!modelSettingsOpen)}
                  className="flex items-center justify-between cursor-pointer bg-transparent border-none w-full"
                  style={{ padding: 0, marginBottom: modelSettingsOpen ? "12px" : "0" }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "11px",
                      color: "var(--color-mid)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    模型设置
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      color: apiKey ? "var(--color-accent-deep)" : "var(--color-mid)",
                      transition: "transform 200ms var(--ease-out)",
                    }}
                  >
                    {modelSettingsOpen ? "收起 ▲" : `${PROVIDER_OPTIONS.find((p) => p.id === selectedProvider)?.label || "未选择"} ▸`}
                  </span>
                </button>

                {modelSettingsOpen && (
                  <>
                    {/* 供应商 */}
                    <select
                      value={selectedProvider}
                      onChange={(e) => {
                        const v = e.target.value;
                        setSelectedProvider(v);
                        setProvider(v);
                      }}
                      style={{
                        width: "100%",
                        height: "30px",
                        padding: "0 8px",
                        border: "1px solid var(--color-mist)",
                        borderRadius: "var(--radius-sm)",
                        fontFamily: "var(--font-body)",
                        fontSize: "12px",
                        color: "var(--color-ink)",
                        background: "var(--color-warm-cream)",
                        outline: "none",
                        cursor: "pointer",
                        marginBottom: "8px",
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-mist)"; }}
                    >
                      {PROVIDER_OPTIONS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>

                    {/* 模型 */}
                    <div className="flex items-center justify-between" style={{ marginBottom: editingModel ? "4px" : "8px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "10px",
                          color: selectedModel ? "var(--color-accent-deep)" : "var(--color-mid)",
                        }}
                      >
                        {activeModel || "待选择供应商"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingModel(!editingModel)}
                        className="cursor-pointer bg-transparent border-none"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "10px",
                          color: "var(--color-accent-deep)",
                          letterSpacing: "0.04em",
                          padding: 0,
                        }}
                      >
                        {editingModel ? "默认" : "自定义"}
                      </button>
                    </div>
                    {editingModel && (
                      <input
                        type="text"
                        value={selectedModel}
                        onChange={(e) => {
                          setSelectedModel(e.target.value);
                          setModel(e.target.value);
                        }}
                        placeholder={providerDefaultModel || "输入模型名称"}
                        style={{
                          width: "100%",
                          height: "28px",
                          marginBottom: "8px",
                          padding: "0 8px",
                          border: "1px solid var(--color-mist)",
                          borderRadius: "var(--radius-sm)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          color: "var(--color-ink)",
                          background: "var(--color-warm-cream)",
                          outline: "none",
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-mist)"; }}
                      />
                    )}

                    {/* API Key */}
                    <input
                      type="password"
                      value={apiKey || ""}
                      onChange={(e) => onSetApiKey?.(e.target.value)}
                      placeholder="输入 API Key"
                      style={{
                        width: "100%",
                        height: "28px",
                        padding: "0 8px",
                        border: "1px solid var(--color-mist)",
                        borderRadius: "var(--radius-sm)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        color: "var(--color-ink)",
                        background: "var(--color-warm-cream)",
                        outline: "none",
                        marginBottom: "8px",
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-mist)"; }}
                    />
                    {apiKey && (
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "9px",
                          color: "var(--color-accent-deep)",
                        }}
                      >
                        API Key 已设置
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Compute */}
              <div style={{ marginBottom: "16px" }}>
                <div
                  className="flex items-center justify-between"
                  style={{ marginBottom: "8px" }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "11px",
                      color: "var(--color-mid)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    本月算力
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "11px",
                      color: "var(--color-ink)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    1,240 / 5,000
                  </span>
                </div>
                <div
                  style={{
                    height: "4px",
                    background: "var(--color-mist)",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: "24.8%",
                      height: "100%",
                      background: "var(--color-accent)",
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center" style={{ gap: "10px" }}>
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "var(--color-accent)",
                    color: "var(--color-paper)",
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: "14px",
                  }}
                >
                  L
                </div>
                <div className="flex flex-col" style={{ lineHeight: 1.3, minWidth: 0 }}>
                  <span
                    className="truncate"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "13px",
                      color: "var(--color-ink)",
                      fontWeight: 500,
                    }}
                  >
                    Luna Chen
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "11px",
                      color: "var(--color-mid)",
                    }}
                  >
                    Pro 会员
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div
                className="flex items-center justify-center"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: "2px solid var(--color-accent)",
                  margin: "0 auto 12px",
                    fontFamily: "var(--font-body)",
                    fontSize: "9px",
                    color: "var(--color-accent-deep)",
                    fontWeight: 600,
                }}
                title="本月算力 24.8%"
              >
                24%
              </div>
              <div
                className="flex items-center justify-center"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "var(--color-accent)",
                  color: "var(--color-paper)",
                  margin: "0 auto",
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: "14px",
                }}
                title="Luna Chen"
              >
                L
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
