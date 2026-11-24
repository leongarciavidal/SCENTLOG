"use client";

import { useTranslations } from "next-intl";
import { useRef, useTransition } from "react";

import { Button } from "@/components/ui/Button";

import { removeListCover, uploadListCover } from "../actions";

const MAX_EDGE = 1600;

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
      0.84,
    ),
  );
}

export function ListCoverUploader({ listId, hasCover }: { listId: string; hasCover: boolean }) {
  const t = useTranslations("Lists");
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <span className="eyebrow text-paper">{t("cover")}</span>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" disabled={pending} onClick={() => inputRef.current?.click()}>
          {pending ? t("uploading") : hasCover ? t("coverChange") : t("coverUpload")}
        </Button>
        {hasCover ? (
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => startTransition(async () => void (await removeListCover(listId)))}
          >
            {t("coverRemove")}
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-paper-faint">{t("coverHint")}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-label={t("coverUpload")}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          startTransition(async () => {
            const blob = await resize(file);
            const data = new FormData();
            data.append("cover", new File([blob], "cover", { type: blob.type }));
            await uploadListCover(listId, data);
            if (inputRef.current) inputRef.current.value = "";
          });
        }}
      />
    </div>
  );
}
