import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { API } from "../api";

const SettingsContext = createContext({});

export const useSettings = () => useContext(SettingsContext);

const DEFAULTS = {
  shop_name: "Dokan360",
  shop_logo: "",
  shop_address: "",
  shop_phone: "",
  shop_email: "",
  currency_symbol: "৳",
  language: "bn",
  font_size: "medium",
  theme: "light",
  tax_enabled: "false",
  tax_rate: "0",
  tax_label: "VAT",
  receipt_footer: "",
  low_stock_alert: "10",
};

const FONT_SIZE_MAP = {
  small:  "13px",
  medium: "15px",
  large:  "17px",
};

export function SettingsProvider({ children, isLoggedIn }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    API.get("/settings")
      .then(r => setSettings({ ...DEFAULTS, ...r.data }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  useEffect(() => {
    const fontSize = FONT_SIZE_MAP[settings.font_size] || "15px";
    document.documentElement.style.setProperty("--app-font-size", fontSize);
    document.documentElement.setAttribute("data-theme", settings.theme);
    document.documentElement.setAttribute("data-lang", settings.language);
  }, [settings.font_size, settings.theme, settings.language]);

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const get = (key) => settings[key] ?? DEFAULTS[key] ?? "";

  return (
    <SettingsContext.Provider value={{ settings, loading, loadSettings, updateSettings, get }}>
      {children}
    </SettingsContext.Provider>
  );
}
