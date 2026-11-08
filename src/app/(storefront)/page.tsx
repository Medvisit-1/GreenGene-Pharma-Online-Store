import Link from "next/link";
import type { Product } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { rewardHighlights, shortDiscount } from "@/lib/rewards";
import { bestOffer, directions, firstImage, goalLabel, greeting, lastPaidOrder, nextRefill, productTitle, shortPrice, timeOfDay } from "@/lib/home";
import { reorderHref } from "@/lib/utils";
import { parseNewReleaseCards } from "@/lib/new-release";
import { NewReleaseCarousel } from "@/components/new-release-carousel";
import { AddPlus } from "@/components/garden/home-bits";
import { EvergreenFx } from "@/components/evergreen/fx";
import { GoalShowcase, RoutineList, Welcome, type GoalData } from "@/components/evergreen/bits";
import { gxFonts } from "@/components/evergreen/fonts";
import { ProductImg } from "@/components/night/pic";
import "@/components/evergreen/home.css";

export const dynamic = "force-dynamic";

const Dots = () => (<><i className="dot" /><i className="dot" /><i className="dot" /><i className="dot" /></>);

/** Colour + icon for a goal, from its category slug. */
function goalLook(slug: string): Pick<GoalData, "rgb" | "icon"> {
  if (/women|hormone|fertil/.test(slug)) return { rgb: "232,143,184", icon: "women" };
  if (/slim|lean|weight|fit/.test(slug)) return { rgb: "190,140,255", icon: "bolt" };
  if (/mind|mood|stress|sleep/.test(slug)) return { rgb: "90,209,200", icon: "mind" };
  if (/skin|beauty/.test(slug)) return { rgb: "230,192,123", icon: "skin" };
  if (/men|energy|perform/.test(slug)) return { rgb: "120,170,255", icon: "men" };
  return { rgb: "79,220,155", icon: "leaf" };
}

const price = (p: Pick<Product, "price" | "compareAtPrice">) => ({
  price: shortPrice(p.price),
  was: p.compareAtPrice && p.compareAtPrice > p.price ? shortPrice(p.compareAtPrice) : undefined,
});

