import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-sparkle" aria-hidden="true">
              ✳
            </span>
            SMALL STEPS. REAL MOMENTUM.
          </div>
          <h1>
            Make space for
            <br />
            <span>your next</span> good day.
          </h1>
          <p className="hero-description">
            A calmer way to build habits that last. Choose what matters, take one small step, and
            let the progress add up.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/login">
              Start your journey <span aria-hidden="true">→</span>
            </Link>
            <a className="text-link" href="#how-it-works">
              See how it works <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="social-proof">
            <div className="avatar-stack" aria-hidden="true">
              <span>J</span>
              <span>M</span>
              <span>A</span>
              <span>K</span>
            </div>
            <p>
              <strong>A little progress, every day.</strong>
              <br />
              Your pace. Your priorities.
            </p>
          </div>
        </div>

        <div className="hero-art" aria-label="A preview of a weekly habit tracker">
          <div className="art-orbit art-orbit-one" />
          <div className="art-orbit art-orbit-two" />
          <div className="sun-shape" />
          <div className="floating-note note-top">
            <span className="note-icon note-icon-green" aria-hidden="true">
              ✓
            </span>
            <span>
              <strong>One step at a time</strong>
              <small>That’s how it sticks</small>
            </span>
          </div>
          <div className="tracker-card">
            <div className="tracker-topline">
              <div>
                <span className="tracker-kicker">YOUR WEEK</span>
                <h2>A good rhythm</h2>
              </div>
              <span className="tracker-menu" aria-hidden="true">
                ···
              </span>
            </div>
            <div className="streak-box">
              <span className="streak-flame" aria-hidden="true">
                ✳
              </span>
              <div>
                <strong>4 days</strong>
                <small>showing up for yourself</small>
              </div>
              <span className="streak-arrow" aria-hidden="true">
                ↗
              </span>
            </div>
            <div className="week-grid">
              {[
                ['M', true],
                ['T', true],
                ['W', true],
                ['T', true],
                ['F', false],
                ['S', false],
                ['S', false],
              ].map(([day, done], index) => (
                <div className="week-day" key={`${day}-${index}`}>
                  <span>{day}</span>
                  <i className={done ? 'day-dot day-dot--done' : 'day-dot'}>{done ? '✓' : ''}</i>
                </div>
              ))}
            </div>
            <div className="tracker-footer">
              <span className="footer-dot" />
              You’re building something good
            </div>
          </div>
          <div className="floating-note note-bottom">
            <span className="note-icon note-icon-lilac" aria-hidden="true">
              ✦
            </span>
            <span>
              <strong>Progress, not pressure</strong>
              <small>Every day counts</small>
            </span>
          </div>
        </div>
      </section>

      <section className="values-strip" id="benefits" aria-label="Daymark benefits">
        <p>MADE FOR REAL LIFE</p>
        <span>
          <i>01</i> Gentle by design
        </span>
        <span>
          <i>02</i> Focus on what matters
        </span>
        <span>
          <i>03</i> Progress you can feel
        </span>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="how-heading">
          <span className="section-label">A FRESH START, YOUR WAY</span>
          <h2>
            Good things grow
            <br />
            from small beginnings.
          </h2>
        </div>
        <div className="steps-grid">
          <article className="step-card">
            <span className="step-number">01</span>
            <h3>Pick your focus</h3>
            <p>Choose the part of life you’d like to give a little more attention.</p>
          </article>
          <article className="step-card">
            <span className="step-number">02</span>
            <h3>Keep it small</h3>
            <p>Set an easy, meaningful action that feels doable in your real day.</p>
          </article>
          <article className="step-card">
            <span className="step-number">03</span>
            <h3>Notice the change</h3>
            <p>Celebrate showing up. Your steady effort is where the magic lives.</p>
          </article>
        </div>
      </section>

      <footer className="site-footer">
        <Link className="brand brand-footer" to="/">
          <span className="brand-mark" aria-hidden="true">
            ✓
          </span>
          <span>daymark</span>
        </Link>
        <span>A little progress goes a long way.</span>
      </footer>
    </main>
  );
}

export default HomePage;
