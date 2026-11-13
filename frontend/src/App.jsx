import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [ingredients, setIngredients] = useState('')
  const [message, setMessage] = useState('')
  const [ingredientItems, setIngredientItems] = useState([])
  const [apiMessage, setApiMessage] = useState('Checking backend...')
  const [recipe, setRecipe] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [dietaryPreference, setDietaryPreference] = useState('')
  const [cuisineStyle, setCuisineStyle] = useState('any')
  const [authToken, setAuthToken] = useState(
    () => sessionStorage.getItem('recipegen_token') || '',
  )
  const [userName, setUserName] = useState(
    () => sessionStorage.getItem('recipegen_display_name') || '',
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginMessage, setLoginMessage] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [savedRecipes, setSavedRecipes] = useState([])
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false)
  const [showSavedRecipes, setShowSavedRecipes] = useState(false)
  const [historyMessage, setHistoryMessage] = useState('')

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/health')
      .then((response) => response.json())
      .then((data) => setApiMessage(data.message))
      .catch(() => setApiMessage('Could not connect to the backend'))
  }, [])

  async function handleLogin(event) {
    event.preventDefault()
    setLoginMessage('')
    setIsLoggingIn(true)

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Sign-in failed. Please try again.')
      }

      sessionStorage.setItem('recipegen_token', data.access_token)
      sessionStorage.setItem('recipegen_display_name', data.display_name)
      setAuthToken(data.access_token)
      setUserName(data.display_name)
      setPassword('')
    } catch (error) {
      setLoginMessage(error.message)
    } finally {
      setIsLoggingIn(false)
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('recipegen_token')
    sessionStorage.removeItem('recipegen_display_name')
    setAuthToken('')
    setUserName('')
    setEmail('')
    setPassword('')
    setLoginMessage('')
  }

  async function handleShowRecipes() {
  // If the history is already open, close it.
  if (showSavedRecipes) {
    setShowSavedRecipes(false)
    return
  }

  setShowSavedRecipes(true)
  setIsLoadingRecipes(true)
  setHistoryMessage('')

  try {
    const response = await fetch(
      'http://127.0.0.1:8000/api/users/me/recipes',
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        typeof data.detail === 'string'
          ? data.detail
          : 'Could not load your saved recipes.',
      )
    }

    setSavedRecipes(data)

    if (data.length === 0) {
      setHistoryMessage('You have no saved recipes yet.')
    }
  } catch (error) {
    setHistoryMessage(
      error instanceof TypeError
        ? 'Could not connect to the backend. Check that it is running.'
        : error.message,
    )
  } finally {
    setIsLoadingRecipes(false)
  }
}

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
    setRecipe(null)
    setIsLoading(true)

    try {
      const response = await fetch('http://127.0.0.1:8000/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients: ingredientList,
          dietary_preference: dietaryPreference || 'none',
          cuisine_style: cuisineStyle,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Recipe generation failed. Please try again.',
        )
      }

      // Show the recipe as soon as generation succeeds.
      setRecipe(data)

      // If signed in, also save the recipe to this user's history.
      if (authToken) {
        try {
          const saveResponse = await fetch(
            'http://127.0.0.1:8000/api/users/me/recipes',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                input_ingredients: ingredientList,
                dietary_preference: dietaryPreference || 'none',
                cuisine_style: cuisineStyle,
                recipe: data,
              }),
            },
          )

          if (!saveResponse.ok) {
            setMessage(
              'Recipe generated, but it could not be saved to your profile.',
            )
          } else {
            setMessage('Recipe saved to your profile.')
          }
        } catch {
          setMessage(
            'Recipe generated, but it could not be saved to your profile.',
          )
        }
      } else {
        setMessage('Recipe generated. Sign in to save it to your profile.')
      }
    } catch (error) {
      const errorMessage =
        error instanceof TypeError
          ? 'Could not connect to the backend. Check that it is running.'
          : error.message

      setMessage(errorMessage)
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
        {authToken ? (
          <div className="account-panel">
            <p>Signed in as {userName}</p>
            <button type="button" onClick={handleLogout}>
              Sign out
            </button>
            <button type="button" onClick={handleShowRecipes}>
              {showSavedRecipes ? 'Hide my recipes' : 'My recipes'}
            </button>
          </div>
        ) : (
          <form className="account-panel" onSubmit={handleLogin}>
            <h2>Sign in to your recipe profile</h2>

            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <button type="submit" disabled={isLoggingIn}>
              {isLoggingIn ? 'Signing in…' : 'Sign in'}
            </button>

            {loginMessage && <p role="status">{loginMessage}</p>}
          </form>
        )}

        {authToken && showSavedRecipes && (
  <section className="saved-recipes">
    <h2>My saved recipes</h2>
    <button
      type="button"
      onClick={() => setShowSavedRecipes(false)}
    >
      Back to recipe generator
    </button>

    {isLoadingRecipes ? (
      <p>Loading your recipes...</p>
    ) : historyMessage ? (
      <p role="status">{historyMessage}</p>
    ) : (
      savedRecipes.map((savedRecipe) => (
        <article className="recipe-card" key={savedRecipe.id}>
          <p className="recipe-card-label">SAVED RECIPE</p>
          <h3>{savedRecipe.name}</h3>

          <p>
            <strong>Ingredients:</strong>{' '}
            {savedRecipe.recipe.ingredients.join(', ')}
          </p>
          <p>
            <strong>Time:</strong> {savedRecipe.recipe.prep_time_minutes} minutes
          </p>

          <h4>How to make it</h4>
          <ol>
            {savedRecipe.recipe.instructions.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </article>
      ))
    )}
  </section>
)}
        <p className="api-status" hidden={showSavedRecipes}>Backend: {apiMessage}</p>

        <section className="hero-section" hidden={showSavedRecipes}>
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

          <label htmlFor="dietary-preference">Dietary preference</label>
          <select
            id="dietary-preference"
            value={dietaryPreference}
            onChange={(event) => setDietaryPreference(event.target.value)}
          >
            <option value="">No preference</option>
            <option value="Vegetarian">Vegetarian</option>
            <option value="Non-Vegetarian">Non-Vegetarian</option>
            <option value="Vegan">Vegan</option>
          </select>

          <label htmlFor="cuisine-style">Cuisine style</label>
          <select
            id="cuisine-style"
            value={cuisineStyle}
            onChange={(event) => setCuisineStyle(event.target.value)}
          >
            <option value="any">Any style</option>
            <option value="Indian">Indian</option>
            <option value="Italian">Italian</option>
            <option value="Mexican">Mexican</option>
          </select>

          <button
            type="button"
            onClick={handleExplore}
            disabled={isLoading}
          >
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
                  <p className="recipe-card-label">AI GENERATED RECIPE</p>
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

        <section id="how-it-works" hidden={showSavedRecipes}>
          <h2>From ingredients to inspiration</h2>
          <p>Start with what you have. We’ll help you imagine the rest.</p>
        </section>
      </main>
    </div>
  )
}

export default App
