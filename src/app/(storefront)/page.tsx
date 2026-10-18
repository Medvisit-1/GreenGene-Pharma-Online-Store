/* eslint-disable @next/next/no-img-element -- product images are remote PNGs on the store CDN */
import Link from "next/link";
import { Search } from "lucide-react";
import type { Product } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSettings, getShippingConfig } from "@/lib/settings";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { rewardHighlights, shortDiscount, type RewardHighlights } from "@/lib/rewards";
import {
  bestOffer, directions, featuredArticle, firstImage, goalLabel, greeting, lastPaidOrder, nextRefill,
  productTitle, rewardStatus, shortPrice, timeOfDay, type LastOrder, type RewardStatus,
} from "@/lib/home";
import { formatPrice, reorderHref } from "@/lib/utils";
import { parseNewReleaseCards } from "@/lib/new-release";
import { NewReleaseCarousel } from "@/components/new-release-carousel";
import { WishlistButton } from "@/components/wishlist-button";
import { GIcon, GiftBox, Petals, Sprig, type GIconName } from "@/components/garden/art";
import { HomeSlider, type Slide } from "@/components/garden/home-slider";
import { AddPlus, RoutineCheck } from "@/components/garden/home-bits";

export const dynamic = "force-dynamic";

const TINTS = ["var(--g-blush)", "var(--g-sage)", "#f3eadf", "var(--g-lilac)"];

function goalIcon(slug: string): GIconName {
  if (/mind|mood|stress|sleep/.test(slug)) return "leaf";
  if (/men|energy|perform/.test(slug) && !/women/.test(slug)) return "bolt";
  if (/women|hormone|fertil/.test(slug)) return "flower";
  if (/skin|beauty/.test(slug)) return "drop";
  return "spark";
}

