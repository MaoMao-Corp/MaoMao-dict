import React, { useState, useEffect } from "react";
import './Popup.css'

function Popup() {
  const [selectedText, setSelectedText] = useState("");
  const [contextSentence, setContextSentence] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [definition, setDefinition] = useState("Thinking...");

  useEffect(() => {
    const handleSelection = async () => {
      const selection = window.getSelection();
      const selectedWord = selection.toString().trim();

      if (selectedWord && !selectedWord.includes(" ")) {
        const range = selection.getRangeAt(0);
        const fullText = range.commonAncestorContainer.textContent;
        const sentence = extractSentence(fullText, range.startOffset);

        setSelectedText(selectedWord);
        setContextSentence(sentence);
        setIsVisible(true);

        const rect = range.getBoundingClientRect();
        setPosition({
          top: rect.top + window.scrollY, // esquina superior de la selección
          left: rect.right + window.scrollX, // esquina derecha
        });

        const definition = await fetchDefinition(selectedWord, sentence);
        setDefinition(definition);
      } else {
        setIsVisible(false)
        setDefinition("Thinking...")
        setSelectedText("")
        setContextSentence("")
      }
    };

    document.addEventListener("mouseup", handleSelection);
    return () => document.removeEventListener("mouseup", handleSelection);
  }, []);

  const extractSentence = (text, offset) => {
    let start = offset;
    let end = offset;
  
    while (start > 0 && !/[.!?]/.test(text[start - 1]) && text[start - 1] !== '\n') {
      start--;
    }
      while (end < text.length && !/[.!?]/.test(text[end]) && text[end] !== '\n') {
      end++;
    }
  
    return text.slice(start, end).trim();
  };
  

  const fetchDefinition = async (word, sentence) => {
    try {
      const response = await fetch("https://poop-up.onrender.com/define", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, sentence }),
      });
      const data = await response.json();
      return data.definition;
    } catch (error) {
      return "Error al obtener la definición.";
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className="popup-scroll"
      style={{
        ...popupStyle,
        top: position.top,
        left: position.left,
        transform: "translate(0, -100%)"  // Mueve el popup hacia arriba su altura completa
      }}
    >
      <h2 className="word">{selectedText}</h2>
      <p className="sentence" style={{ fontStyle: "italic", color: "#888" }}>{contextSentence}</p>
      <p className="definition">{definition}</p>
    </div>
  );
}

const popupStyle = {
  position: "absolute",
  backgroundColor: "#212121",
  
  border: "3px solid #313131",
  borderRadius: "21px 21px 21px 0px",
  boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",

  zIndex: "1000",
  fontSize: "12px",

  maxWidth: "300px",
  maxHeight: "140px",

  overflowY:"auto",

  paddingRight: "15px",
  padding: "10px"
};

export default Popup;
