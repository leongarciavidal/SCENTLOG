import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { z } from "zod";

import { Avatar } from "@/components/profile/Avatar";
import { Container } from "@/components/ui/Container";
import { getCurrentUser } from "@/features/auth/session";
import { deleteComment } from "@/features/reviews/actions";
import { CommentForm } from "@/features/reviews/components/CommentForm";
import { DeleteButton } from "@/features/reviews/components/DeleteButton";
import { ReviewCard } from "@/features/reviews/components/ReviewCard";
import { getLikedReviewIds, getReviewById, getReviewComments } from "@/features/reviews/queries";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

type Props = PageProps<"/[locale]/reviews/[id]">;

async function load(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  return getReviewById(id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const review = await load(id);
  if (!review) return {};
  const t = await getTranslations({ locale: locale as Locale, namespace: "Reviews" });
  return {
    title: t("metaTitle", {
      name: review.author.display_name || review.author.username,
      fragrance: review.fragrance.name,
    }),
    description: review.body.slice(0, 160),
  };
}

export default async function ReviewPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);

  const review = await load(id);
  if (!review) notFound();

  const [t, format, viewer, comments] = await Promise.all([
    getTranslations("Reviews"),
    getFormatter(),
    getCurrentUser(),
    getReviewComments(review.id),
  ]);
  const liked = await getLikedReviewIds(viewer?.id, [review.id]);

  return (
    <Container className="py-16 sm:py-20">
      <div className="max-w-3xl">
        <Link href={`/fragrances/${review.fragrance.slug}`} className="eyebrow hover:text-paper">
          ← {review.fragrance.brand.name} · {review.fragrance.name}
        </Link>
        <h1 className="mt-6 font-serif text-5xl leading-none sm:text-6xl">
          {t("by", { name: review.author.display_name || review.author.username })}
        </h1>

        <ReviewCard
          review={review}
          liked={liked.has(review.id)}
          viewerId={viewer?.id ?? null}
          showFragrance
          full
        />

        <section
          aria-labelledby="comments"
          className="mt-6 flex flex-col gap-8 border-t border-line pt-10"
        >
          <h2 id="comments" className="font-serif text-3xl">
            {t("commentsTitle")}
          </h2>
          {comments.length === 0 ? (
            <p className="text-sm text-paper-faint">{t("noComments")}</p>
          ) : (
            <ol className="flex flex-col divide-y divide-line">
              {comments.map((comment) => {
                const name = comment.author.display_name || comment.author.username;
                return (
                  <li key={comment.id} className="flex gap-4 py-6">
                    <Link href={`/${comment.author.username}`} className="shrink-0">
                      <Avatar url={comment.author.avatar_url} name={name} size="sm" />
                    </Link>
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Link
                          href={`/${comment.author.username}`}
                          className="text-sm text-paper hover:text-paper-muted"
                        >
                          {name}
                        </Link>
                        <time dateTime={comment.created_at} className="text-xs text-paper-faint">
                          {format.relativeTime(new Date(comment.created_at))}
                        </time>
                        {viewer?.id === comment.user_id ? (
                          <DeleteButton
                            label={t("deleteComment")}
                            confirm={t("deleteComment") + "?"}
                            action={deleteComment.bind(null, comment.id)}
                          />
                        ) : null}
                      </div>
                      <p className="leading-relaxed whitespace-pre-line text-paper-muted">
                        {comment.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          {viewer ? (
            <CommentForm reviewId={review.id} />
          ) : (
            <Link
              href={`/login?next=${encodeURIComponent(`/${locale}/reviews/${review.id}`)}`}
              className="link-underline self-start text-sm text-paper"
            >
              {t("commentSignIn")}
            </Link>
          )}
        </section>
      </div>
    </Container>
  );
}
