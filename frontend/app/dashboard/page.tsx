"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/features/auth/hooks/useSession";
import { authClient } from "@/features/auth/lib/auth-client";

const nextSteps = [
  {
    step: "01",
    title: "Add your first feature",
    desc: "Create a new folder under backend/src/features/ with routes, controller, service, and validation.",
    href: "#",
  },
  {
    step: "02",
    title: "Extend the Prisma schema",
    desc: "Add your domain models to backend/prisma/schema.prisma and run npm run db:migrate.",
    href: "#",
  },
  {
    step: "03",
    title: "Build your UI",
    desc: "Add pages under frontend/app/ and feature components under frontend/features/. Use shadcn/ui for primitives.",
    href: "#",
  },
];

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: "#C8813A",
        color: "#0C0C0C",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: "0.7rem",
        fontFamily: "var(--font-jetbrains-mono), monospace",
        letterSpacing: "0.05em",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useSession();

  // Redirect to login if the session resolves as empty (expired, revoked, or invalid cookie).
  // proxy.ts blocks unauthenticated requests before the page loads, but this covers
  // sessions that expire while the user is already on the page.
  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [isLoading, user, router]);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
  }

  if (isLoading) {
    return (
      <>
        <style>{`
          
          .dash-loader {
            background: #0C0C0C; min-height: 100vh;
            display: flex; align-items: center; justify-content: center;
            font-family: var(--font-jetbrains-mono), monospace;
            font-size: 0.68rem; letter-spacing: 0.18em;
            text-transform: uppercase; color: #4E4E4E;
          }
          @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
          .dash-loader span { animation: pulse 1.4s ease infinite; }
        `}</style>
        <div className="dash-loader">
          <span>Loading&hellip;</span>
        </div>
      </>
    );
  }

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <style>{`
        

        .dash {
          --bg:      #0C0C0C;
          --surface: #111111;
          --border:  #1E1E1E;
          --text:    #EDE8DE;
          --muted:   #4A4A4A;
          --accent:  #C8813A;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          font-family: var(--font-jetbrains-mono), monospace;
        }

        /* Nav */
        .dash-nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 2.5rem; height: 56px;
          border-bottom: 1px solid var(--border);
          position: sticky; top: 0; background: var(--bg); z-index: 10;
        }
        .dash-nav-left { display: flex; align-items: center; gap: 2rem; }
        .dash-logo {
          font-family: var(--font-libre-baskerville), serif; font-style: italic;
          font-size: 1.1rem; color: var(--text); text-decoration: none;
          letter-spacing: -0.02em;
        }
        .dash-breadcrumb {
          font-size: 0.62rem; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--muted); padding-left: 2rem; border-left: 1px solid var(--border);
        }
        .dash-nav-right { display: flex; align-items: center; gap: 1.25rem; }
        .dash-user-info { text-align: right; }
        .dash-user-name { font-size: 0.7rem; font-weight: 500; color: var(--text); }
        .dash-user-email { font-size: 0.6rem; color: var(--muted); margin-top: 0.1rem; }
        .dash-signout {
          padding: 0.45rem 1rem; border: 1px solid var(--border);
          background: transparent; color: var(--muted);
          font-family: var(--font-jetbrains-mono), monospace; font-size: 0.62rem;
          font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
          cursor: pointer; transition: all 0.15s;
        }
        .dash-signout:hover { border-color: var(--muted); color: var(--text); }

        /* Main */
        .dash-main {
          padding: 3.5rem 2.5rem; max-width: 900px; margin: 0 auto;
          animation: dash-up 0.5s ease both;
        }
        @keyframes dash-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Welcome */
        .dash-eyebrow {
          font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--accent); margin-bottom: 0.6rem;
        }
        .dash-h1 {
          font-family: var(--font-libre-baskerville), serif;
          font-size: clamp(1.75rem, 3vw, 2.4rem);
          font-weight: 700; letter-spacing: -0.03em;
          color: var(--text); margin: 0 0 0.5rem;
        }
        .dash-h1 em { font-style: italic; font-weight: 400; color: var(--accent); }
        .dash-sub {
          font-size: 0.72rem; color: var(--muted); font-weight: 300;
          margin-bottom: 0;
        }

        /* User card */
        .dash-profile {
          border: 1px solid var(--border); padding: 1.5rem 2rem;
          display: flex; align-items: center; gap: 1.5rem;
          margin: 2.5rem 0 3.5rem;
        }
        .dash-profile-avatar {
          width: 48px; height: 48px; border-radius: 50%;
          background: var(--accent); color: #0C0C0C;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.9rem; letter-spacing: 0.05em;
          flex-shrink: 0;
        }
        .dash-profile-name {
          font-family: var(--font-libre-baskerville), serif;
          font-size: 1.05rem; font-weight: 700; letter-spacing: -0.02em;
          margin-bottom: 0.2rem;
        }
        .dash-profile-email { font-size: 0.68rem; color: var(--muted); font-weight: 300; }
        .dash-profile-badge {
          margin-left: auto; font-size: 0.58rem; letter-spacing: 0.15em;
          text-transform: uppercase; color: var(--accent);
          border: 1px solid var(--accent); padding: 0.3rem 0.7rem;
          opacity: 0.7;
        }

        /* Next steps */
        .dash-section-label {
          font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--muted); margin-bottom: 1.25rem;
          display: flex; align-items: center; gap: 1rem;
        }
        .dash-section-label::after {
          content: ''; flex: 1; height: 1px; background: var(--border);
        }

        .dash-steps { display: flex; flex-direction: column; }
        .dash-step {
          display: grid; grid-template-columns: 3rem 1fr;
          gap: 1.25rem; padding: 1.5rem 0;
          border-bottom: 1px solid var(--border);
          transition: background 0.12s;
        }
        .dash-step:first-child { border-top: 1px solid var(--border); }
        .dash-step-num {
          font-family: var(--font-libre-baskerville), serif; font-style: italic;
          font-size: 1.5rem; font-weight: 400; color: var(--border);
          line-height: 1; padding-top: 0.1rem;
        }
        .dash-step-title {
          font-size: 0.8rem; font-weight: 700; color: var(--text);
          margin-bottom: 0.4rem; letter-spacing: 0.02em;
        }
        .dash-step-desc {
          font-size: 0.68rem; color: var(--muted); line-height: 1.75;
          font-weight: 300;
        }

        /* Responsive */
        @media (max-width: 720px) {
          .dash-nav   { padding: 0 1.25rem; }
          .dash-main  { padding: 2.5rem 1.25rem; }
          .dash-breadcrumb { display: none; }
          .dash-profile { flex-wrap: wrap; }
          .dash-profile-badge { margin-left: 0; }
        }
      `}</style>

      <div className="dash">
        <nav className="dash-nav">
          <div className="dash-nav-left">
            <a href="/" className="dash-logo">
              Stack
            </a>
            <span className="dash-breadcrumb">Dashboard</span>
          </div>
          <div className="dash-nav-right">
            <div className="dash-user-info">
              <div className="dash-user-name">{user?.name ?? "—"}</div>
              <div className="dash-user-email">{user?.email ?? "—"}</div>
            </div>
            {user && <Avatar name={user.name} />}
            <button className="dash-signout" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </nav>

        <main className="dash-main">
          <div className="dash-eyebrow">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
          <h1 className="dash-h1">
            {greeting}, <em>{firstName}.</em>
          </h1>
          <p className="dash-sub">You&apos;re in. Start building your application.</p>

          {/* Real user data */}
          <div className="dash-profile">
            <div className="dash-profile-avatar">{user && <Avatar name={user.name} />}</div>
            <div>
              <div className="dash-profile-name">{user?.name}</div>
              <div className="dash-profile-email">{user?.email}</div>
            </div>
            <div className="dash-profile-badge">Authenticated</div>
          </div>

          {/* Next steps */}
          <div className="dash-section-label">Next steps</div>
          <div className="dash-steps">
            {nextSteps.map((s) => (
              <div key={s.step} className="dash-step">
                <div className="dash-step-num">{s.step}</div>
                <div>
                  <div className="dash-step-title">{s.title}</div>
                  <div className="dash-step-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
