import Link from "next/link";
import type { Product } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { rewardHighlights, shortDiscount } from "@/lib/rewards";
import { directions, firstImage, greeting, lastPaidOrder, nextRefill, productTitle, shortPrice } from "@/lib/home";
import { formatPrice, reorderHref } from "@/lib/utils";
import { getRatingMap } from "@/lib/reviews";
import { parseNewReleaseCards } from "@/lib/new-release";
import { EvergreenFx } from "@/components/evergreen/fx";
import { ProductImg } from "@/components/night/pic";
import { WishlistButton } from "@/components/wishlist-button";
import { ComboDrift, Greeting, HeroMotion, Quiz, Routine, ScrollAmbient, type QuizData, type QuizProduct } from "@/components/gh/client";
import "@/components/gh/home.css";

export const dynamic = "force-dynamic";

const LEAF = <><path d="M30 2C8 30 6 62 30 98 54 62 52 30 30 2Z" /><path className="vein" d="M30 8v86" /></>;
const BELL = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16ZM10 21h4" /></svg>;

/** One soft background element per section; it drifts slowly with scroll (wired by ScrollAmbient). */
function Amb({ kind, dx, dy, rot = 0, leaf = false }: { kind: string; dx: number; dy: number; rot?: number; leaf?: boolean }) {
  return (
    <div className="amb" aria-hidden="true">
      {leaf
        ? <svg className={`amb-el ${kind}`} data-dx={dx} data-dy={dy} data-rot={rot} viewBox="0 0 60 100">{LEAF}</svg>
        : <i className={`amb-el ${kind}`} data-dx={dx} data-dy={dy} data-rot={rot} />}
    </div>
  );
}

const onSale = (p: Pick<Product, "price" | "compareAtPrice">) => p.compareAtPrice != null && p.compareAtPrice > p.price;
const href = (p: Pick<Product, "slug">) => `/products/${p.slug}`;
/** Time of day from the product's own directions, without emoji ("Morning · "). */
const when = (how: string) => (/morning|breakfast/i.test(how) ? "Morning · " : /evening|night|bed/i.test(how) ? "Evening · " : "");

