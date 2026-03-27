"use client";

import Link from "next/link";
import type { ReactNode } from "react";

interface CheckEmailProps {
  email: string;
  eyebrow?: string;
  title?: string;
  body?: string;
  hint?: ReactNode;
}

export function CheckEmail({
  email,
  eyebrow = "Almost there",
  title = "Check your inbox",
  body = "We sent a verification link to {email}. Click it to activate your account — the link expires in 24 hours.",
  hint,
}: CheckEmailProps) {
  return (
    <>
      <style>{`
        @keyframes check-email-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .check-email { animation: check-email-in 0.35s ease both; }
        .check-email-icon {
          width: 44px; height: 44px;
          border: 1px solid #C8813A;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 1.75rem;
          color: #C8813A; font-size: 1.1rem;
        }
        .check-email-eyebrow {
          font-size: 0.6rem; letter-spacing: 0.22em;
          text-transform: uppercase; color: #C8813A;
          margin-bottom: 0.6rem;
          font-family: 'JetBrains Mono', monospace;
        }
        .check-email-title {
          font-family: 'Libre Baskerville', serif;
          font-size: 1.65rem; font-weight: 700; color: #0C0C0C;
          letter-spacing: -0.025em; line-height: 1.2; margin-bottom: 1rem;
        }
        .check-email-body {
          font-size: 0.72rem; color: #4A4A4A; line-height: 1.85;
          font-weight: 300; font-family: 'JetBrains Mono', monospace;
          margin-bottom: 2rem;
        }
        .check-email-address { color: #0C0C0C; font-weight: 500; }
        .check-email-divider { border: none; border-top: 1px solid #E0DBD3; margin-bottom: 1.5rem; }
        .check-email-hint {
          font-size: 0.62rem; color: #4A4A4A; line-height: 1.7;
          font-family: 'JetBrains Mono', monospace; font-weight: 300;
        }
        .check-email-link {
          color: #0C0C0C; font-weight: 500;
          text-decoration: underline; text-underline-offset: 3px;
          cursor: pointer;
        }
      `}</style>
      <div className="check-email">
        <div className="check-email-icon">✉</div>
        <div className="check-email-eyebrow">{eyebrow}</div>
        <h2 className="check-email-title">{title}</h2>
        <p className="check-email-body">
          {(() => {
            const [before, after = ""] = body.split("{email}");
            return (
              <>
                {before}
                <span className="check-email-address">{email}</span>
                {after}
              </>
            );
          })()}
        </p>
        <hr className="check-email-divider" />
        <p className="check-email-hint">
          {hint ?? (
            <>
              Can&apos;t find it? Check your spam folder.
              <br />
              Already verified?{" "}
              <Link href="/login" className="check-email-link">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </>
  );
}