export default async function HomePage() {
  const customer = await getCurrentCustomer();
  const [s, shipping, categories, popular, rewards, status, order, offer, article] = await Promise.all([
    getSettings(),
    getShippingConfig(),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
    rewardHighlights(),
    customer ? rewardStatus(customer) : null,
    customer ? lastPaidOrder(customer) : null,
    bestOffer(),
    featuredArticle().catch(() => null),
  ]);
    const firstName = customer?.name?.trim().split(/\s+/)[0];
  const defaultDays = Math.max(7, parseInt(s.refillDefaultDays, 10) || 30);
  const newReleaseCards = parseNewReleaseCards(s.newReleaseCards);

  // ----- "For you this week" slides -----
  const slides: Slide[] = [];
  if (rewards && s.homeSlideRewards !== "0") slides.push({ key: "rewards", className: "gg-s1", label: "GreenGene Rewards", content: <RewardsSlide rewards={rewards} signedIn={!!customer} photo={s.homeRewardsPhoto || "/img/rewards-photo.webp"} /> });
  if (offer && s.homeSlideOffer !== "0") {
    const t = productTitle(offer.name);
    const img = firstImage(offer);
    slides.push({
      key: "offer",
      className: "gg-s2",
      label: `${t.name} offer`,
      content: (
        <>
          <div className="t">
            <div className="gg-caps" style={{ color: "var(--g-gold)" }}>Limited offer</div>
            <h3>{t.name}<br />now {shortPrice(offer.price)}</h3>
            <p>{t.tagline ? `${t.tagline}. ` : ""}Was <s>{shortPrice(offer.compareAtPrice!)}</s>.</p>
            <Link href={`/products/${offer.slug}`} className="gg-btn" style={{ background: "var(--g-gold)", color: "var(--g-forest)", marginTop: 20 }}>
              Shop the offer
            </Link>
          </div>
          <div className="gg-vis gg-bob">{img && <img src={img} alt={t.name} />}</div>
          <Sprig kind="green" className="gg-hide-m" style={{ right: -10, top: -20, width: 170, transform: "rotate(160deg)" }} />
        </>
      ),
    });
  }
  if (article && s.homeSlideArticle !== "0") {
    const img = article.product ? firstImage(article.product) : null;
    slides.push({
      key: "article",
      className: "gg-s3",
      label: article.article.title,
      content: (
        <>
          <div className="t">
            <div className="gg-caps" style={{ color: "var(--g-plum3)" }}>Wellness Notes</div>
            <h3>{article.article.title}</h3>
            <p className="line-clamp-3">{article.article.excerpt}</p>
            <Link href={`/wellness/${article.article.slug}`} className="gg-btn" style={{ background: "var(--g-plum)", color: "#fff", marginTop: 18 }}>
              Read the article
            </Link>
          </div>
          <div className="gg-vis gg-bob d1">{img && <img src={img} alt={productTitle(article.product!.name).name} />}</div>
        </>
      ),
    });
  }

  return (
    <div className="gg-wrap">
      {/* Row 1: greeting + rewards */}
      <div className="gg-top">
        <section className="gg-hello">
          <Petals colors={["var(--g-plum3)", "var(--g-plum-soft)", "var(--g-plum-pale)"]} leaf="var(--g-leaf)" count={14} height={460} />
          <Sprig kind="green" style={{ right: -34, top: -44, width: 150, transform: "rotate(180deg) scaleX(-1)" }} />
          <Sprig kind="plum" className="gg-hide-m" style={{ right: 40, bottom: -30, width: 150, transform: "rotate(-10deg)" }} />
          <div className="gg-caps">{greeting()}</div>
          <h1>{customer ? `Welcome back${firstName ? `, ${firstName}` : ""}` : "Welcome to GreenGene"}</h1>
          <div className="gg-script"><span className="gg-write">{s.homeTagline}</span></div>
          <form action="/products" className="gg-search" role="search">
            <Search className="h-5 w-5 shrink-0" />
            <input name="q" type="search" placeholder="Search products, ingredients or goals…" aria-label="Search products" />
          </form>
          <nav className="gg-goals" aria-label="Shop by goal">
            {categories.map((c) => (
              <Link key={c.id} href={`/products?category=${c.slug}`} className="gg-goal">
                <span className="ic"><GIcon name={goalIcon(c.slug)} size={24} /></span>
                {goalLabel(c.name)}
              </Link>
            ))}
            <Link href="/products" className="gg-goal">
              <span className="ic"><GIcon name="spark" size={24} /></span>
              Shop all
            </Link>
          </nav>
        </section>

        {rewards ? (
          <RewardsCard rewards={rewards} status={status} signedIn={!!customer} />
        ) : (
          <DeliveryCard flat={shipping.flat} threshold={shipping.threshold} />
        )}
      </div>

      {/* Banner slider */}
      {slides.length > 0 && (
        <>
          <div className="gg-sh"><h2>{s.homeSlidesHeading || "For you this week"}</h2><Link href="/promotions">All offers →</Link></div>
          <HomeSlider slides={slides} />
        </>
      )}

      {/* Journey band */}
      {rewards && s.homeShowJourney !== "0" && <Journey signedIn={!!customer} />}

      {/* Routine + refill */}
      {s.homeShowRoutine !== "0" && (
        <div className="gg-two">
          <Routine order={order} fallback={popular} signedIn={!!customer} />
          <RefillCard order={order} defaultDays={defaultDays} signedIn={!!customer} fallback={popular[1] ?? popular[0]} />
        </div>
      )}

      {/* Popular */}
      {s.homeShowPopular !== "0" && (
        <>
          <div className="gg-sh"><h2>{s.homePopularHeading || "Popular right now"}</h2><Link href="/products">Shop all →</Link></div>
          <div className="gg-grid">
            {popular.map((p, i) => <Tile key={p.id} product={p} index={i} />)}
          </div>
        </>
      )}

      {s.newReleaseEnabled === "1" && newReleaseCards.length > 0 && (
        <div className="mt-6">
          <NewReleaseCarousel heading={s.newReleaseHeading || "New Release"} cards={newReleaseCards} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function RewardsCard({ rewards, status, signedIn }: { rewards: RewardHighlights; status: RewardStatus | null; signedIn: boolean }) {
  const { welcome, referral, milestones } = rewards;
  const firstMilestone = milestones[0];

  let heading = "Join today. Start saving.";
  let ring = { done: 0, big: welcome ? shortDiscount(welcome) : "Free", small: welcome ? "WELCOME" : "TO JOIN" };
  if (signedIn && status) {
    const next = status.next;
    if (status.ready > 0) heading = `You have ${status.ready} reward${status.ready === 1 ? "" : "s"} ready to claim`;
    else if (next) {
      const left = next.target - next.current;
      heading = `${left === 1 ? "One more order" : `${left} more orders`} to your next reward`;
    } else heading = "Thank you for being a GreenGene regular";
    ring = next
      ? { done: next.current / next.target, big: `${next.current}/${next.target}`, small: "ORDERS" }
      : { done: 1, big: String(status.paidOrders), small: status.paidOrders === 1 ? "ORDER" : "ORDERS" };
  } else {
    ring.done = 1;
  }

  const nextMilestone = status?.next
    ? milestones.find((m) => m.threshold === status.next!.target) ?? firstMilestone
    : firstMilestone;

  return (
    <section className="gg-rewards" aria-label="GreenGene Rewards">
      <GiftBox />
      <div className="gg-caps">GreenGene Rewards</div>
      <h2>{heading}</h2>
      <div className="row">
        <div className="gg-ring" aria-hidden>
          <svg width="124" height="124" viewBox="0 0 124 124">
            <circle cx="62" cy="62" r="54" stroke="rgba(255,255,255,.14)" strokeWidth="10" fill="none" />
            <circle className="prog" cx="62" cy="62" r="54" stroke="#e3bd78" strokeWidth="10" fill="none" strokeLinecap="round"
              style={{ "--to": Math.round(339 * (1 - Math.min(1, Math.max(0, ring.done)))) } as React.CSSProperties} />
          </svg>
          <b>{ring.big}<small>{ring.small}</small></b>
        </div>
        <ul>
          {welcome && (
            <li>
              <span className="gg-circ"><GIcon name="mail" /></span>
              <span>
                <b>{shortDiscount(welcome)}</b>{" "}
                {status?.welcome === "available" ? "welcome gift — ready" : status?.welcome === "claimed" ? "welcome gift — claimed" : "off for joining our newsletter"}
              </span>
            </li>
          )}
          {referral && (
            <li><span className="gg-circ"><GIcon name="people" /></span><span><b>{shortDiscount(referral)}</b> for every friend you refer</span></li>
          )}
          {nextMilestone && (
            <li><span className="gg-circ"><GIcon name="star" /></span><span><b>{shortDiscount(nextMilestone)}</b> off at order {nextMilestone.threshold}</span></li>
          )}
        </ul>
      </div>
      <Link href={signedIn ? "/account?tab=rewards" : "/account?next=%2Faccount%3Ftab%3Drewards"} className="gg-btn">
        {signedIn ? "View my rewards →" : "Join free →"}
      </Link>
      <div className="tc"><Link href="/rewards-terms">T&amp;Cs apply</Link>.</div>
    </section>
  );
}

function DeliveryCard({ flat, threshold }: { flat: number; threshold: number }) {
  return (
    <section className="gg-rewards" aria-label="Delivery">
      <GiftBox />
      <div className="gg-caps">Delivered to your door</div>
      <h2>Natural wellness, across South Africa</h2>
      <ul className="mt-5">
        <li><span className="gg-circ"><GIcon name="bag" /></span><span>{threshold > 0 ? <>Free delivery on orders over <b>{shortPrice(threshold)}</b></> : <>Delivery from <b>{shortPrice(flat)}</b></>}</span></li>
        <li><span className="gg-circ"><GIcon name="leaf" /></span><span>Natural formulas, fully listed ingredients</span></li>
        <li><span className="gg-circ"><GIcon name="mail" /></span><span>Wellness Notes in your inbox</span></li>
      </ul>
      <Link href="/products" className="gg-btn">Shop now →</Link>
    </section>
  );
}

function RewardsSlide({ rewards, signedIn, photo }: { rewards: RewardHighlights; signedIn: boolean; photo: string }) {
  const { welcome, referral, milestones } = rewards;
  const amount = (r: NonNullable<RewardHighlights["welcome"]>) =>
    r.discountType === "fixed" && r.discountValue % 100 === 0
      ? <span data-count={r.discountValue / 100} data-prefix="R">{shortDiscount(r)}</span>
      : shortDiscount(r);
  return (
    <>
      <div className="t">
        <div className="small">GREEN GENE</div>
        <h3>REWARDS</h3>
        <div className="sub">YOUR PATH TO HEALTHY SAVINGS</div>
        <div className="rule" />
        <div className="gg-script join"><span className="gg-write">Join today.<br />Start saving.</span></div>
      </div>
      <ul className="gg-perks">
        {welcome && (
          <li><span className="gg-circ"><GIcon name="mail" size={20} /></span><span><b>Get {amount(welcome)} off*</b><br />Just for joining our newsletter</span></li>
        )}
        {referral && (
          <li><span className="gg-circ"><GIcon name="people" size={20} /></span><span><b>Refer a friend</b><br />Get {amount(referral)} off for every friend</span></li>
        )}
        {milestones.length > 0 && (
          <li><span className="gg-circ"><GIcon name="star" size={20} /></span><span><b>Milestone rewards</b><br />Unlock bigger bonuses as you go</span></li>
        )}
        <li>
          <span className="gg-circ"><GIcon name="ticket" size={20} /></span>
          <span><b><Link href={signedIn ? "/account?tab=rewards" : "/account"}>{signedIn ? "See your rewards →" : "Join free →"}</Link></b><br />Birthday treats &amp; review rewards too</span>
        </li>
      </ul>
      <div className="photo">
        <img src={photo} alt="" />
        <Sprig kind="plum" className="gg-hide-m" style={{ right: -36, bottom: -62, width: 130, transform: "rotate(-24deg)" }} />
      </div>
      <div className="tc">{welcome ? "*Valid for new subscribers. " : ""}<Link href="/rewards-terms">T&amp;Cs apply</Link>.</div>
    </>
  );
}

const PATH = "M70 75 C 190 15, 260 135, 350 75 S 520 15, 630 75";

function Journey({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="gg-journey gg-reveal">
      <div>
        <h2>Your path to healthy savings</h2>
        <div className="gg-script">Join today. Start saving.</div>
        <Link href={signedIn ? "/account?tab=rewards" : "/account"} className="gg-btn">{signedIn ? "View my rewards" : "Join free"}</Link>
      </div>
      <div className="gg-path" aria-hidden>
        <svg className="line" viewBox="0 0 700 150" preserveAspectRatio="none">
          <path className="dash" d={PATH} stroke="rgba(243,235,225,.25)" strokeWidth="2" strokeDasharray="4 8" fill="none" />
          <path className="draw" d={PATH} stroke="#e3bd78" strokeWidth="2.5" fill="none" />
          <circle r="7" fill="#e3bd78" className="gg-journey-dot">
            <animateMotion dur="6s" repeatCount="indefinite" keyPoints="0;0.5;1;1" keyTimes="0;0.4;0.8;1" calcMode="linear" path={PATH} />
          </circle>
        </svg>
        <div className="gg-steps">
          <div className="gg-step"><span className="c"><GIcon name="percent" size={30} /></span><b>EASY<br />SIGNUP</b></div>
          <div className="gg-step"><span className="c"><GIcon name="mail" size={30} /></span><b>JOIN<br />NEWSLETTER</b></div>
          <div className="gg-step"><span className="c"><GIcon name="heart" size={30} /></span><b>START<br />SAVING</b></div>
        </div>
      </div>
    </section>
  );
}

function Routine({ order, fallback, signedIn }: { order: LastOrder | null; fallback: Product[]; signedIn: boolean }) {
  const products = order ? order.items.map((i) => i.product).slice(0, 3) : fallback.slice(0, 2);
  const tints = ["var(--g-blush)", "var(--g-lilac)", "var(--g-sage)"];
  return (
    <section className="gg-routine gg-reveal">
      <div className="head">
        <h2>{order ? "Your daily routine" : "Build a daily routine"}</h2>
        {order ? (
          <Link href="/account?tab=orders">My orders</Link>
        ) : (
          <Link href={signedIn ? "/products" : "/account"}>{signedIn ? "Shop" : "Sign in"}</Link>
        )}
      </div>
      {!order && <p className="mt-2 text-sm" style={{ color: "var(--g-muted)" }}>Tick off your supplements each day — remembered on this device.</p>}
      {products.map((p, i) => {
        const t = productTitle(p.name);
        const how = directions(p);
        const img = firstImage(p);
        return (
          <div key={p.id} className="gg-slot" style={{ background: tints[i % tints.length] }}>
            <Link href={`/products/${p.slug}`} className="pv">{img && <img src={img} alt={t.name} />}</Link>
            <div className="min-w-0">
              <b>{timeOfDay(how)}{t.name}</b>
              <span className="sub">{how || t.tagline}</span>
            </div>
            <RoutineCheck id={p.id} name={t.name} />
          </div>
        );
      })}
    </section>
  );
}

function RefillCard({ order, defaultDays, signedIn, fallback }: { order: LastOrder | null; defaultDays: number; signedIn: boolean; fallback?: Product }) {
  const refill = order ? nextRefill(order, defaultDays) : null;
  if (!refill) {
    const img = fallback ? firstImage(fallback) : null;
    return (
      <section className="gg-refill gg-reveal" data-delay=".15">
        <div>
          <div className="gg-caps">Refill reminders</div>
          <h2>Never run out of your favourites</h2>
          <p className="note mt-4">We&apos;ll email you a few days before your supply runs low, with a one-tap re-order link.</p>
          <Link href={signedIn ? "/products" : "/account"} className="gg-btn">{signedIn ? "Shop now" : "Sign in to start"}</Link>
        </div>
        <div className="gg-vis gg-bob d2">{img && <img src={img} alt="" />}</div>
      </section>
    );
  }
  const { item, daysLeft, totalDays, placedAt } = refill;
  const t = productTitle(item.product.name);
  const img = firstImage(item.product);
  const left = Math.max(0.04, Math.min(1, daysLeft / totalDays));
  const heading =
    daysLeft > 1 ? `${t.name} runs out in about ${daysLeft} days`
      : daysLeft >= 0 ? `${t.name} is about to run out`
        : `Time to restock ${t.name}?`;
  const href = reorderHref([{ productId: item.product.id, quantity: item.quantity }]) ?? `/products/${item.product.slug}`;
  return (
    <section className="gg-refill gg-reveal" data-delay=".15">
      <div>
        <div className="gg-caps">{daysLeft > 7 ? "Your supply" : "Refill soon"}</div>
        <h2>{heading}</h2>
        <div className="bar"><i style={{ width: `${Math.round(left * 100)}%` }} /></div>
        <span className="note">
          Based on your order on {placedAt.toLocaleDateString("en-ZA", { day: "numeric", month: "short", timeZone: "Africa/Johannesburg" })}
        </span>
        <Link href={href} className="gg-btn">Re-order in one tap</Link>
      </div>
      <div className="gg-vis gg-bob d2">{img && <img src={img} alt={t.name} />}</div>
    </section>
  );
}

function Tile({ product: p, index }: { product: Product; index: number }) {
  const t = productTitle(p.name);
  const img = firstImage(p);
  return (
    <div className="gg-tile gg-reveal" data-delay={(index * 0.1).toFixed(1)}>
      <WishlistButton productId={p.id} className="heart" />
      <Link href={`/products/${p.slug}`} className="block">
        <div className="pv" style={{ background: TINTS[index % TINTS.length] }}>{img && <img src={img} alt={t.name} />}</div>
        <h3>{t.name}</h3>
        <span className="t">{t.tagline || p.shortDescription}</span>
      </Link>
      <div className="row">
        <b>
          {formatPrice(p.price)}
          {p.compareAtPrice && p.compareAtPrice > p.price && <s>{formatPrice(p.compareAtPrice)}</s>}
        </b>
        <AddPlus product={{ id: p.id, slug: p.slug, name: p.name, price: p.price, image: img ?? undefined, stock: p.stock }} />
      </div>
    </div>
  );
}
