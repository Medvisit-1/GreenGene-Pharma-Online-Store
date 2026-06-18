import Link from "next/link";
import { Check, X, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Stars } from "@/components/stars";
import { setReviewStatus, deleteReview } from "@/app/admin/actions";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reviews" };

type ReviewWithProduct = Awaited<ReturnType<typeof getReviews>>[number];

async function getReviews() {
  return prisma.review.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: { product: { select: { name: true, slug: true } } },
  });
}

function ReviewCard({ r }: { r: ReviewWithProduct }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Stars rating={r.rating} />
          <p className="mt-1 text-sm">
            <span className="font-semibold">{r.author}</span>
            <span className="text-muted-foreground"> on </span>
            <Link href={`/products/${r.product.slug}`} target="_blank" className="font-medium text-brand-700 hover:underline">
              {r.product.name}
            </Link>
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("en-ZA")}</span>
      </div>
      {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
      <p className="mt-1 text-sm text-foreground/80">{r.body}</p>

      <div className="mt-4 flex items-center gap-2">
        {r.status !== "approved" && (
          <form action={setReviewStatus}>
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="status" value="approved" />
            <button className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">
              <Check className="h-3.5 w-3.5" /> Approve
            </button>
          </form>
        )}
        {r.status !== "rejected" && (
          <form action={setReviewStatus}>
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="status" value="rejected" />
            <button className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted">
              <X className="h-3.5 w-3.5" /> Reject
            </button>
          </form>
        )}
        <form action={deleteReview} className="ml-auto">
          <input type="hidden" name="id" value={r.id} />
          <ConfirmSubmit message="Delete this review?" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </ConfirmSubmit>
        </form>
      </div>
    </div>
  );
}

export default async function AdminReviews() {
  const reviews = await getReviews();
  const pending = reviews.filter((r) => r.status === "pending");
  const others = reviews.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          Pending approval
          {pending.length > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-brand-900">{pending.length}</span>
          )}
        </h2>
        {pending.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Nothing waiting for review. 🎉
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {pending.map((r) => <ReviewCard key={r.id} r={r} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-bold">All reviews</h2>
        {others.length === 0 ? (
          <p className="text-sm text-muted-foreground">No published or rejected reviews yet.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {others.map((r) => (
              <div key={r.id} className="relative">
                <span className={`absolute right-3 top-3 z-10 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${r.status === "approved" ? "bg-brand-100 text-brand-700" : "bg-gray-200 text-gray-600"}`}>
                  {r.status}
                </span>
                <ReviewCard r={r} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
