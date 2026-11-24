"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";

import { removeFragranceImage, saveFragranceImage, type ImageAdminResult } from "../actions";

const MAX_EDGE = 1400;

/** Scales the image so its longest edge is at most 1400px (keeps the aspect ratio). */
async function resize(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("encode"))),
      "image/webp",
      0.85,
    ),
  );
}

export function FragranceImageAdmin({
  fragranceId,
  slug,
  imageUrl,
  credit,
}: {
  fragranceId: string;
  slug: string;
  imageUrl: string | null;
  credit: string | null;
}) {
  const t = useTranslations("Admin");
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function report(result: ImageAdminResult) {
    if (result.ok) setMessage({ kind: "ok", text: t("saved") });
    else
      setMessage({
        kind: "error",
        text:
          result.error === "creditRequired"
            ? t("creditRequired")
            : result.error === "forbidden"
              ? t("forbidden")
              : "Error",
      });
  }

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const file = fileRef.current?.files?.[0];
      formData.delete("image");
      if (file) {
        const blob = await resize(file);
        formData.append("image", new File([blob], "image", { type: blob.type }));
      }
      const result = await saveFragranceImage(formData);
      report(result);
      if (result.ok) {
        setFileName(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    });
  }

  return (
    <form
      action={handleSubmit}
      className="mt-4 flex flex-col gap-4 border border-dashed border-moss-bright/50 p-5"
      aria-label={t("title")}
    >
      <div className="flex flex-col gap-1">
        <p className="eyebrow text-moss-bright">{t("title")}</p>
        <p className="text-xs text-paper-faint">{t("hint")}</p>
      </div>
      <input type="hidden" name="fragranceId" value={fragranceId} />
      <input type="hidden" name="slug" value={slug} />

      <label className="flex flex-col gap-2">
        <span className="text-xs text-paper-muted">{imageUrl ? t("replace") : t("choose")}</span>
        <input
          ref={fileRef}
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          className="text-xs text-paper-muted file:mr-3 file:rounded-xs file:border file:border-line-strong file:bg-transparent file:px-3 file:py-2 file:text-paper"
        />
        {fileName ? <span className="text-xs text-paper-faint">{fileName}</span> : null}
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs text-paper-muted">{t("credit")}</span>
        <input
          name="credit"
          defaultValue={credit ?? ""}
          maxLength={200}
          placeholder={t("creditPlaceholder")}
          className="h-10 rounded-xs border border-line-strong bg-ink-sunken px-3 text-sm text-paper focus:border-paper focus:outline-none"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending} className="h-10">
          {pending ? t("uploading") : t("save")}
        </Button>
        {imageUrl ? (
          <Button
            variant="ghost"
            disabled={pending}
            className="h-10"
            onClick={() =>
              startTransition(async () => report(await removeFragranceImage(fragranceId, slug)))
            }
          >
            {t("remove")}
          </Button>
        ) : null}
      </div>

      {message ? (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={message.kind === "error" ? "text-sm text-amber" : "text-sm text-moss-bright"}
        >
          {message.text}
        </p>
      ) : null}
    </form>
  );
}
