"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";

import { Avatar } from "@/components/profile/Avatar";
import { Button } from "@/components/ui/Button";
import type { ErrorCode } from "@/lib/forms";

import { removeAvatar, uploadAvatar } from "../actions";

const OUTPUT_SIZE = 512;

/** Centre-crops the image to a square and resizes it to 512×512 in the browser. */
async function resizeToSquare(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas not supported");
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );
  bitmap.close();

  return new Promise((resolve, reject) =>
    // Browsers without WebP encoding fall back to PNG, which is also accepted.
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Encoding failed"))),
      "image/webp",
      0.86,
    ),
  );
}

export function AvatarUploader({ initialUrl, name }: { initialUrl: string | null; name: string }) {
  const t = useTranslations("Settings");
  const te = useTranslations("Forms.errors");
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [pending, startTransition] = useTransition();

  function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("avatarInvalid");
      return;
    }
    startTransition(async () => {
      try {
        const blob = await resizeToSquare(file);
        const formData = new FormData();
        formData.append("avatar", new File([blob], "avatar", { type: blob.type }));
        const result = await uploadAvatar(formData);
        if (result.ok) setUrl(result.url);
        else setError(result.error);
      } catch {
        setError("avatarInvalid");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removeAvatar();
      if (result.ok) setUrl(null);
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <span className="eyebrow text-paper">{t("avatar")}</span>
      <div className="flex items-center gap-6">
        <Avatar url={url} name={name} size="lg" className={pending ? "opacity-50" : undefined} />
        <div className="flex flex-col items-start gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => inputRef.current?.click()}
            >
              {pending ? t("avatarUploading") : url ? t("avatarChange") : t("avatarChoose")}
            </Button>
            {url ? (
              <Button variant="ghost" disabled={pending} onClick={handleRemove}>
                {t("avatarRemove")}
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-paper-faint">{t("avatarHint")}</p>
          {error ? (
            <p role="alert" className="text-sm text-amber">
              {te(error)}
            </p>
          ) : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-label={t("avatarChoose")}
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
    </div>
  );
}
