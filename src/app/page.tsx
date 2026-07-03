import { TypeLoad } from "@/components/TypeLoad";
import { site, projects } from "@/lib/site.config";

/* Phase 1 — the recruiter-usable core. Semantic HTML, zero WebGL.
   This page IS the 2D fallback; the 3D pipeline mounts on top of it
   in Phase 2 without changing any content. (Governance §2: DOM-first) */

export default function Home() {
  return (
    <>
      <TypeLoad />

      <header className="header">
        <a href="#top" className="mono" style={{ color: "var(--text-hi)" }}>
          {site.name}
        </a>
        <nav aria-label="Primary">
          <a className="mono" href="/resume.pdf">
            Resume
          </a>
          <a
            className="mono"
            href={site.github}
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a className="mono" href="#verdict">
            Contact
          </a>
        </nav>
      </header>

      <main id="top" className="wrap pipeline">
        <span className="packet" aria-hidden="true" />

        {/* STAGE — CLAIM */}
        <section className="claim station" aria-labelledby="claim-h">
          <p className="mono">claim — received</p>
          <h1 id="claim-h" className="display">
            {site.name}
          </h1>
          <p className="role">{site.claim}</p>
          <p className="mono received">
            &gt; claim: production-grade engineer — verifying…
          </p>
          <div className="ctas">
            <a className="btn btn--primary" href="#verify">
              Verify the claim
            </a>
            <a className="btn" href="/resume.pdf">
              Resume
            </a>
            <a className="btn" href={site.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </section>

        {/* STAGE — VERIFY (evidence) */}
        <section id="verify" className="station" aria-labelledby="verify-h">
          <p className="mono">verify 01 — evidence</p>
          <h2 id="verify-h" className="display">
            Three systems. Real code.
          </h2>
          <div className="evidence-grid">
            {projects.map((p) => (
              <a
                key={p.slug}
                className="card"
                href={p.href}
                target="_blank"
                rel="noreferrer"
              >
                <p className="mono">{p.status}</p>
                <h3>{p.name}</h3>
                <p>{p.claim}</p>
                <p className="mono" style={{ textTransform: "none" }}>
                  {p.stack}
                </p>
                <span className="verify">verify on GitHub →</span>
              </a>
            ))}
          </div>
        </section>

        {/* STAGE — TELEMETRY */}
        <section className="station" aria-labelledby="live-h">
          <p className="mono">telemetry — live</p>
          <h2 id="live-h" className="display">
            Currently building
          </h2>
          <div className="telemetry">
            <div className="stat">
              <span className="mono">current project</span>
              <b>{site.currentProject}</b>
            </div>
            <div className="stat">
              <span className="mono">learning now</span>
              <b>{site.learningNow.join(" · ")}</b>
            </div>
            <div className="stat">
              <span className="mono">status</span>
              <b>
                {site.availability ? (
                  <>
                    <span className="dot" aria-hidden="true" />
                    open to SDE / AI engineering roles
                  </>
                ) : (
                  "heads-down building"
                )}
              </b>
            </div>
          </div>
        </section>

        {/* STAGE — VERDICT */}
        <section id="verdict" className="station" aria-labelledby="verdict-h">
          <p className="mono">verdict</p>
          <h2 id="verdict-h" className="display">
            Don&apos;t read the resume. Verify it.
          </h2>
          <p style={{ maxWidth: "68ch", color: "var(--text-lo)" }}>
            Every claim on this page links to running code, commit history,
            and tests. If something interests you, open the repo — the
            evidence is one click away. An interactive version of this
            pipeline is in development; the deployment timeline lives on
            GitHub.
          </p>
          <div className="ctas">
            <a className="btn btn--primary" href="/resume.pdf">
              Download resume
            </a>
            <a className="btn" href={site.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
            {site.linkedin ? (
              <a className="btn" href={site.linkedin} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            ) : null}
            {site.email ? (
              <a className="btn" href={`mailto:${site.email}`}>
                Email
              </a>
            ) : null}
          </div>
        </section>

        <footer className="footer">
          <span className="mono">
            designed &amp; engineered by {site.name}
          </span>
          <span className="mono">v0.1 · phase 1 · proof before motion</span>
        </footer>
      </main>
    </>
  );
}
