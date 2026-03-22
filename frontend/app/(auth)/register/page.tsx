import { RegisterForm } from "@/features/auth/components/RegisterForm";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <>
      <style>{`
        

        .regi {
          --bg:      #0C0C0C;
          --border:  #222222;
          --text:    #EDE8DE;
          --muted:   #4A4A4A;
          --accent:  #C8813A;
          --light:   #F7F3EE;
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
          font-family: var(--font-jetbrains-mono), monospace;
        }

        /* ── Left branded panel ── */
        .regi-panel {
          background: var(--bg);
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 2.5rem;
          overflow: hidden;
        }

        .regi-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 52px 52px;
          opacity: 0.35;
          pointer-events: none;
        }

        .regi-ghost {
          position: absolute;
          bottom: -1.5rem;
          left: -0.5rem;
          font-family: var(--font-libre-baskerville), serif;
          font-style: italic;
          font-weight: 700;
          font-size: clamp(6rem, 12vw, 11rem);
          line-height: 1;
          letter-spacing: -0.04em;
          color: transparent;
          -webkit-text-stroke: 1px #222222;
          user-select: none;
          pointer-events: none;
          z-index: 0;
          white-space: nowrap;
        }

        .regi-panel-top,
        .regi-panel-bottom {
          position: relative;
          z-index: 1;
        }

        .regi-logo {
          font-family: var(--font-libre-baskerville), serif;
          font-style: italic;
          font-size: 1.15rem;
          color: var(--text);
          text-decoration: none;
          letter-spacing: -0.02em;
        }

        .regi-tagline {
          border-left: 2px solid var(--accent);
          padding-left: 1rem;
          margin-bottom: 3rem;
        }

        .regi-tagline-text {
          font-size: 0.72rem;
          color: var(--muted);
          line-height: 1.8;
          font-weight: 300;
          max-width: 28ch;
        }

        .regi-back {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.62rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          text-decoration: none;
          transition: color 0.15s;
          margin-top: 0.75rem;
        }

        .regi-back:hover { color: var(--text); }

        /* ── Right form panel ── */
        .regi-form-side {
          background: var(--light);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 2.5rem;
          min-height: 100vh;
        }

        .regi-form-wrap {
          width: 100%;
          max-width: 400px;
        }

        .regi-form-header {
          margin-bottom: 2.25rem;
        }

        .regi-form-eyebrow {
          font-size: 0.6rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 0.6rem;
        }

        .regi-form-title {
          font-family: var(--font-libre-baskerville), serif;
          font-size: 1.65rem;
          font-weight: 700;
          color: #0C0C0C;
          letter-spacing: -0.025em;
          line-height: 1.2;
        }

        .regi-form-wrap .rounded-lg {
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
          padding: 0 !important;
        }

        .regi-form-wrap .p-6 {
          padding: 0 !important;
        }

        .regi-form-wrap [class*="CardHeader"],
        .regi-form-wrap [class*="CardTitle"],
        .regi-form-wrap [class*="CardDescription"] {
          display: none !important;
        }

        .regi-form-wrap [class*="CardFooter"] {
          padding: 0 !important;
          margin-top: 1.25rem !important;
          justify-content: flex-start !important;
        }

        @media (max-width: 720px) {
          .regi { grid-template-columns: 1fr; }
          .regi-panel { display: none; }
          .regi-form-side { padding: 3rem 1.5rem; }
        }
      `}</style>

      <div className="regi">
        <div className="regi-panel">
          <div className="regi-panel-top">
            <Link href="/" className="regi-logo">Stack</Link>
          </div>
          <div className="regi-panel-bottom">
            <div className="regi-tagline">
              <p className="regi-tagline-text">
                Start building in minutes, not days. Your stack is already configured.
              </p>
            </div>
            <Link href="/" className="regi-back">← Back to home</Link>
          </div>
          <div className="regi-ghost" aria-hidden="true">Stack</div>
        </div>

        <div className="regi-form-side">
          <div className="regi-form-wrap">
            <div className="regi-form-header">
              <div className="regi-form-eyebrow">Get started</div>
              <h1 className="regi-form-title">Create your account</h1>
            </div>
            <RegisterForm />
          </div>
        </div>
      </div>
    </>
  );
}