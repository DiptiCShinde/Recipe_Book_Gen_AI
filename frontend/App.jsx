const ideas = [
  { icon: '🥬', label: 'Use what you have', detail: 'Start with ingredients already in your kitchen.' },
  { icon: '✨', label: 'Make it your own', detail: 'Choose a cuisine, mood, or dietary preference.' },
  { icon: '🍽️', label: 'Cook something lovely', detail: 'Get a recipe that fits your day.' },
]

function App() {
  return (
    <main className="page-shell">
      <nav className="topbar" aria-label="Main navigation">
        <a className="brand" href="#home" aria-label="RecipeGen home">
          <span className="brand-mark" aria-hidden="true">r.</span>
          <span>recipegen</span>
        </a>
        <a className="nav-link" href="#how-it-works">How it works <span aria-hidden="true">↗</span></a>
      </nav>

      <section className="hero" id="home" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="sparkle">✳</span> A little inspiration for your kitchen</p>
          <h1 id="hero-title">Good food starts<br />with <em>what you have.</em></h1>
          <p className="hero-description">Tell us what’s in your fridge. We’ll help you turn it into something worth gathering around.</p>
          <a className="primary-button" href="#how-it-works">Let’s find your next meal <span aria-hidden="true">→</span></a>
          <p className="quiet-note"><span aria-hidden="true">♡</span> Less waste, more wonderful dinners.</p>
        </div>

        <div className="food-art" role="img" aria-label="Illustration of a bowl of fresh ingredients">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <span className="ingredient tomato">🍅</span>
          <span className="ingredient leaf">🥬</span>
          <span className="ingredient lemon">🍋</span>
          <span className="ingredient herb">🌿</span>
          <div className="bowl"><span>🥗</span></div>
          <div className="art-caption"><span className="caption-dot" /> Made for your kitchen</div>
        </div>
      </section>

      <section className="intro-row" id="how-it-works" aria-labelledby="intro-title">
        <div>
          <p className="eyebrow section-label">A fresh take on “what’s for dinner?”</p>
          <h2 id="intro-title">Your ingredients.<br /><em>A little imagination.</em></h2>
        </div>
        <p className="intro-copy">No complicated planning. No special trip to the store. Just a helpful nudge toward a meal you’ll love.</p>
      </section>

      <section className="steps" aria-label="How RecipeGen works">
        {ideas.map((idea, index) => (
          <article className="step-card" key={idea.label}>
            <div className="step-top"><span className="step-number">0{index + 1}</span><span className="step-icon" aria-hidden="true">{idea.icon}</span></div>
            <h3>{idea.label}</h3>
            <p>{idea.detail}</p>
          </article>
        ))}
      </section>

      <footer className="footer"><a className="brand footer-brand" href="#home"><span className="brand-mark">r.</span><span>recipegen</span></a><span>Made for the joy of figuring it out.</span></footer>
    </main>
  )
}

export default App
