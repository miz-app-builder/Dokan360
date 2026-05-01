import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { API } from "../api";

const SettingsContext = createContext({});

export const useSettings = () => useContext(SettingsContext);

// ── Global defaults (server-side fallback) ────────────────
const GLOBAL_DEFAULTS = {
  shop_name:       "Dokan360",
  shop_logo:       "",
  shop_address:    "",
  shop_phone:      "",
  shop_email:      "",
  currency_symbol: "৳",
  tax_enabled:     "false",
  tax_rate:        "0",
  tax_label:       "VAT",
  receipt_footer:  "",
  low_stock_alert: "10",
};

// ── Per-user display defaults ────────────────────────────
const DISPLAY_DEFAULTS = {
  language:  "bn",
  font_size: "medium",
  theme:     "light",
};

const FONT_SIZE_MAP = {
  small:  "13px",
  medium: "15px",
  large:  "17px",
};

// ── Helpers: localStorage per-user display prefs ──────────
const displayKey = (userId) => `dokan360_display_${userId}`;

function getCurrentUserId() {
  try {
    const u = JSON.parse(localStorage.getItem("dokan360_user"));
    return u?.id || null;
  } catch { return null; }
}

function loadDisplayPrefs(userId) {
  if (!userId) return {};
  try {
    const raw = localStorage.getItem(displayKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function saveDisplayPrefs(userId, prefs) {
  if (!userId) return;
  try {
    const existing = loadDisplayPrefs(userId);
    localStorage.setItem(displayKey(userId), JSON.stringify({ ...existing, ...prefs }));
  } catch {}
}

// ── Provider ───────────────────────────────────────────────
export function SettingsProvider({ children, isLoggedIn }) {
  const [globalSettings, setGlobalSettings] = useState(GLOBAL_DEFAULTS);
  const [displayPrefs,   setDisplayPrefs]   = useState(DISPLAY_DEFAULTS);
  const [loading,        setLoading]        = useState(true);

  // Merged view: global + user display prefs (user overrides global display)
  const settings = {
    ...GLOBAL_DEFAULTS,
    ...DISPLAY_DEFAULTS,
    ...globalSettings,
    ...displayPrefs,
  };

  // ── Load global settings from server ────────────────────
  const loadSettings = useCallback(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    API.get("/settings")
      .then(r => setGlobalSettings({ ...GLOBAL_DEFAULTS, ...r.data }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  // ── Load current user's display prefs from localStorage ─
  const loadUserDisplay = useCallback(() => {
    const userId = getCurrentUserId();
    if (!userId) { setDisplayPrefs(DISPLAY_DEFAULTS); return; }
    const saved = loadDisplayPrefs(userId);
    setDisplayPrefs({ ...DISPLAY_DEFAULTS, ...saved });
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);
  useEffect(() => { loadUserDisplay(); }, [loadUserDisplay]);

  // Re-load display prefs when login state changes (user switches)
  useEffect(() => {
    if (isLoggedIn) loadUserDisplay();
    else setDisplayPrefs(DISPLAY_DEFAULTS);
  }, [isLoggedIn, loadUserDisplay]);

  // ── Apply theme / font / lang to DOM ────────────────────
  useEffect(() => {
    const fontSize = FONT_SIZE_MAP[settings.font_size] || "15px";
    document.documentElement.style.setProperty("--app-font-size", fontSize);
    document.documentElement.setAttribute("data-theme",  settings.theme);
    document.documentElement.setAttribute("data-lang",   settings.language);
  }, [settings.font_size, settings.theme, settings.language]);

  // ── Update global settings in state (after server save) ─
  const updateSettings = (newSettings) => {
    setGlobalSettings(prev => ({ ...prev, ...newSettings }));
  };

  // ── Save + apply current user's display prefs ────────────
  const updateDisplayPrefs = (prefs) => {
    const userId = getCurrentUserId();
    if (userId) saveDisplayPrefs(userId, prefs);
    setDisplayPrefs(prev => ({ ...prev, ...prefs }));
  };

  const get = (key) => settings[key] ?? GLOBAL_DEFAULTS[key] ?? DISPLAY_DEFAULTS[key] ?? "";

  return (
    <SettingsContext.Provider value={{
      settings,
      loading,
      loadSettings,
      updateSettings,
      updateDisplayPrefs,
      loadUserDisplay,
      get,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}
