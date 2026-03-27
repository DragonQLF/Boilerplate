"use client";

import Link from "next/link";
import { useSession } from "@/features/auth/hooks/useSession";

const features = [
  {
    label: "01 / AUTH",
    name: "Better Auth",
    desc: "Email, password, OAuth, and session management. Production-ready security patterns included.",
  },
  {
    label: "02 / FRONTEND",
    name: "Next.js 16",
    desc: "App Router, Turbopack, Server Components. The latest and fastest Next.js has to offer.",
  },
  {
    label: "03 / BACKEND",
    name: "Express + Prisma",
    desc: "Battle-tested Express server with Prisma ORM and PostgreSQL. Type-safe from day one.",
  },
  {
    label: "04 / DEPLOY",
    name: "Docker Ready",
    desc: "Multi-stage Dockerfiles and compose files for dev and prod. One command to ship anywhere.",
  },
  {
    label: "05 / LANGUAGE",
    name: "TypeScript E2E",
    desc: "Full type safety across the entire stack. Strict mode, shared types, zero compromises.",
  },
  {
    label: "06 / UI",
    name: "shadcn/ui",
    desc: "Accessible, composable components built on Radix. Own your design system from the start.",
  },
];

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useSession();

  return (
    <>
      <style>{`
        .lp {
          --bg:      #0C0C0C;
          --surface: #141414;
          --border:  #222222;
          --text:    #EDE8DE;
          --muted:   #4E4E4E;
          --accent:  #C8813A;
          --accent2: #E0A05A;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          font-family: var(--font-jetbrains-mono), monospace;
          overflow-x: hidden;
        }

        /* Grain */
        .lp::after {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
        }

        .lp > * { position: relative; z-index: 1; }

        /* ── Nav ── */
        .lp-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 3rem;
          border-bottom: 1px solid var(--border);
        }

        .lp-logo {
          font-family: var(--font-libre-baskerville), serif;
          font-style: italic;
          font-size: 1.2rem;
          color: var(--text);
          text-decoration: none;
          letter-spacing: -0.02em;
        }

        .lp-nav-links {
          display: flex;
          gap: 2rem;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .lp-nav-links a {
          color: var(--muted);
          text-decoration: none;
          font-size: 0.68rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: color 0.15s;
        }

        .lp-nav-links a:hover { color: var(--text); }

        /* ── Hero ── */
        .lp-hero {
          padding: 9rem 3rem 7rem;
          max-width: 1080px;
          margin: 0 auto;
          animation: lp-up 0.65s ease both;
        }

        .lp-eyebrow {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-size: 0.62rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 2.5rem;
        }

        .lp-eyebrow::before {
          content: '';
          display: block;
          width: 2rem;
          height: 1px;
          background: var(--accent);
          flex-shrink: 0;
        }

        .lp-h1 {
          font-family: var(--font-libre-baskerville), serif;
          font-size: clamp(3.5rem, 6.5vw, 6rem);
          font-weight: 700;
          line-height: 1.06;
          letter-spacing: -0.035em;
          margin: 0 0 0.25rem;
          color: var(--text);
        }

        .lp-h1 em {
          font-style: italic;
          font-weight: 400;
          color: var(--accent);
        }

        .lp-sub {
          font-size: 0.82rem;
          color: var(--muted);
          max-width: 46ch;
          line-height: 1.85;
          margin: 2.5rem 0 3.5rem;
          font-weight: 300;
        }

        .lp-ctas {
          display: flex;
          gap: 0.875rem;
          flex-wrap: wrap;
        }

        .lp-btn-p, .lp-btn-s {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.8rem 1.75rem;
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.18s ease;
          cursor: pointer;
        }

        .lp-btn-p {
          background: var(--text);
          color: var(--bg);
        }

        .lp-btn-p:hover {
          background: var(--accent2);
          transform: translateY(-2px);
        }

        .lp-btn-s {
          border: 1px solid var(--border);
          color: var(--muted);
        }

        .lp-btn-s:hover {
          border-color: var(--muted);
          color: var(--text);
          transform: translateY(-2px);
        }

        /* ── Divider ── */
        .lp-rule {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 0 3rem;
          max-width: 1080px;
          margin: 0 auto;
          font-size: 0.6rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--muted);
          white-space: nowrap;
        }

        .lp-rule::before, .lp-rule::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        /* ── Features ── */
        .lp-features {
          padding: 4.5rem 3rem 6rem;
          max-width: 1080px;
          margin: 0 auto;
          animation: lp-up 0.65s 0.15s ease both;
        }

        .lp-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid var(--border);
          border-left: 1px solid var(--border);
        }

        .lp-card {
          padding: 2rem 1.75rem;
          border-right: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          transition: background 0.18s;
          cursor: default;
        }

        .lp-card:hover { background: var(--surface); }

        .lp-card-label {
          font-size: 0.58rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 1rem;
        }

        .lp-card-name {
          font-family: var(--font-libre-baskerville), serif;
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 0.6rem;
        }

        .lp-card-desc {
          font-size: 0.7rem;
          color: var(--muted);
          line-height: 1.85;
          font-weight: 300;
        }

        /* ── Footer ── */
        .lp-footer {
          border-top: 1px solid var(--border);
          padding: 1.75rem 3rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.62rem;
          color: var(--muted);
          letter-spacing: 0.06em;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .lp-nav  { padding: 1.25rem 1.25rem; }
          .lp-hero { padding: 5rem 1.25rem 4rem; }
          .lp-features { padding: 3rem 1.25rem 4rem; }
          .lp-rule { padding: 0 1.25rem; }
          .lp-footer { padding: 1.5rem 1.25rem; flex-direction: column; gap: 0.5rem; }
          .lp-grid { grid-template-columns: 1fr; }
        }

        @keyframes lp-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="lp">
        {/* Nav */}
        <nav className="lp-nav">
          <Link href="/" className="lp-logo">
            Stack
          </Link>
          <ul className="lp-nav-links">
            {!isLoading &&
              (isAuthenticated ? (
                <li>
                  <Link href="/dashboard">Dashboard →</Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link href="/login">Sign in</Link>
                  </li>
                  <li>
                    <Link href="/register">Register</Link>
                  </li>
                </>
              ))}
            <li>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                GitHub ↗
              </a>
            </li>
          </ul>
        </nav>

        {/* Hero */}
        <section className="lp-hero">
          <div className="lp-eyebrow">Full-stack boilerplate</div>
          <h1 className="lp-h1">
            Ship your idea,
            <br />
            <em>not the setup.</em>
          </h1>
          <p className="lp-sub">
            A production-ready foundation for serious applications. Authentication, database, API,
            and UI — assembled with precision so you can focus on what only you can build.
          </p>
          <div className="lp-ctas">
            <Link href="/register" className="lp-btn-p">
              Get started →
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="lp-btn-s"
            >
              View on GitHub ↗
            </a>
          </div>
        </section>

        <div className="lp-rule">What&apos;s included</div>

        {/* Features */}
        <section className="lp-features">
          <div className="lp-grid">
            {features.map((f) => (
              <div key={f.name} className="lp-card">
                <div className="lp-card-label">{f.label}</div>
                <div className="lp-card-name">{f.name}</div>
                <div className="lp-card-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="lp-footer">
          <span>Stack — Full-stack boilerplate</span>
          <span>Next.js 16 · Express · Prisma · Better Auth</span>
        </footer>
      </div>
    </>
  );
}
