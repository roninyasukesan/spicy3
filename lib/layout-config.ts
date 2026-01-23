
export interface SectionConfig {
  id: string;
  componentKey: string;
  label: string;
  isVisible: boolean;
  order: number;
}

export const DEFAULT_LAYOUT: SectionConfig[] = [
  { id: "hero", componentKey: "hero", label: "Hero Banner", isVisible: true, order: 0 },
  { id: "shortcuts", componentKey: "shortcuts", label: "Atalhos Rápidos", isVisible: true, order: 1 },
  { id: "advantages", componentKey: "advantages", label: "Vantagens", isVisible: true, order: 2 },
  { id: "featured", componentKey: "featured", label: "Modelos em Destaque", isVisible: true, order: 3 },
  { id: "plans", componentKey: "plans", label: "Planos e Assinaturas", isVisible: true, order: 4 },
];

const LAYOUT_STORAGE_KEY = "spicy_home_layout";

export function getLayout(): SectionConfig[] {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;
  
  try {
    const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate/Merge with default to ensure no breaking changes if schema updates
      // (Simple implementation for now)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load layout config", e);
  }
  
  return DEFAULT_LAYOUT;
}

export function saveLayout(layout: SectionConfig[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  window.dispatchEvent(new Event("layout-change"));
}

export function resetLayout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LAYOUT_STORAGE_KEY);
  window.dispatchEvent(new Event("layout-change"));
}
