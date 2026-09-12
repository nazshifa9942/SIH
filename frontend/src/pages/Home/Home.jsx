import React from 'react';
import { Anchor, BarChart3, Check, FileText, Menu, ShieldCheck, Ship, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './home.css';

const capabilities = [
  ['Forecast-led planning', 'chart'],
  ['Vessel and port intelligence', 'ship'],
  ['Risk-aware recommendations', 'shield'],
  ['Role-based access', 'file'],
];

const workflow = [
  ['01', 'Register cargo demand', 'Capture commodity, volume, origin, destination, and delivery requirements.'],
  ['02', 'Read the market', 'Combine forecast signals, freight conditions, and relevant economic indicators.'],
  ['03', 'Evaluate the fleet', 'Match vessel availability, route feasibility, timing, and operating constraints.'],
  ['04', 'Act with confidence', 'Compare recommendations, risk, cost, and contract strategy before commitment.'],
];

const systemCapabilities = [
  ['Freight forecasting', 'Turn market movement into a practical planning signal for procurement teams.', BarChart3],
  ['Vessel chartering', 'Assess vessel and port conditions against the needs of each cargo request.', Ship],
  ['Risk-aware decisions', 'Bring delivery, market, operational, and commercial risks into one view.', ShieldCheck],
  ['Decision records', 'Carry analysis from the initial request through recommendation and reporting.', FileText],
];

function BrandMark() {
  return (
    <span className="home-brand-mark" aria-hidden="true">
      <Anchor size={24} strokeWidth={1.7} />
      <span className="home-tricolor" />
    </span>
  );
}

export function Home() {
  return (
    <div className="home-page">
      <a className="home-skip-link" href="#home-main">Skip to content</a>
      <div className="home-government-bar">
        <div className="home-container home-government-inner">
          <span>Government of India · Ministry of Ports, Shipping &amp; Waterways</span>
          <nav aria-label="Utility navigation">
            <a href="#home-main">Skip to content</a>
            <a href="#home-footer">Accessibility</a>
            <span>English</span>
          </nav>
        </div>
      </div>

      <header className="home-header">
        <div className="home-container home-header-inner">
          <Link className="home-identity" to="/home" aria-label="Maritime Decision Support home">
            <BrandMark />
            <span className="home-identity-copy">
              <span className="home-eyebrow">Official portal</span>
              <strong>Maritime Decision Support</strong>
              <small>NAVSETU freight and chartering system</small>
            </span>
          </Link>
          <button className="home-menu-button" type="button" aria-label="Open navigation">
            <Menu size={20} />
          </button>
          <nav className="home-main-nav" aria-label="Main navigation">
            <a className="is-active" href="#home-main">About the system</a>
            <a href="#workflow">Workflow</a>
            <Link className="home-navy-button" to="/login">Sign in to portal</Link>
          </nav>
        </div>
      </header>

      <main id="home-main">
        <section className="home-hero home-container" aria-labelledby="hero-title">
          <div className="home-hero-intro">
            <p className="home-kicker"><span />NAVSETU NATIONAL MARITIME OPERATIONS</p>
            <h1 id="hero-title">Better freight decisions, from forecast to charter.</h1>
            <p className="home-hero-description">A decision-support system for procurement and logistics teams managing cargo movement, vessel selection, market uncertainty, and delivery commitments.</p>
            <div className="home-actions">
              <Link className="home-orange-button" to="/login">Enter the command portal <ArrowRight size={17} /></Link>
              <a className="home-text-action" href="#workflow">See how it works <ArrowRight size={16} /></a>
            </div>
          </div>
          <aside className="home-operating-picture" aria-label="Operating picture">
            <p className="home-side-label">One operating picture</p>
            <h2>Align cargo requirements, market intelligence, fleet readiness, and risk in one accountable workflow.</h2>
            <div className="home-side-divider" />
            <p className="home-check-item"><Check size={16} />Designed for practical decisions by authorized government personnel.</p>
            <p className="home-check-item"><Check size={16} />Built around traceable analysis rather than isolated data points.</p>
          </aside>
        </section>

        <section className="home-capability-strip" aria-label="Portal capabilities">
          <div className="home-container home-strip-grid">
            {capabilities.map(([label]) => <div className="home-strip-item" key={label}><Check size={16} />{label}</div>)}
          </div>
        </section>

        <section className="home-light-section home-purpose" aria-labelledby="purpose-title">
          <div className="home-container home-two-column">
            <div><p className="home-section-label">Purpose</p><h2 id="purpose-title">A common operating view for maritime procurement.</h2></div>
            <div className="home-body-copy"><p>Freight and chartering decisions often depend on information spread across market signals, port conditions, vessel availability, and commercial constraints. This portal brings those inputs together so teams can move from a request to a defensible action with less friction.</p><p>The system supports the full decision cycle while keeping detailed operational work inside the authenticated command environment.</p></div>
          </div>
        </section>

        <section className="home-light-section home-workflow" id="workflow" aria-labelledby="workflow-title">
          <div className="home-container">
            <div className="home-section-heading"><div><p className="home-section-label">Decision workflow</p><h2 id="workflow-title">From requirement to recommendation</h2></div><p>A connected sequence that keeps every major decision factor in view.</p></div>
            <div className="home-workflow-grid">{workflow.map(([number, title, description]) => <article className="home-workflow-item" key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
          </div>
        </section>

        <section className="home-capabilities home-container" aria-labelledby="capabilities-title">
          <div><p className="home-section-label">System capabilities</p><h2 id="capabilities-title">Information that leads to action.</h2></div>
          <div className="home-system-grid">{systemCapabilities.map(([title, description, Icon]) => <article className="home-system-item" key={title}><Icon size={22} strokeWidth={1.6} /><h3>{title}</h3><p>{description}</p></article>)}</div>
        </section>

        <section className="home-access" aria-labelledby="access-title"><div className="home-container home-access-inner"><div><p className="home-section-label">Authorized access</p><h2 id="access-title">Continue to the maritime command portal.</h2><p>Access depends on your assigned government role and permissions.</p></div><Link className="home-white-button" to="/login">Sign in <ArrowRight size={16} /></Link></div></section>
      </main>

      <footer className="home-footer" id="home-footer"><div className="home-container"><div className="home-footer-top"><span>Ministry of Ports, Shipping &amp; Waterways</span><span>NAVSETU · Freight forecasting and vessel chartering decision support</span></div><div className="home-footer-bottom"><a href="#home-main">Accessibility</a><a href="mailto:portal-support@ship.gov.in">Portal support</a><span>Version 1.0</span></div></div></footer>
    </div>
  );
}