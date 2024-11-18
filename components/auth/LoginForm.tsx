"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLoginMutation } from "@/lib/store/services/ninoxSlice";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/lib/store/features/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  mail: z.string().email(),
  password: z.string().min(4),
});

type FormData = z.infer<typeof schema>;

const defaultValues = process.env.NODE_ENV === 'development' 
  ? {
      mail: 'test@test.de',
      password: '1234'
    } 
  : undefined;

export function LoginForm() {
  const { t } = useTranslation();
  const [login] = useLoginMutation();
  const dispatch = useDispatch();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await login(data).unwrap();
      if (typeof result === 'string') {
        setError(result);
        return;
      }
      dispatch(setCredentials(result));
      localStorage.setItem('auth_token', result.jwt);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Login failed. Please check your credentials.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mail">{t("auth.mail")}</Label>
        <Input
          id="mail"
          type="mail"
          {...register("mail")}
          className={errors.mail ? "border-red-500" : ""}
        />
        {errors.mail && (
          <p className="text-sm text-red-500">{errors.mail.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("auth.password")}</Label>
        <Input
          id="password"
          type="password"
          {...register("password")}
          className={errors.password ? "border-red-500" : ""}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full">
        {t("auth.login")}
      </Button>
    </form>
  );
}