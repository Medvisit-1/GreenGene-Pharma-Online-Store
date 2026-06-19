/**
 * Import Judge.me reviews (CSV export) into the Review table.
 *
 * Usage:
 *   DATABASE_URL="<railway public postgres url>" \
 *     node scripts/import-judgeme-reviews.mjs "/path/to/judgeme_reviews.csv"
 *
 * If no path is given, it looks for the newest *.csv in ~/Downloads whose name
 * mentions "review" or "judge".
 *
 * Mapping:
 *   - Judge.me `product_handle`  -> our Product.slug   (primary match)
 *   - Judge.me `product_id`/title -> Product.name      (fallback match)
 *   - `published == true`        -> status "approved"
 *   - `curated == spam`          -> status "rejected"
 *   - otherwise                  -> status "pending"   (awaits admin approval)
 *
 * Re-running is safe: a review is skipped if one with the same product +
 * author + body already exists.
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const prisma = new PrismaClient();

/* ----------------------- locate the CSV ----------------------- */
function findCsv() {
  const arg = process.argv[2];
  if (arg) return arg;
  const dl = join(homedir(), "Downloads");
  const candidates = readdirSync(dl)
    .filter((f) => f.toLowerCase().endsWith(".csv"))
    .filter((f) => /review|judge/i.test(f))
    .map((f) => ({ f, t: statSync(join(dl, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  if (!candidates.length) {
    throw new Error(
      "No CSV path given and no review CSV found in ~/Downloads. " +
        "Pass the file path as the first argument."
    );
  }
  return join(dl, candidates[0].f);
}

/* ----------------------- minimal CSV parser ----------------------- */
// Handles quoted fields, escaped quotes (""), and newlines inside quotes.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      // skip fully empty trailing rows
      if (row.some((v) => v !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((v) => v !== "")) rows.push(row);
  }
  return rows;
}

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj[k] != null && String(obj[k]).trim() !== "") return String(obj[k]).trim();
  }
  return "";
}

function statusFor(rec) {
  const curated = pick(rec, "curated").toLowerCase();
  if (curated === "spam") return "rejected";
  const published = pick(rec, "published", "is_published").toLowerCase();
  if (published === "true" || published === "1" || published === "yes") return "approved";
  // No published column at all? Treat as approved (Judge.me exports are live reviews).
  if (published === "") return "approved";
  return "pending";
}

async function main() {
  const path = findCsv();
  console.log(`Reading: ${path}`);
  const rows = parseCsv(readFileSync(path, "utf8"));
  if (rows.length < 2) throw new Error("CSV has no data rows.");

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const records = rows.slice(1).map((r) => {
    const o = {};
    headers.forEach((h, i) => (o[h] = r[i] ?? ""));
    return o;
  });
  console.log(`Parsed ${records.length} rows. Columns: ${headers.join(", ")}`);

  // Build product lookup maps
  const products = await prisma.product.findMany({ select: { id: true, slug: true, name: true } });
  const bySlug = new Map(products.map((p) => [p.slug.toLowerCase(), p.id]));
  const byName = new Map(products.map((p) => [p.name.toLowerCase().trim(), p.id]));
  console.log(`Loaded ${products.length} products for matching.`);

  let imported = 0,
    skipped = 0,
    duplicates = 0;
  const unmatched = new Map(); // handle/title -> count

  for (const rec of records) {
    const handle = pick(rec, "product_handle", "handle").toLowerCase();
    const titleOrName = pick(rec, "product_title", "product_name", "product_type").toLowerCase();
    const productId = bySlug.get(handle) || byName.get(titleOrName);

    const ratingRaw = parseInt(pick(rec, "rating", "score"), 10);
    const body = pick(rec, "body", "review", "content", "comment");
    const author = pick(rec, "reviewer_name", "author", "name", "reviewer") || "Anonymous";

    if (!productId) {
      const key = handle || titleOrName || "(blank)";
      unmatched.set(key, (unmatched.get(key) || 0) + 1);
      skipped++;
      continue;
    }
    if (!ratingRaw || ratingRaw < 1 || ratingRaw > 5 || !body) {
      skipped++;
      continue;
    }

    // Dedupe against existing
    const exists = await prisma.review.findFirst({
      where: { productId, author, body },
      select: { id: true },
    });
    if (exists) {
      duplicates++;
      continue;
    }

    const dateRaw = pick(rec, "review_date", "created_at", "date");
    const created = dateRaw ? new Date(dateRaw) : null;

    await prisma.review.create({
      data: {
        productId,
        author,
        email: pick(rec, "reviewer_email", "email") || null,
        rating: ratingRaw,
        title: pick(rec, "title", "review_title") || null,
        body,
        status: statusFor(rec),
        ...(created && !isNaN(created.getTime()) ? { createdAt: created } : {}),
      },
    });
    imported++;
  }

  console.log("\n========== Import summary ==========");
  console.log(`Imported:   ${imported}`);
  console.log(`Duplicates: ${duplicates} (already present, skipped)`);
  console.log(`Skipped:    ${skipped} (no product match or invalid)`);
  if (unmatched.size) {
    console.log("\nUnmatched products (handle/title -> # reviews):");
    [...unmatched.entries()]
      .sort((a, b) => b[1] - a[1])
      .forEach(([k, n]) => console.log(`   ${k}  ->  ${n}`));
    console.log(
      "\nTip: these handles didn't match any product slug. If they should map," +
        " tell me the correct product and I'll add an alias."
    );
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
