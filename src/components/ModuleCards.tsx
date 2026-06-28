import type { ModuleKey } from "./workbench/Workbench";

interface ModuleCard {
  title: string;
  subtitle: string;
  icon: string;
  module: ModuleKey;
}

interface Props {
  onSelect: (module: ModuleKey) => void;
}

const modules: ModuleCard[] = [
  {
    title: "新建剧本",
    subtitle: "从零开始，AI引导结构化创作",
    icon: "✧",
    module: "original",
  },
  {
    title: "网文改编",
    subtitle: "将网络小说智能转化为专业剧本",
    icon: "↗",
    module: "adapt",
  },
  {
    title: "剧本改写",
    subtitle: "深度优化已有剧本的故事与节奏",
    icon: "↻",
    module: "rewrite",
  },
  {
    title: "剧本评估",
    subtitle: "AI多维度分析剧本质量与市场潜力",
    icon: "◉",
    module: "evaluate",
  },
];

export default function ModuleCards({ onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[24px] w-full">
      {modules.map((mod) => (
        <button
          key={mod.title}
          type="button"
          onClick={() => onSelect(mod.module)}
          className="group relative block text-left no-underline p-[32px] transition-all duration-200 cursor-pointer border-none"
          style={{
            background: "var(--color-paper)",
            borderRadius: "var(--radius-lg)",
            fontFamily: "var(--font-body)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "var(--shadow-hover)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <span
            className="block text-[28px] leading-none mb-[20px] transition-transform duration-200 group-hover:scale-110"
            style={{ color: "var(--color-accent)" }}
          >
            {mod.icon}
          </span>

          <h3
            className="text-[18px] font-medium mb-[8px] tracking-[-0.2px] m-0"
            style={{
              color: "var(--color-ink)",
              fontFamily: "var(--font-display)",
            }}
          >
            {mod.title}
          </h3>

          <p
            className="text-[14px] leading-[1.6] m-0"
            style={{ color: "var(--color-mid)" }}
          >
            {mod.subtitle}
          </p>

          <div
            className="absolute bottom-0 left-[32px] right-[32px] h-[2px] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"
            style={{ background: "var(--color-accent)" }}
          />
        </button>
      ))}
    </div>
  );
}
