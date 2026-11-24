import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { z } from "zod";

import { Container } from "@/components/ui/Container";
import { requireUser } from "@/features/auth/session";
import { DeleteButton } from "@/features/reviews/components/DeleteButton";
import { deleteList } from "@/features/lists/actions";
import { ListCoverUploader } from "@/features/lists/components/ListCoverUploader";
import { ListForm } from "@/features/lists/components/ListForm";
import { ListItemsEditor } from "@/features/lists/components/ListItemsEditor";
import { getListById, getListItems } from "@/features/lists/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

type Props = PageProps<"/[locale]/lists/[id]/edit">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Lists" });
  return { title: t("editTitle"), robots: { index: false } };
}

export default async function EditListPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);
  const user = await requireUser(locale, `/${locale}/lists/${id}/edit`);
  const list = z.uuid().safeParse(id).success ? await getListById(id) : null;
  // Only the owner may edit; others get a 404 rather than a hint that it exists.
  if (!list || list.user_id !== user.id) notFound();

  const [t, items, activeLocale] = await Promise.all([
    getTranslations("Lists"),
    getListItems(list.id),
    getLocale(),
  ]);

  return (
    <Container className="py-16 sm:py-24">
      <div className="max-w-3xl">
        <header className="mb-12 flex flex-col gap-6 border-b border-line pb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-4">
            <p className="eyebrow text-moss-bright">{t("editTitle")}</p>
            <h1 className="font-serif text-5xl leading-none sm:text-6xl">{list.title}</h1>
          </div>
          <Link href={`/lists/${list.id}`} className="link-underline text-sm text-paper-muted">
            {t("viewList")}
          </Link>
        </header>

        <div className="flex flex-col gap-16">
          <ListItemsEditor
            listId={list.id}
            items={items.map((item) => ({
              id: item.fragrance.id,
              name: item.fragrance.name,
              brand: item.fragrance.brand.name,
              concentration: item.fragrance.concentration,
            }))}
          />
          <div className="flex flex-col gap-10 border-t border-line pt-10">
            <ListForm
              listId={list.id}
              initial={{
                title: list.title,
                description: list.description ?? "",
                is_public: list.is_public,
                is_ranked: list.is_ranked,
              }}
            />
            <ListCoverUploader listId={list.id} hasCover={Boolean(list.cover_image_url)} />
          </div>
          <div className="border-t border-line pt-8">
            <DeleteButton
              label={t("delete")}
              confirm={t("deleteConfirm")}
              action={deleteList.bind(null, activeLocale, list.id)}
            />
          </div>
        </div>
      </div>
    </Container>
  );
}
