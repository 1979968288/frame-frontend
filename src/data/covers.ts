export interface ScriptCover {
  id: number;
  title: string;
  author: string;
  genre: string;
  coverColor: string;
  accentColor: string;
}

const covers: ScriptCover[] = [
  {
    id: 1,
    title: "深海来信",
    author: "林夕",
    genre: "悬疑 / 剧情",
    coverColor: "#1a1a2e",
    accentColor: "#e8d5b7",
  },
  {
    id: 2,
    title: "长安十二时辰",
    author: "马伯庸",
    genre: "历史 / 古装",
    coverColor: "#2d1b0e",
    accentColor: "#c9a96e",
  },
  {
    id: 3,
    title: "星辰彼岸",
    author: "陈思远",
    genre: "科幻 / 冒险",
    coverColor: "#0d1b2a",
    accentColor: "#a8d8ea",
  },
  {
    id: 4,
    title: "人间失温",
    author: "王安忆",
    genre: "文艺 / 都市",
    coverColor: "#1c1c1c",
    accentColor: "#d4a574",
  },
  {
    id: 5,
    title: "猎罪图鉴",
    author: "张寒寺",
    genre: "犯罪 / 悬疑",
    coverColor: "#1b1b2f",
    accentColor: "#c0392b",
  },
  {
    id: 6,
    title: "春风十里",
    author: "冯唐",
    genre: "青春 / 爱情",
    coverColor: "#1a3a2a",
    accentColor: "#f0d9b5",
  },
  {
    id: 7,
    title: "末日孤城",
    author: "刘慈欣",
    genre: "科幻 / 灾难",
    coverColor: "#0f0f1a",
    accentColor: "#ff6b35",
  },
  {
    id: 8,
    title: "锦绣未央",
    author: "秦简",
    genre: "古装 / 言情",
    coverColor: "#3d1524",
    accentColor: "#e8b4b8",
  },
  {
    id: 9,
    title: "暗涌",
    author: "紫金陈",
    genre: "悬疑 / 推理",
    coverColor: "#1e1e1e",
    accentColor: "#b8860b",
  },
  {
    id: 10,
    title: "白夜追凶",
    author: "指纹",
    genre: "犯罪 / 剧情",
    coverColor: "#121212",
    accentColor: "#e74c3c",
  },
  {
    id: 11,
    title: "山河令",
    author: "Priest",
    genre: "武侠 / 奇幻",
    coverColor: "#1a2a1a",
    accentColor: "#c9b99a",
  },
  {
    id: 12,
    title: "无证之罪",
    author: "紫金陈",
    genre: "悬疑 / 犯罪",
    coverColor: "#1c1c28",
    accentColor: "#cd853f",
  },
];

export default covers;
