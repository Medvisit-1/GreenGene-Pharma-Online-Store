import Image from "next/image";

/**
 * Opening intro: a bottle of Estrogene opens in a cone of light, capsules and
 * leaves ring out of it, then the GreenGene Pharma logo and a personal welcome
 * appear and the dark scene opens like a curtain onto the page.
 * Pure CSS (transform/opacity only), no client bundle. A tiny inline script
 * plays it once per browser session and skips it for reduced-motion visitors.
 */
type CSS = React.CSSProperties;
const RING_A = 10, RING_B = 8;
const DUST = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 37 + 8) % 96}%`, top: `${35 + ((i * 53) % 55)}%`,
  "--x": `${((i * 29) % 60) - 30}px`, "--s": `${(i % 8) * 0.25}s`, "--t": `${2.6 + (i % 5) * 0.4}s`,
}));

export function NightIntro({ greeting, name }: { greeting: string; name?: string }) {
  return (
    <>
      <div className="gn-intro" aria-hidden="true" suppressHydrationWarning>
        <div className="gn-door l" />
        <div className="gn-door r" />
        <div className="gn-scene">
          <div className="gn-cone" />
          <div className="gn-glow" />
          {DUST.map((d, i) => <i key={i} className="gn-dust" style={d as CSS} />)}
          <div className="gn-stage">
            <div className="gn-orbit">
              {Array.from({ length: RING_A }, (_, i) => (
                <span key={i} className="gn-p gn-pill" style={{ "--a": `${i * (360 / RING_A)}deg`, "--R": "118px", "--i": i } as CSS} />
              ))}
            </div>
            <div className="gn-orbit b">
              {Array.from({ length: RING_B }, (_, i) => (
                <span key={i} className={`gn-p ${i % 2 ? "gn-pill" : "gn-leaf"}`} style={{ "--a": `${i * (360 / RING_B) + 20}deg`, "--R": "172px", "--i": i + 4 } as CSS} />
              ))}
            </div>
            <div className="gn-mouth" />
            {Array.from({ length: 10 }, (_, i) => (
              <i key={i} className="gn-spark" style={{ "--dx": `${(i - 4.5) * 34}px`, "--dy": `${-120 - ((i * 41) % 110)}px`, "--d": `${1 + (i % 4) * 0.12}s`, "--i": i } as CSS} />
            ))}
            <div className="gn-bottle">
              {/* eslint-disable-next-line @next/next/no-img-element -- small static asset, split into cap + body */}
              <img className="gn-body" src="/intro/estrogene.webp" alt="" width={342} height={640} decoding="async" fetchPriority="high" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="gn-cap" src="/intro/estrogene.webp" alt="" width={342} height={640} decoding="async" />
            </div>
          </div>
          <div className="gn-reveal">
            <div className="gn-plate"><Image src="/logo-contrast.png" alt="" width={1547} height={756} sizes="320px" /></div>
            <p className="gn-eyebrow">{greeting}</p>
            <h2 className="gn-hello">{name ? `Welcome back, ${name}` : "Welcome to GreenGene"}</h2>
            <p className="gn-tag">your path to healthy living</p>
          </div>
        </div>
        <button type="button" className="gn-skip">Skip intro</button>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){var o=document.currentScript.previousElementSibling;if(!o)return;try{if(sessionStorage.getItem('gn-intro')||matchMedia('(prefers-reduced-motion:reduce)').matches){o.style.display='none';return}sessionStorage.setItem('gn-intro','1')}catch(e){}var b=o.querySelector('.gn-skip');if(b)b.onclick=function(){o.classList.add('skip')};o.addEventListener('animationend',function(e){if(e.target===o)o.style.display='none'})})();",
        }}
      />
    </>
  );
}
