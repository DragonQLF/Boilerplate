import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <>
      <style>{`
        

        .logi {
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

        .logi-panel {
          background: var(--bg);
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 2.5rem;
          overflow: hidden;
        }

        .logi-panel::before {
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

        .logi-ghost {
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

        .logi-panel-top,
        .logi-panel-bottom {
          position: relative;
          z-index: 1;
        }

        .logi-logo {
          font-family: var(--font-libre-baskerville), serif;
          font-style: italic;
          font-size: 1.15rem;
          color: var(--text);
          text-decoration: none;
          letter-spacing: -0.02em;
        }

        .logi-tagline {
          border-left: 2px solid var(--accent);
          padding-left: 1rem;
          margin-bottom: 3rem;
        }

        .logi-tagline-text {
          font-size: 0.72rem;
          color: var(--muted);
          line-height: 1.8;
          font-weight: 300;
          max-width: 28ch;
        }

        .logi-back {
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

        .logi-back:hover { color: var(--text); }

        .logi-form-side {
          background: var(--light);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 2.5rem;
          min-height: 100vh;
        }

        .logi-form-wrap {
          width: 100%;
          max-width: 400px;
        }

        .logi-form-header {
          margin-bottom: 2.25rem;
        }

        .logi-form-eyebrow {
          font-size: 0.6rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 0.6rem;
        }

        .logi-form-title {
          font-family: var(--font-libre-baskerville), serif;
          font-size: 1.65rem;
          font-weight: 700;
          color: #0C0C0C;
          letter-spacing: -0.025em;
          line-height: 1.2;
        }

        .logi-form-wrap .rounded-lg {
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
          padding: 0 !important;
        }

        .logi-form-wrap .p-6 {
          padding: 0 !important;
        }

        @media (max-width: 720px) {
          .logi { grid-template-columns: 1fr; }
          .logi-panel { display: none; }
          .logi-form-side { padding: 3rem 1.5rem; }
        }
      `}</style>

      <div className="logi">
        <div className="logi-panel">
          <div className="logi-panel-top">
            <Link href="/" className="logi-logo">
              Stack
            </Link>
          </div>
          <div className="logi-panel-bottom">
            <div className="logi-tagline">
              <p className="logi-tagline-text">
                Everything you need to build production-quality software, assembled and ready to
                ship.
              </p>
            </div>
            <Link href="/login" className="logi-back">
              ← Back to sign in
            </Link>
          </div>
          <div className="logi-ghost" aria-hidden="true">
            Stack
          </div>
        </div>

        <div className="logi-form-side">
          <div className="logi-form-wrap">
            <div className="logi-form-header">
              <div className="logi-form-eyebrow">Account recovery</div>
              <h1 className="logi-form-title">Choose a new password</h1>
            </div>
            {/* Suspense required because ResetPasswordForm uses useSearchParams */}
            <Suspense fallback={null}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
