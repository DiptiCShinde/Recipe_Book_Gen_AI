import { useState } from 'react'
import './App.css'

function App() {
  const [ingredients, setIngredients] = useState('')
  const [message, setMessage] = useState('')

  function handleExplore() {
  const ingredientList = ingredients
    .split(',')
    .map((ingredient) => ingredient.trim())
    .filter((ingredient) => ingredient !== '')

  if (ingredientList.length === 0) {
    setMessage('Please enter an ingredient first.')
    return
  }

  setMessage(`Great! We’ll find ideas using ${ingredientList.join(', ')}.`)
}

  return (
    <div className="page">
      <header>
        <a href="/">What’s in Your Kitchen?</a>
        <nav>
          <a href="#how-it-works">How it works</a>
        </nav>
      </header>

      <main>
        <section>
          <p>A little inspiration for your kitchen</p>
          <h1>Good food starts with what you have.</h1>
          <p>
            Tell us what’s in your kitchen, and discover what you can cook.
          </p>

          <label htmlFor="ingredients">What ingredients do you have?</label>
          <input
            id="ingredients"
            name="ingredients"
            type="text"
            placeholder="e.g. tomatoes, rice, eggs"
            value={ingredients}
            onChange={(event) => setIngredients(event.target.value)}
          />

          <button type="button" onClick={handleExplore}>
            Explore recipe ideas
          </button>

          {message && <p role="status">{message}</p>}
        </section>

        <section id="how-it-works">
          <h2>From ingredients to inspiration</h2>
          <p>Start with what you have. We’ll help you imagine the rest.</p>
        </section>
      </main>
    </div>
  )
}

export default App