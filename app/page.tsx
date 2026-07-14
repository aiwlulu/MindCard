"use client";
import React, { useContext, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Authentication from "@/components/Authentication";
import { authContext } from "@/lib/store/auth-context";

const features = [
  {
    number: "01",
    title: "Write or map",
    copy: "Edit as Markdown, work directly on the canvas, or keep both views open with live sync.",
  },
  {
    number: "02",
    title: "Stay in flow",
    copy: "Keyboard-first editing, Chinese IME support, bullet-list paste, undo, redo, and automatic saving.",
  },
  {
    number: "03",
    title: "See the whole thought",
    copy: "Collapse branches, attach external or reusable card links, recenter instantly, and browse large maps without losing context.",
  },
  {
    number: "04",
    title: "Share the result",
    copy: "Publish a revocable read-only link without exposing private card links, or export PNG, SVG, and Markdown.",
  },
];

export default function Home() {
  const { user, loading } = useContext(authContext);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/mindmap");
    }
  }, [user, router]);

  if (loading || user) {
    return <div className="landing-route-loading" aria-label="Loading MindCard" />;
  }

  return (
    <main className="mindcard-landing">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow">Mind mapping, rebuilt for flow</p>
          <h1 id="landing-title">Turn thought into structure.</h1>
          <p className="landing-intro">
            Write naturally in Markdown. Shape ideas on a calm, right-growing
            canvas. MindCard keeps both views in sync while you think.
          </p>
          <div className="landing-actions">
            <a className="landing-primary-action" href="#get-started">
              Start mapping
            </a>
            <a className="landing-secondary-action" href="#features">
              Explore the workflow
            </a>
          </div>
          <p className="landing-proof-line">
            Native TypeScript <span aria-hidden="true">·</span> No mind-map
            dependency <span aria-hidden="true">·</span> Private by default
          </p>
        </div>

        <figure className="landing-demo">
          <div className="landing-demo-frame">
            <Image
              src="/readme/mindcard-product-demo.gif"
              alt="MindCard turns Markdown into a live mind map"
              width={960}
              height={540}
              loading="eager"
              unoptimized
            />
          </div>
          <figcaption>
            <span>Live sync</span>
            Markdown on the left. A connected mind map on the right.
          </figcaption>
        </figure>
      </section>

      <section
        className="landing-features"
        id="features"
        aria-labelledby="features-title"
      >
        <header>
          <p className="landing-eyebrow">One workspace, two ways to think</p>
          <h2 id="features-title">
            Fast enough for capture. Clear enough for recall.
          </h2>
        </header>
        <div className="landing-feature-list">
          {features.map((feature) => (
            <article key={feature.number}>
              <span>{feature.number}</span>
              <h3>{feature.title}</h3>
              <p>{feature.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="landing-get-started"
        id="get-started"
        aria-labelledby="get-started-title"
      >
        <div className="landing-get-started-copy">
          <p className="landing-eyebrow">Start with a thought</p>
          <h2 id="get-started-title">Your next map is one line away.</h2>
          <p>
            Try the demo account, sign in with Google, or create your own
            workspace. Your maps stay private until you choose to share them.
          </p>
        </div>
        <Authentication />
      </section>

      <footer className="landing-footer">
        <span>MindCard</span>
        <p>Write. Connect. Remember.</p>
      </footer>
    </main>
  );
}
