/**
 * POST /api/revalidate
 *
 * On-demand ISR cache purge for all public routes.
 * Requires the REVALIDATE_SECRET env var to match the x-revalidate-secret header.
 *
 * Body (JSON, all optional):
 *   { productId: string }  — purge one specific PDP only
 *   {}                     — purge everything (default, used post-deploy)
 *
 * Skipped routes (force-dynamic — always render fresh, revalidatePath is a no-op):
 *   /contact  /checkout  /quiz  /refund  /account/**
 *
 * Use cases:
 *   - Post-deploy CI step: purge every ISR route so new env values take effect
 *   - Supabase DB Webhook on products table: pass { productId } for a single PDP
 *   - Manual curl during incident response
 *
 * Example (full purge):
 *   curl -sS -X POST https://verdebliss.com/api/revalidate \
 *     -H "x-revalidate-secret: <secret>" \
 *     -H "Content-Type: application/json" \
 *     -d '{}'
 *
 * A CDN cache purge alone does NOT fix stale ISR HTML; this endpoint is required.
 */
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getProductsServer } from "@/lib/products-server";

// All ISR / statically-prerendered public page routes.
// force-dynamic routes (/contact /checkout /quiz /refund /account/**) are
// intentionally excluded — they always render fresh.
const STATIC_ROUTES = [
  "/",
  "/products",
  "/certifications",
  "/cookie-policy",
  "/faq",
  "/ingredients",
  "/our-story",
  "/press",
  "/privacy-policy",
  "/returns-refunds",
  "/shipping-policy",
  "/sustainability",
  "/terms",
];

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "REVALIDATE_SECRET is not configured — revalidation is disabled" },
      { status: 500 },
    );
  }
  if (request.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let productId: string | undefined;
  try {
    const body = await request.json();
    if (typeof body?.productId === "string" && body.productId) {
      productId = body.productId;
    }
  } catch {
    // body is optional — no productId means purge everything
  }

  // --- Static / ISR routes ---
  for (const path of STATIC_ROUTES) {
    revalidatePath(path, "page");
  }

  // Blog listing + all /blog/[slug] posts in one call via 'layout' scope,
  // which invalidates the shared layout and every page beneath it.
  revalidatePath("/blog", "layout");

  // --- Product pages ---
  let productSlugs: string[];
  if (productId) {
    productSlugs = [productId];
  } else {
    // Enumerate slugs dynamically so the purge always covers the full
    // catalogue — not a hardcoded list that goes stale as products are added.
    let products;
    try {
      products = await getProductsServer();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { error: `Failed to enumerate products for revalidation: ${message}` },
        { status: 500 },
      );
    }
    productSlugs = products.map((p) => p.slug ?? p.id);
  }

  const failedPaths: string[] = [];
  for (const slug of productSlugs) {
    try {
      revalidatePath(`/products/${slug}`, "page");
    } catch {
      failedPaths.push(`/products/${slug}`);
    }
  }

  if (failedPaths.length > 0) {
    return NextResponse.json(
      { error: "Revalidation failed for one or more product paths", failedPaths },
      { status: 500 },
    );
  }

  const revalidatedPaths = [
    ...STATIC_ROUTES,
    "/blog (layout — includes all /blog/[slug])",
    ...productSlugs.map((s) => `/products/${s}`),
  ];

  return NextResponse.json({
    revalidated: true,
    productId: productId ?? "all",
    paths: revalidatedPaths,
    productCount: productSlugs.length,
    staticCount: STATIC_ROUTES.length + 1, // +1 for /blog layout
  });
}
