"use client";

import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "@/lib/store/features/authSlice";
import { LoginForm } from "@components/auth/LoginForm";

export function HomePage() {
  const { t } = useTranslation();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <div className="container mx-auto px-4 py-8">
      {!isAuthenticated ? (
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-6">{t("auth.login")}</h2>
          <LoginForm />
        </div>
      ) : (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            {t("navigation.home")}
          </h2>
          <p className="text-muted-foreground">
            { t("auth.loginSuccess")}
          </p>
        </div>
      )}
    </div>
  );
}