import { Outlet } from 'react-router-dom'

function App() {
  return (
    <div>
      <header>
        <h1>SUG Digital</h1>
        <p>Federal University Dutse</p>
      </header>

      <Outlet />
    </div>
  )
}

export default App