export default async function HomePage() {
  const customer = await getCurrentCustomer();
  const [s, categories, products, rewards, order, offer] = await Promise.all([
    getSettings(),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({ where: { active: true }, orderBy: [{ featured: "desc" }, { createdAt: "desc" }] }),
    rewardHighlights(),
    customer ? lastPaidOrder(customer) : null,
    bestOffer(),
  ]);
  const firstName = customer?.name?.trim().split(/\s+/)[0];
  const popular = products.slice(0, 4);
  const hero = [products[1], products[0], products[2]].filter(Boolean) as Product[];
  const newReleaseCards = parseNewReleaseCards(s.newReleaseCards);
  const defaultDays = Math.max(7, parseInt(s.refillDefaultDays, 10) || 30);

  const goals: GoalData[] = categories.map((c) => {
    const p = products.find((x) => x.categoryId === c.id);
    const t = p ? productTitle(p.name) : null;
    return {
      name: goalLabel(c.name),
      href: `/products?category=${c.slug}`,
      ...goalLook(c.slug),
      product: p && t ? { title: t.name, desc: t.tagline || p.shortDescription || "", ...price(p), img: firstImage(p) ?? undefined, href: `/products/${p.slug}` } : null,
    };
  }).filter((g) => g.product);

  const routineProducts = order ? order.items.map((i) => i.product).slice(0, 4) : popular;
  const routine = routineProducts.map((p) => {
    const t = productTitle(p.name), how = directions(p);
    return { id: p.id, name: `${timeOfDay(how)}${t.name}`, sub: how || t.tagline, img: firstImage(p) ?? undefined };
  });
  const refill = order ? nextRefill(order, defaultDays) : null;

  const steps = rewards
    ? [
        rewards.welcome && { n: shortDiscount(rewards.welcome), h: "Off for joining our newsletter", p: "A welcome reward the moment you sign up." },
        rewards.referral && { n: shortDiscount(rewards.referral), h: "For every friend you refer", p: "Share GreenGene and you both benefit." },
        rewards.milestones[0] && { n: shortDiscount(rewards.milestones[0]), h: `Off at order ${rewards.milestones[0].threshold}`, p: "Loyalty that grows with every order." },
      ].filter(Boolean) as { n: string; h: string; p: string }[]
    : [];

  return (
    <div className={`gx pre ${gxFonts}`}>
      <noscript><style>{".gx .rv{opacity:1;transform:none}.gx-introbg,.gx-introword,.gx-skip{display:none}"}</style></noscript>
      <EvergreenFx />

      {/* Hero */}
      <div className="hero">
        <div className="spot" /><div className="spot2" />
        <div className="wrap" style={{ position: "relative", zIndex: 2 }}>
          <span className="eyebrow rv">{greeting()}</span>
          <Welcome accountName={customer ? firstName : undefined} signedIn={!!customer} />
          <p className="lede rv">Premium supplements, made locally in South Africa. Have a look around, we are glad you are here.</p>
          <div className="cta rv">
            <Link className="btn p" href="/products">Shop all products →</Link>
            <Link className="btn g" href="/account?tab=rewards">Join rewards</Link>
          </div>
          {hero.length > 0 && (
            <div className="stage">
              {hero.map((p, i) => {
                const t = productTitle(p.name), img = firstImage(p);
                return (
                  <Link key={p.id} href={`/products/${p.slug}`} className={`card3d c${i + 1}`} aria-label={t.name}>
                    {img && <ProductImg src={img} alt="" sizes="300px" eager={i === 1} />}
                    <div className="tag"><b>{t.name}</b><span>{shortPrice(p.price)}</span></div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Goals */}
      {goals.length > 0 && (
        <section id="goals"><div className="wrap">
          <div className="head rv"><span className="eyebrow">Shine bright</span><h2>Your goal. Your <em>formula.</em></h2><p>Choose what matters to you and we&apos;ll show you where to start.</p></div>
          <GoalShowcase goals={goals} />
        </div></section>
      )}

      {/* Offer */}
      {offer && offer.compareAtPrice && (() => {
        const t = productTitle(offer.name), img = firstImage(offer);
        return (
          <section className="tight"><div className="wrap">
            <div className="frame offer rv"><Dots />
              <div className="copy">
                <span className="eyebrow">Limited offer</span>
                <h3>{t.name}, <em>now {shortPrice(offer.price)}</em></h3>
                <p>{t.tagline ? `${t.tagline}. ` : ""}Save {shortPrice(offer.compareAtPrice - offer.price)}, was <s>{shortPrice(offer.compareAtPrice)}</s>.</p>
                <Link className="btn p" href={`/products/${offer.slug}`}>Shop the offer →</Link>
              </div>
              <div className="vis">{img && <ProductImg src={img} alt={t.name} sizes="(max-width: 900px) 90vw, 470px" />}</div>
            </div>
          </div></section>
        );
      })()}

      {/* Rewards */}
      {steps.length > 0 && (
        <section id="rewards"><div className="wrap">
          <div className="head rv"><span className="eyebrow">GreenGene Rewards</span><h2>Your path to healthy <em>savings.</em></h2><p>Join free and start saving from your very first order.</p></div>
          <div className="steps">
            {steps.map((x) => (
              <div key={x.h} className="frame step rv"><Dots /><div className="n">{x.n}</div><h4>{x.h}</h4><p>{x.p}</p></div>
            ))}
          </div>
          <div className="cta rv"><Link className="btn g" href="/account?tab=rewards">See all rewards →</Link></div>
        </div></section>
      )}

      {/* Routine + refill */}
      {s.homeShowRoutine !== "0" && routine.length > 0 && (
        <section className="tight"><div className="wrap"><div className="two">
          <div className="frame panel rv"><Dots />
            <h3>{order ? "Your daily routine" : "Build a daily routine"}</h3>
            <div className="sub">Tick off your supplements each day, remembered on this device.</div>
            <RoutineList items={routine} />
          </div>
          <div className="frame panel refill rv"><Dots />
            {refill ? (() => {
              const t = productTitle(refill.item.product.name), img = firstImage(refill.item.product);
              const href = reorderHref([{ productId: refill.item.product.id, quantity: refill.item.quantity }]) ?? `/products/${refill.item.product.slug}`;
              const left = Math.max(0.04, Math.min(1, refill.daysLeft / refill.totalDays));
              return (
                <>
                  <div>
                    <span className="eyebrow left" style={{ color: "var(--acc)" }}>{refill.daysLeft > 7 ? "Your supply" : "Refill soon"}</span>
                    <h3>{refill.daysLeft > 1 ? `${t.name} runs out in about ${refill.daysLeft} days` : `${t.name} is about to run out`}</h3>
                    <div className="bar"><b style={{ width: `${Math.round(left * 100)}%` }} /></div>
                    <Link className="btn p" href={href}>Re-order in one tap</Link>
                  </div>
                  {img && <ProductImg src={img} alt="" sizes="150px" />}
                </>
              );
            })() : (
              <>
                <div>
                  <span className="eyebrow left" style={{ color: "var(--acc)" }}>Refill reminders</span>
                  <h3>Never run out of your favourites.</h3>
                  <div className="sub" style={{ margin: "10px 0 18px" }}>We email you a few days before your supply runs low, with a one-tap re-order link.</div>
                  <Link className="btn p" href={customer ? "/products" : "/account"}>{customer ? "Shop now" : "Sign in to start"}</Link>
                </div>
                {popular[0] && firstImage(popular[0]) && <ProductImg src={firstImage(popular[0])!} alt="" sizes="150px" />}
              </>
            )}
          </div>
        </div></div></section>
      )}

      {/* Popular */}
      {s.homeShowPopular !== "0" && popular.length > 0 && (
        <section className="tight"><div className="wrap">
          <div className="head rv"><span className="eyebrow">Best sellers</span><h2>{s.homePopularHeading || "Popular right now"}</h2></div>
          <div className="cards">
            {popular.map((p) => {
              const t = productTitle(p.name), img = firstImage(p), pr = price(p);
              const c = categories.find((x) => x.id === p.categoryId);
              return (
                <article key={p.id} className="frame pc rv" style={{ "--acc-rgb": goalLook(c?.slug ?? "").rgb } as React.CSSProperties}><Dots />
                  <Link href={`/products/${p.slug}`} className="im">
                    {pr.was && <span className="badge">Save {shortPrice(p.compareAtPrice! - p.price)}</span>}
                    {img && <ProductImg src={img} alt={t.name} sizes="(max-width: 520px) 70vw, 220px" />}
                  </Link>
                  <Link href={`/products/${p.slug}`}><h4>{t.name}</h4></Link>
                  <div className="d">{t.tagline || p.shortDescription}</div>
                  <div className="row">
                    <div className="price">{pr.price}{pr.was && <s>{pr.was}</s>}</div>
                    <AddPlus product={{ id: p.id, slug: p.slug, name: p.name, price: p.price, image: img ?? undefined, stock: p.stock }} />
                  </div>
                </article>
              );
            })}
          </div>
        </div></section>
      )}

      {s.newReleaseEnabled === "1" && newReleaseCards.length > 0 && (
        <section className="tight"><div className="wrap">
          <NewReleaseCarousel heading={s.newReleaseHeading || "New Release"} cards={newReleaseCards} />
        </div></section>
      )}

      {/* Final call to action */}
      <section className="tight"><div className="wrap">
        <div className="frame final rv"><Dots />
          <span className="eyebrow">Start today</span><h2>Begin your routine.</h2>
          <div className="cta" style={{ marginTop: 0 }}>
            <Link className="btn p" href="/products">Shop all products →</Link>
            <Link className="btn g" href="/account?tab=rewards">Join free</Link>
          </div>
        </div>
      </div></section>
    </div>
  );
}
