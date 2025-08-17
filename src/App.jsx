import { useState } from 'react'
import MainMenu from './pages/MainMenu/MainMenu.jsx'
import './App.css'

function App() {
  const [gameState, setGameState] = useState('mainMenu')

  const renderCurrentScreen = () => {
    switch (gameState) {
      case 'mainMenu':
        return <MainMenu onStartGame={() => setGameState('game')} />
      case 'game':
        return <div>Game Screen - Coming Soon!</div>
      default:
        return <MainMenu onStartGame={() => setGameState('game')} />
    }
  }

  return (
    <div className="app-container">
      {renderCurrentScreen()}
    </div>
  )
}

export default App
