"use client";
import React, { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import Authentication from "@/components/Authentication";
import LandingPreview from "@/components/LandingPreview";
import {
  CollapseIcon,
  KeyboardIcon,
  LockIcon,
  MarkdownIcon,
  ShareIcon,
  SparkIcon,
} from "@/components/Icons";
import { authContext } from "@/lib/store/auth-context";

const features = [
  {
    number: "01",
    title: "Write or map",
    copy: "Edit as Markdown, work directly on the canvas, or keep both views open with live sync.",
    Icon: MarkdownIcon,
  },
  {
    number: "02",
    title: "Stay in flow",
    copy: "Keyboard-first editing, Chinese IME support, bullet-list paste, undo, redo, and automatic saving.",
    Icon: KeyboardIcon,
  },
  {
    number: "03",
    title: "See the whole thought",
    copy: "Collapse branches, attach external or reusable card links, recenter instantly, and browse large maps without losing context.",
    Icon: CollapseIcon,
  },
  {
    number: "04",
    title: "Share the result",
    copy: "Publish a revocable read-only link without exposing private card links, or export PNG, SVG, and Markdown.",
    Icon: ShareIcon,
  },
];

const qualityPillars = [
  {
    title: "Craft clarity",
    copy: "Quiet visual hierarchy, careful spacing, and focused typography keep ideas readable during long sessions.",
    Icon: SparkIcon,
  },
  {
    title: "Instant response",
    copy: "Keyboard-first interactions, low-friction edits, and deterministic layout help the canvas keep up with thought.",
    Icon: KeyboardIcon,
  },
  {
    title: "Trust by default",
    copy: "Private-by-default documents, revocable sharing, and clean exports support both personal and collaborative work.",
    Icon: LockIcon,
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
          <ul className="landing-proof-line" aria-label="Highlights">
            <li>Light and dark themes</li>
            <li>Keyboard first</li>
            <li>Private by default</li>
          </ul>
        </div>

        <figure className="landing-demo">
          <LandingPreview />
          <figcaption>
            <span>Live sync</span>
            Markdown and the map update each other as you type.
          </figcaption>
        </figure>
      </section>

      <section
        className="landing-quality"
        aria-labelledby="quality-title"
      >
        <header>
          <p className="landing-eyebrow">Built to feel premium at every touchpoint</p>
          <h2 id="quality-title">Craft, speed, and trust in one focused flow.</h2>
        </header>
        <div className="landing-quality-grid">
          {qualityPillars.map(({ title, copy, Icon }) => (
            <article key={title}>
              <span className="landing-icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
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
          {features.map(({ number, title, copy, Icon }) => (
            <article key={number}>
              <span className="landing-icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              <h3>
                <small>{number}</small>
                {title}
              </h3>
              <p>{copy}</p>
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
