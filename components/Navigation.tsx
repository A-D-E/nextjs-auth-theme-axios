"use client";

import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "@store/features/authSlice";
import { ThemeSwitcher } from "@components/ThemeSwitcher";
import { LanguageSwitcher } from "@components/LanguageSwitcher";
import  LogOutButton from "@components/LogOutButton";

export function Navigation() {
  const { t } = useTranslation();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <div className="flex items-center gap-6 flex-1">
          <a className="text-lg font-semibold" href="/">{t("navigation.home")}</a>
        </div>
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          <LanguageSwitcher />
          {isAuthenticated && <LogOutButton />}
        </div>
      </div>
    </nav>
  );
}