export default async function HomePage() {
  const customer = await getCurrentCustomer();
  const [s, products, rewards, order] = await Promise.all([
    getSettings(),
    prisma.product.findMany({ where: { active: true }, orderBy: [{ featured: "desc" }, { createdAt: "desc" }] }),
    rewardHighlights(),
    customer ? lastPaidOrder(customer) : null,
  ]);
  const ratings = await getRatingMap(products.map((p) => p.id));
  const firstName = customer?.name?.trim().split(/\s+/)[0];
  const find = (re: RegExp, combo = false) => products.find((p) => p.isCombo === combo && re.test(p.slug));
  const P = {
    glow: find(/^glowgene/), estrogene: find(/^estrogene/), estrolean: find(/^estrolean/), soul: find(/^soul/),
    zenax: find(/^zenax/), lions: find(/^lion/), anabolean: find(/^anabolean/), mangene: find(/^mangene/),
    combo: find(/ultimate-combo/, true) ?? products.find((p) => p.isCombo),
  };
  const singles = products.filter((p) => !p.isCombo);
  const popular = singles.slice(0, 4);

  /* hero: Estrogene in the centre (3D), the combo and GlowGene either side */
  const centre = P.estrogene ?? singles[0];
  const left = P.combo ?? singles.find((p) => p !== centre);
  const right = P.glow && P.glow !== centre ? P.glow : singles.find((p) => p !== centre && p !== left);

  /* quiz: live names, prices, stock and the product's own short description */
  const qp = (p?: Product): QuizProduct | undefined => p && {
    name: productTitle(p.name).name, price: formatPrice(p.price), was: onSale(p) ? formatPrice(p.compareAtPrice!) : undefined,
    inStock: p.stock > 0, img: firstImage(p) ?? undefined, href: href(p), line: p.shortDescription || productTitle(p.name).tagline,
  };
  const tip = (r: Awaited<ReturnType<typeof rewardHighlights>>, kind: "welcome" | "referral" | "milestone") => {
    if (!r) return "";
    if (kind === "welcome" && r.welcome) return `New here? Joining the newsletter gives new subscribers ${shortDiscount(r.welcome)} off. T&Cs apply.`;
    if (kind === "referral" && r.referral) return `Refer a friend through GreenGene Rewards for ${shortDiscount(r.referral)}. T&Cs apply.`;
    const m = r.milestones[0];
    if (kind === "milestone" && m) return `As a regular, GreenGene Rewards gives ${shortDiscount(m)} off at order ${m.threshold}. T&Cs apply.`;
    return "";
  };
  const quiz: QuizData = {
    products: Object.fromEntries(Object.entries(P).map(([k, v]) => [k, qp(v)])),
    tips: [tip(rewards, "welcome"), tip(rewards, "referral"), tip(rewards, "milestone")],
  };

  /* best sellers: every product on sale, in-stock first (store order otherwise) */
  const grid = [...singles].sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0));
  const heading = s.homePopularHeading?.trim() || "Popular right now";

  /* combo banner */
  const combo = P.combo && onSale(P.combo) ? P.combo : null;
  const comboPair = [P.estrogene, P.estrolean].filter(Boolean) as Product[];
  const estroRating = P.estrogene ? ratings.get(P.estrogene.id) : undefined;

  /* rewards */
  const steps = rewards
    ? ([
        rewards.welcome && { n: shortDiscount(rewards.welcome), h: "Off for joining our newsletter", p: "A welcome reward the moment you sign up." },
        rewards.referral && { n: shortDiscount(rewards.referral), h: "For every friend you refer", p: "Share GreenGene and you both benefit." },
        rewards.milestones[0] && { n: shortDiscount(rewards.milestones[0]), h: `Off at order ${rewards.milestones[0].threshold}`, p: "Loyalty that grows with every order." },
      ].filter(Boolean) as { n: string; h: string; p: string }[])
    : [];

  /* routine + refill (unchanged logic) */
  const routineProducts = order ? order.items.map((i) => i.product).slice(0, 4) : popular;
  const routine = routineProducts.map((p) => {
    const t = productTitle(p.name), how = directions(p);
    return { id: p.id, title: `${when(how)}${t.name}`, sub: how || t.tagline, img: firstImage(p) ?? undefined };
  });
  const defaultDays = Math.max(7, parseInt(s.refillDefaultDays, 10) || 30);
  const refill = order ? nextRefill(order, defaultDays) : null;
  const newCards = s.newReleaseEnabled === "1" ? parseNewReleaseCards(s.newReleaseCards).slice(0, 3) : [];

  return (
    <div className="gh pre">
      <noscript><style>{".gh .rv{opacity:1;transform:none}.gx-introbg,.gx-introword,.gx-skip{display:none}"}</style></noscript>
      <EvergreenFx rootSelector=".gh" ambient={false} />
      <HeroMotion />
      <ComboDrift />
      <ScrollAmbient />

      {/* 1. HERO */}
      <section className="hero" id="gh-hero">
        <div className="hero-bg" aria-hidden="true" />
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <Greeting greeting={greeting()} accountName={customer ? firstName : undefined} signedIn={!!customer} />
            <h1>Your goal.<br />Your <em>formula.</em></h1>
            <p className="hero-script">your path to healthy living</p>
            <p className="hero-intro">Premium supplements, made locally in South Africa. Have a look around, we are glad you are here.</p>
            <div className="btn-row">
              <Link className="btn btn-primary" href="/products">Shop all products</Link>
              <Link className="btn btn-ghost" href="/account?tab=rewards">Join rewards</Link>
            </div>
          </div>

          {centre && (
            <div className="stage">
              <svg className="leaf l1" data-depth="1.6" viewBox="0 0 60 100" aria-hidden="true">{LEAF}</svg>
              <svg className="leaf l2" data-depth="0.7" viewBox="0 0 60 100" aria-hidden="true">{LEAF}</svg>
              <svg className="leaf l3" data-depth="2.4" viewBox="0 0 60 100" aria-hidden="true">{LEAF}</svg>
              <svg className="leaf l4" data-depth="1.1" viewBox="0 0 60 100" aria-hidden="true">{LEAF}</svg>
              <svg className="leaf l5" data-depth="0.4" viewBox="0 0 60 100" aria-hidden="true">{LEAF}</svg>
              {left && (
                <Link className="pcard side left" href={href(left)}>
                  <span className={`pcard-img${left === P.combo && comboPair.length === 2 ? " duo" : ""}`}>
                    {(left === P.combo && comboPair.length === 2 ? comboPair : [left]).map((p) => firstImage(p) && <ProductImg key={p.id} src={firstImage(p)!} alt="" sizes="160px" />)}
                  </span>
                  <span className="pcard-name">{productTitle(left.name).name}</span>
                  <span className="pcard-price">{formatPrice(left.price)}</span>
                </Link>
              )}
              {right && (
                <Link className="pcard side right" href={href(right)}>
                  <span className="pcard-img">{firstImage(right) && <ProductImg src={firstImage(right)!} alt="" sizes="160px" />}</span>
                  <span className="pcard-name">{productTitle(right.name).name}</span>
                  <span className="pcard-price">{formatPrice(right.price)}</span>
                </Link>
              )}
              <Link className="pcard centre" href={href(centre)}
                aria-label={`${productTitle(centre.name).name}, ${formatPrice(centre.price)}${onSale(centre) ? `, was ${formatPrice(centre.compareAtPrice!)}` : ""}. View product`}>
                <span className="bottle-host" id={centre === P.estrogene ? "bottleHost" : undefined}>
                  {centre === P.estrogene ? (
                    // eslint-disable-next-line @next/next/no-img-element -- real pack shot, shown first and kept whenever WebGL is not available
                    <img id="bottleStill" src="/hero/estrogene-front.webp" width={743} height={1391} alt={`${productTitle(centre.name).name} bottle`} fetchPriority="high" />
                  ) : firstImage(centre) && <ProductImg src={firstImage(centre)!} alt="" sizes="272px" eager />}
                </span>
                <span className="pcard-meta">
                  <span className="pcard-name">{productTitle(centre.name).name}</span>
                  <span className="pcard-price">{formatPrice(centre.price)}{onSale(centre) && <s>{formatPrice(centre.compareAtPrice!)}</s>}</span>
                  <span className="pcard-cta">{centre.stock > 0 ? "View product" : "Sold out · notify me"}</span>
                </span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 2. QUIZ */}
      <section className="sec quiz-sec amb-host" id="quiz">
        <Amb kind="glow a1" dy={140} dx={60} />
        <div className="wrap"><Quiz data={quiz} /></div>
      </section>

      {/* 3. BEST SELLERS */}
      {s.homeShowPopular !== "0" && grid.length > 0 && (
        <section className="sec amb-host" id="best">
          <Amb kind="leaf a2" dy={180} dx={-40} rot={14} leaf />
          <div className="wrap">
            <header className="sec-head rv">
              <p className="eyebrow">Best sellers</p>
              <h2>{heading === "Popular right now" ? <>Popular <em>right now</em></> : heading}</h2>
              <Link className="text-link" href="/products">All {singles.length} products</Link>
            </header>
            <div className="grid">
              {grid.map((p) => {
                const t = productTitle(p.name), img = firstImage(p), r = ratings.get(p.id), out = p.stock <= 0;
                return (
                  <article key={p.id} className={`card${out ? " soldout" : ""}`}>
                    <WishlistButton productId={p.id} className="heart" />
                    <Link className="card-img" href={href(p)}>
                      <span className="pills">{onSale(p) && <span className="pill sale">Sale</span>}{out && <span className="pill out">Sold out</span>}</span>
                      {img && <ProductImg src={img} alt={t.name} sizes="(max-width: 640px) 45vw, 300px" />}
                    </Link>
                    <div className="card-body">
                      <p className="brand">{p.brand || "GreenGene Pharma"}</p>
                      <h3><Link href={href(p)}>{t.name}</Link></h3>
                      {(t.tagline || p.shortDescription) && <p className="sub">{t.tagline || p.shortDescription}</p>}
                      {r?.count ? (
                        <p className="stars" aria-label={`Rated ${r.avg.toFixed(1)} out of 5 from ${r.count} reviews`}><b style={{ "--w": `${(r.avg / 5) * 100}%` } as React.CSSProperties}>★★★★★</b> ({r.count})</p>
                      ) : <p className="stars">No reviews yet</p>}
                      <p className="price">{formatPrice(p.price)}{onSale(p) && <> <s>{formatPrice(p.compareAtPrice!)}</s></>}</p>
                      {out
                        ? <Link className="notify" href={`${href(p)}#notify`}><span>Email me when it’s back</span>{BELL}</Link>
                        : <Link className="view" href={href(p)}>View product</Link>}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 4. BENEFITS (approved copy; the rating line is live) */}
      <section className="benefits amb-host" id="why">
        <Amb kind="glow a3" dy={120} dx={-70} />
        <div className="wrap">
          <header className="sec-head rv">
            <p className="eyebrow">Why it works</p>
            <h2>What is <em>inside</em> matters</h2>
          </header>
          <div className="ben-row">
            <article className="ben rv">
              <span className="ben-ico"><svg viewBox="0 0 24 24"><path d="M12 3c3.5 4 5.5 6.8 5.5 10a5.5 5.5 0 0 1-11 0C6.5 9.8 8.5 7 12 3Z" /></svg></span>
              <h3>Four actives, one night cream</h3>
              <p>GlowGene brings Glutathione, Vitamin C, Tripeptides and Kojic Acid together in a face cream for your evening routine.</p>
              <p className="ben-stat">GlowGene · 30 ml · apply in the evening</p>
            </article>
            <article className="ben mid rv">
              <span className="ben-ico"><svg viewBox="0 0 24 24"><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14Z" /><path d="M5 19c3-5 6-8 10-10" /></svg></span>
              <h3>Designed to be taken together</h3>
              <p>Estrogene for herbal hormonal support and EstroLean for slimming and fitness support. Two capsules of each, in the morning.</p>
              <p className="ben-stat">{estroRating?.count ? `Estrogene · rated ${estroRating.avg.toFixed(1).replace(".", ",")} out of 5 · ${estroRating.count} reviews` : "Estrogene + EstroLean · 60 capsules each"}</p>
            </article>
            <article className="ben rv">
              <span className="ben-ico"><svg viewBox="0 0 24 24"><path d="M3 12c3-6 6-6 9 0s6 6 9 0" /><path d="M3 17c3-4 6-4 9 0s6 4 9 0" opacity=".5" /></svg></span>
              <h3>Calm, focus, restful sleep</h3>
              <p>Zenax is a natural mind and stress support formula built on five plant-based ingredients, including L-Theanine and Ashwagandha.</p>
              <p className="ben-stat">Zenax · 60 capsules · one month supply</p>
            </article>
          </div>
        </div>
      </section>

      {/* 5. ULTIMATE COMBO */}
      {combo && (
        <section className="combo" id="gh-combo">
          <div className="wrap combo-grid">
            <div className="combo-copy rv">
              <p className="eyebrow">Limited offer · {productTitle(combo.name).name}</p>
              <h2>Two formulas,<br />one <em>routine.</em></h2>
              <div className="combo-buy">
                <p className="lede">{comboPair.map((p) => productTitle(p.name).name).join(" + ") || productTitle(combo.name).tagline}. Save {shortPrice(combo.compareAtPrice! - combo.price)}, was <s>{shortPrice(combo.compareAtPrice!)}</s>.</p>
                <p className="combo-price">now {shortPrice(combo.price)}</p>
                <Link className="btn btn-primary" href={href(combo)}>{combo.stock > 0 ? "Shop the offer" : "Sold out · notify me"}</Link>
              </div>
            </div>
            <div className="combo-stage">
              <div className="combo-word" aria-hidden="true">GLOW</div>
              <div className="combo-photo" id="comboPhoto">
                {(comboPair.length ? comboPair : [combo]).map((p) => firstImage(p) && <ProductImg key={p.id} src={firstImage(p)!} alt={productTitle(p.name).name} sizes="(max-width: 900px) 45vw, 340px" />)}
                <span className="seal" aria-label={`Save ${shortPrice(combo.compareAtPrice! - combo.price)}`}><small>Save</small><b>{shortPrice(combo.compareAtPrice! - combo.price)}</b></span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. REWARDS */}
      {steps.length > 0 && (
        <section className="sec rewards" id="rewards">
          <div className="wrap">
            <header className="sec-head rv">
              <p className="eyebrow">GreenGene Rewards</p>
              <h2>Your path to healthy <em>savings.</em></h2>
              <p className="lede">Join free and start saving from your very first order.</p>
            </header>
            <div className="rew-row">
              {steps.map((x) => <article key={x.h} className="rew rv"><p className="rew-fig">{x.n}</p><h3>{x.h}</h3><p>{x.p}</p></article>)}
            </div>
            <p className="rew-foot"><Link className="btn btn-ghost" href="/account?tab=rewards">See all rewards</Link> <Link className="tiny-link" href="/rewards-terms">Rewards T&amp;Cs apply</Link></p>
          </div>
        </section>
      )}

      {/* 7 + 8. ROUTINE TRACKER / REFILL REMINDERS */}
      {s.homeShowRoutine !== "0" && routine.length > 0 && (
        <section className="sec duo-sec amb-host" id="routine">
          <Amb kind="leaf a4" dy={160} dx={50} rot={-12} leaf />
          <div className="wrap duo-grid">
            <div className="tracker rv">
              <p className="eyebrow">Daily routine</p>
              <h2>{order ? <>Your daily <em>routine</em></> : <>Build a daily <em>routine</em></>}</h2>
              <p className="lede">Tick off your supplements each day, remembered on this device.</p>
              <Routine items={routine} />
            </div>
            <div className="refill rv">
              {refill ? (() => {
                const t = productTitle(refill.item.product.name), img = firstImage(refill.item.product);
                const again = reorderHref([{ productId: refill.item.product.id, quantity: refill.item.quantity }]) ?? href(refill.item.product);
                const leftPct = Math.max(0.04, Math.min(1, refill.daysLeft / refill.totalDays));
                return (
                  <>
                    <div className="refill-copy">
                      <p className="eyebrow">{refill.daysLeft > 7 ? "Your supply" : "Refill soon"}</p>
                      <h2>{refill.daysLeft > 1 ? <>{t.name} runs out in about <em>{refill.daysLeft} days</em></> : <>{t.name} is about to <em>run out</em></>}</h2>
                      <div className="bar"><b style={{ width: `${Math.round(leftPct * 100)}%` }} /></div>
                      <Link className="btn btn-primary" href={again}>Re-order in one tap</Link>
                    </div>
                    {img && <span className="refill-img"><ProductImg src={img} alt="" sizes="150px" /></span>}
                  </>
                );
              })() : (
                <>
                  <div className="refill-copy">
                    <p className="eyebrow">Refill reminders</p>
                    <h2>Never run out of your <em>favourites.</em></h2>
                    <p className="lede">We email you a few days before your supply runs low, with a one-tap re-order link.</p>
                    <Link className="btn btn-primary" href={customer ? "/products" : "/account"}>{customer ? "Shop now" : "Sign in to start"}</Link>
                  </div>
                  {popular[0] && firstImage(popular[0]) && <span className="refill-img"><ProductImg src={firstImage(popular[0])!} alt="" sizes="150px" /></span>}
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 9. NEW RELEASE (cards from Admin settings) */}
      {newCards.length > 0 && (
        <section className="sec amb-host" id="new">
          <Amb kind="glow a5" dy={140} dx={60} />
          <div className="wrap">
            <header className="sec-head rv">
              <p className="eyebrow">Just launched</p>
              <h2>{(s.newReleaseHeading || "New Release").replace(/\s*\S+$/, "")} <em>{(s.newReleaseHeading || "New Release").split(/\s+/).pop()}</em></h2>
            </header>
            <div className="new-row">
              {newCards.map((c, i) => {
                /* the combo card shows the two real bottles instead of the old flat promo graphic */
                const isCombo = /combo/i.test(`${c.title} ${c.buttonLink}`) && comboPair.length === 2;
                const imgs = isCombo ? (comboPair.map((p) => firstImage(p)).filter(Boolean) as string[]) : c.image ? [c.image] : [];
                return (
                  <article key={i} className="new rv">
                    <div className="new-copy">
                      {c.title && <h3>{c.title}</h3>}
                      {c.text && <p>{c.text}</p>}
                      {c.buttonLink && <Link className="btn new-btn" href={c.buttonLink}>{c.buttonLabel || "Get it Now!"}</Link>}
                    </div>
                    {imgs.length > 0 && (
                      <span className={`new-img${imgs.length > 1 ? " duo" : ""}`}>
                        {imgs.map((src, n) => <ProductImg key={n} src={src} alt={n === 0 ? c.title : ""} sizes="(max-width: 900px) 60vw, 300px" />)}
                      </span>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
