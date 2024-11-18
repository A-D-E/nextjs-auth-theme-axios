import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { logout } from "@/lib/store/features/authSlice";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <Button 
      onClick={handleLogout} 
      variant="ghost" 
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      <span>{t("auth.logout")}</span>
    </Button>
  );
}