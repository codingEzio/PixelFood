// Bundled after the food data; no network or module loader is needed.
/* global foods */
const $ = (id) => document.getElementById(id);
const words = {
  en: {
    language: "Language",
    theme: "Theme",
    system: "System",
    light: "Light",
    dark: "Dark",
    search: "Search food",
    category: "Category",
    all: "All food",
    meals: "Meals",
    grains: "Grains & porridge",
    vegetables: "Vegetables",
    protein: "Meat & eggs",
    snacks: "Snacks",
    download: "Download WebP",
    empty: "No matching food",
    count: (n) => `${n} ${n === 1 ? "food image" : "food images"}`,
    license: "AI-generated · Rights review pending",
    thanks: "Culinary Assets · appreciation",
    thanksDetail:
      "A reference we admire. No assets or code from Culinary Assets are used here.",
  },
  "zh-TW": {
    language: "語言",
    theme: "主題",
    system: "系統",
    light: "淺色",
    dark: "深色",
    search: "搜尋食物",
    category: "分類",
    all: "全部食物",
    meals: "餐點",
    grains: "穀物與粥品",
    vegetables: "蔬菜",
    protein: "肉類與蛋",
    snacks: "點心",
    download: "下載 WebP",
    empty: "找不到符合的食物",
    count: (n) => `${n} 張食物素材`,
    license: "AI 生成 · 權利待審查",
    thanks: "Culinary Assets · 致謝",
    thanksDetail: "欣賞與學習的參考；未使用 Culinary Assets 的素材或程式碼。",
  },
  "zh-CN": {
    language: "语言",
    theme: "主题",
    system: "系统",
    light: "浅色",
    dark: "深色",
    search: "搜索食物",
    category: "分类",
    all: "全部食物",
    meals: "餐点",
    grains: "谷物与粥品",
    vegetables: "蔬菜",
    protein: "肉类与蛋",
    snacks: "点心",
    download: "下载 WebP",
    empty: "找不到匹配的食物",
    count: (n) => `${n} 张食物素材`,
    license: "AI 生成 · 权利待审查",
    thanks: "Culinary Assets · 致谢",
    thanksDetail: "欣赏与学习的参考；未使用 Culinary Assets 的素材或代码。",
  },
};
function stored(key, fallback) {
  try {
    return localStorage.getItem(`X-PixelFood:${key}`) || fallback;
  } catch {
    return fallback;
  }
}
function persist(key, value) {
  try {
    localStorage.setItem(`X-PixelFood:${key}`, value);
  } catch { /* File contexts may disable storage. */ }
}
let locale = stored("language", "en");
if (!(locale in words)) locale = "en";
let theme = stored("theme", "system");
if (!["system", "light", "dark"].includes(theme)) theme = "system";
let selected = foods[0].id;
let visible = foods;
function preview() {
  const food = foods.find((f) => f.id === selected);
  $("preview").src = food.data;
  $("preview").alt = food.names[locale];
  $("foodName").textContent = food.names[locale];
  $("meta").textContent = `${food.id} · ${food.width} × ${food.height} · ${
    (food.bytes / 1024).toFixed(1)
  } KiB`;
  $("download").href = food.data;
  $("download").download = `${food.id}.webp`;
  for (const button of $("board").querySelectorAll("button")) {
    button.setAttribute("aria-pressed", String(button.dataset.id === selected));
  }
}
function fit() {
  const board = $("board");
  const cols = Math.max(
    1,
    Math.min(
      visible.length || 1,
      Math.ceil(
        Math.sqrt(
          (visible.length || 1) * board.clientWidth /
            Math.max(1, board.clientHeight),
        ),
      ),
    ),
  );
  board.style.setProperty("--cols", cols);
  board.style.setProperty("--rows", Math.ceil((visible.length || 1) / cols));
}
function render() {
  const w = words[locale];
  const query = $("search").value.trim().toLocaleLowerCase();
  const category = $("category").value;
  visible = foods.filter((f) =>
    (!category || f.category === category) &&
    `${f.id} ${Object.values(f.names).join(" ")}`.toLocaleLowerCase().includes(
      query,
    )
  );
  $("board").replaceChildren();
  for (const food of visible) {
    const button = document.createElement("button");
    button.className = "food";
    button.dataset.id = food.id;
    button.title = food.names[locale];
    const image = document.createElement("img");
    image.src = food.data;
    image.alt = "";
    const label = document.createElement("span");
    label.textContent = food.names[locale];
    button.setAttribute("aria-label", food.names[locale]);
    button.append(image, label);
    button.onclick = () => {
      selected = food.id;
      preview();
    };
    $("board").append(button);
  }
  if (visible.length && !visible.some((f) => f.id === selected)) {
    selected = visible[0].id;
  }
  document.querySelector(".preview").hidden = !visible.length;
  if (!visible.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = w.empty;
    $("board").append(empty);
  }
  $("status").textContent = w.count(visible.length);
  preview();
  fit();
}
function translate() {
  const w = words[locale];
  document.documentElement.lang = locale;
  $("language").value = locale;
  $("languageLabel").textContent = w.language;
  $("themeLabel").textContent = w.theme;
  $("theme").value = theme;
  for (const option of $("theme").options) option.textContent = w[option.value];
  $("search").placeholder = w.search;
  $("search").setAttribute("aria-label", w.search);
  $("category").setAttribute("aria-label", w.category);
  const oldCategory = $("category").value;
  $("category").replaceChildren();
  for (const id of ["", "meals", "grains", "vegetables", "protein", "snacks"]) {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = w[id || "all"];
    $("category").append(option);
  }
  $("category").value = oldCategory;
  $("download").textContent = w.download;
  $("license").textContent = w.license;
  $("thanks").textContent = w.thanks;
  $("thanks").title = w.thanksDetail;
  render();
}
$("language").onchange = () => {
  locale = $("language").value;
  persist("language", locale);
  translate();
};
$("theme").onchange = () => {
  theme = $("theme").value;
  document.documentElement.dataset.theme = theme;
  persist("theme", theme);
};
$("search").oninput = render;
$("category").onchange = render;
document.documentElement.dataset.theme = theme;
translate();
new ResizeObserver(fit).observe($("board"));
