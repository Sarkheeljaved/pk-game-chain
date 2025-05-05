import { BrowserRouter, Route, Routes } from 'react-router'
import './App.css'
import Home from './pages/Home.jsx'

function App() {

  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
    </BrowserRouter>
  )
}

export default App
