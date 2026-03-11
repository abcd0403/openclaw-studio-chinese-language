"use client";

import { useStudioI18n, type StudioLocale } from "@/lib/i18n/studioI18n";

const OPTIONS: Array<{ value: StudioLocale; label: string }> = [
  { value: "en", label: "English" },
  { value: "zh-CN", label: "简体中文" },
];

export const LanguageToggle = () => {
  const { locale, setLocale, t } = useStudioI18n();

  return (
    <label className="ui-btn-icon ui-btn-icon-xs px-1.5" aria-label={t("Switch language")}>
      <span className="sr-only">{t("Language")}</span>
      <select
        className="h-5 min-w-[70px] bg-transparent px-1 text-[10px] font-semibold text-foreground outline-none"
        value={locale}
        onChange={(event) => setLocale(event.target.value as StudioLocale)}
        data-testid="language-toggle"
        aria-label={t("Switch language")}
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {t(option.label)}
          </option>
        ))}
      </select>
    </label>
  );
};
