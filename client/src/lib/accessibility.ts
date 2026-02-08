export type AccessibilitySettings = {
  fontScale: number; // 1.0 - 1.4
  highContrast: boolean;
  reduceMotion: boolean;
  strongFocus: boolean;
  statusDisplay: "text" | "color";
  iconLabels: boolean;
};

const STORAGE_KEY = "astba_accessibility";

export const defaultAccessibility: AccessibilitySettings = {
  fontScale: 1.0,
  highContrast: false,
  reduceMotion: false,
  strongFocus: true,
  statusDisplay: "color",
  iconLabels: true,
};

export function loadAccessibility(): AccessibilitySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAccessibility;
    const parsed = JSON.parse(raw) as Partial<AccessibilitySettings> & {
      showStatusColor?: boolean;
    };
    const statusDisplay =
      parsed.statusDisplay ??
      (typeof parsed.showStatusColor === "boolean"
        ? parsed.showStatusColor
          ? "color"
          : "text"
        : defaultAccessibility.statusDisplay);
    return {
      ...defaultAccessibility,
      ...parsed,
      statusDisplay,
    };
  } catch {
    return defaultAccessibility;
  }
}

export function saveAccessibility(settings: AccessibilitySettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function applyAccessibility(settings: AccessibilitySettings) {
  const root = document.documentElement;
  root.style.setProperty("--astba-font-scale", String(settings.fontScale));
  root.toggleAttribute("data-high-contrast", settings.highContrast);
  root.toggleAttribute("data-reduce-motion", settings.reduceMotion);
  root.toggleAttribute("data-strong-focus", settings.strongFocus);
  root.setAttribute("data-status-display", settings.statusDisplay);
  root.setAttribute("data-a11y-labels", settings.iconLabels ? "on" : "off");
}
