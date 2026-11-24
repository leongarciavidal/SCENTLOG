"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRef } from "react";

import { buttonClasses } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { localized } from "@/lib/localized";

import { CONCENTRATIONS, SORT_OPTIONS, type CatalogueParams } from "../search-params";

type Options = {
  families: { slug: string; name_en: string; name_es: string }[];
  brands: { slug: string; name: string }[];
};

const CONTROL =
  "h-11 w-full rounded-xs border border-line-strong bg-ink-sunken px-3 text-sm text-paper transition-colors hover:border-paper-faint focus:border-paper focus:outline-none";

/**
 * A plain GET form: every filter combination has its own shareable URL and the
 * page works without JavaScript. With JavaScript, changing a select submits
 * the form immediately.
 */
export function CatalogueFilters({
  params,
  options,
}: {
  params: CatalogueParams;
  options: Options;
}) {
  const t = useTranslations("Catalogue");
  const tc = useTranslations("Fragrance.concentration");
  const locale = useLocale();
  const formRef = useRef<HTMLFormElement>(null);
  const submit = () => formRef.current?.requestSubmit();
  const hasFilters = Boolean(
    params.q || params.family || params.brand || params.concentration || params.note,
  );

  return (
    <form ref={formRef} method="get" role="search" className="flex flex-col gap-4">
      {params.note ? <input type="hidden" name="note" value={params.note} /> : null}

      <div className="flex gap-3">
        <label className="sr-only" htmlFor="catalogue-q">
          {t("searchLabel")}
        </label>
        <input
          id="catalogue-q"
          type="search"
          name="q"
          defaultValue={params.q}
          placeholder={t("searchPlaceholder")}
          maxLength={100}
          autoComplete="off"
          className={`${CONTROL} h-12 flex-1 px-4 text-base`}
        />
        <button type="submit" className={buttonClasses("primary", "h-12")}>
          {t("search")}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Select label={t("family")} name="family" value={params.family} onChange={submit}>
          <option value="">{t("allFamilies")}</option>
          {options.families.map((family) => (
            <option key={family.slug} value={family.slug}>
              {localized(family, "name", locale)}
            </option>
          ))}
        </Select>
        <Select
          label={t("concentration")}
          name="concentration"
          value={params.concentration}
          onChange={submit}
        >
          <option value="">{t("allConcentrations")}</option>
          {CONCENTRATIONS.map((code) => (
            <option key={code} value={code}>
              {tc(code)}
            </option>
          ))}
        </Select>
        <Select label={t("brand")} name="brand" value={params.brand} onChange={submit}>
          <option value="">{t("allBrands")}</option>
          {options.brands.map((brand) => (
            <option key={brand.slug} value={brand.slug}>
              {brand.name}
            </option>
          ))}
        </Select>
        <Select label={t("sort")} name="sort" value={params.sort} onChange={submit}>
          {SORT_OPTIONS.map((sort) => (
            <option key={sort} value={sort}>
              {t(`sorts.${sort}`)}
            </option>
          ))}
        </Select>
      </div>

      {hasFilters ? (
        <Link href="/fragrances" className="link-underline self-start text-xs text-paper-muted">
          {t("clear")}
        </Link>
      ) : null}
    </form>
  );
}

function Select({
  label,
  name,
  value,
  onChange,
  children,
}: {
  label: string;
  name: string;
  value?: string;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.625rem] tracking-[0.2em] text-paper-faint uppercase">{label}</span>
      <select name={name} defaultValue={value ?? ""} onChange={onChange} className={CONTROL}>
        {children}
      </select>
    </label>
  );
}
