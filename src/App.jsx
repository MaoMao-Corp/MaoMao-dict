import './App.css'
import React, {useEffect, useState} from 'react'
import Popup from './Popup'
function App() {
  const [selectedText, setSelectedText] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const handleTextSelect = () => {
    const selection = window.getSelection().toString();
    if (selection){
      setSelectedText(selection)
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }

  useEffect(()=>{
    document.addEventListener('selectionchange', handleTextSelect)
    return () => {
      document.removeEventListener('selectionchange',handleTextSelect)
    }
  }, [])

  return (
    <>
      <h1>Hola blud</h1>
      <Popup isOpen={isOpen} selectedText={selectedText}/>
    </>
  )
}

export default App
