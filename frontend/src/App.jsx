import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [ingredients, setIngredients] = useState('')
  const [message, setMessage] = useState('')
  const [ingredientItems, setIngredientItems] = useState([])
  const [apiMessage, setApiMessage] = useState('Checking backend...')
  const [recipe, setRecipe] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/health')
      .then((response) => response.json())
      .then((data) => setApiMessage(data.message))
      .catch(() => setApiMessage('Could not connect to the backend'))
  }, [])

    async function handleExplore() {
    const ingredientList = ingredients
      .split(',')
      .map((ingredient) => ingredient.trim())
      .filter((ingredient) => ingredient !== '')

    if (ingredientList.length === 0) {
      setMessage('Please enter an ingredient first.')
      setIngredientItems([])
      setRecipe(null)
      return
    }

    setMessage('')
    setIngredientItems(ingredientList)
    setIsLoading(true)

    try {
      const response = await fetch('http://127.0.0.1:8000/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredients: ingredientList }),
      })

      if (!response.ok) {
        throw new Error('Recipe request failed')
      }

      const data = await response.json()
      setRecipe(data)
    } catch {
      setMessage('Could not connect to the backend. Check that it is running.')
      setRecipe(null)
    } finally {
      setIsLoading(false)
    }
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
        <p className="api-status">Backend: {apiMessage}</p>

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

          <button type="button" onClick={handleExplore}
          disabled={isLoading}>
            {isLoading ? 'Finding a recipe...' : 'Explore recipe ideas'}
            
          </button>

          {message && <p role="status">{message}</p>}

          {ingredientItems.length > 0 && (
            <>
              <ul className="ingredient-list">
                {ingredientItems.map((ingredient, index) => (
                  <li key={index}>{ingredient}</li>
                ))}
              </ul>

              {recipe && (
                <article className="recipe-card">
                  <p className="recipe-card-label">SAMPLE RECIPE IDEA</p>
                  <h2>{recipe.name}</h2>

                  <p>
                    <strong>Ingredients:</strong>{' '}
                    {recipe.ingredients.join(', ')}
                  </p>
                  <p>
                    <strong>Time:</strong> {recipe.prep_time_minutes} minutes
                  </p>

                  <h3>How to make it</h3>
                  <ol>
                    {recipe.instructions.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </article>
              )}
            </>
          )}
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