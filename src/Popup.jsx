import ReactMarkdown from "react-markdown";
import React, { useState, useEffect, useRef } from "react";
import './Popup.css';

function Popup() {
  const [selectedText, setSelectedText] = useState("");
  const [contextSentence, setContextSentence] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [definition, setDefinition] = useState("Thinking...");
  const [codeLang, setCodeLang] = useState("")
  // Creamos un ref para el popup
  const popupRef = useRef(null);

  useEffect(() => {
    const handleSelection = async (event) => {
      // Si el clic se hizo dentro del popup, no hacemos nada.
      if (popupRef.current && popupRef.current.contains(event.target)) {
        return;
      }

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
          top: rect.top + window.scrollY,
          left: rect.right + window.scrollX,
        });

        const def = await fetchDefinition(selectedWord, sentence);
        setDefinition(def);
      } else {
        setIsVisible(false);
        setDefinition("Thinking...");
        setSelectedText("");
        setContextSentence("");
        setCodeLang("")
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
      const response = await fetch("https://get-definition.onrender.com/define", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, sentence }),
      });
      const data = await response.json();
      setCodeLang(data.c)
      return data.d;
    } catch (error) {
      return "Error al obtener la definición.";
    }
  };

  const handleSound = async () => {
    if (!selectedText.trim()) return alert("Por favor, ingresa un texto");
  
    try {
      const response = await fetch("https://tts-back.onrender.com/tts/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedText, code:codeLang}),
      });
  
      const data = await response.json();
      if (data.audio) {
        // Convertir la cadena base64 a binario
        const binaryData = atob(data.audio); // Decodificar base64 a binario
        const arrayBuffer = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          arrayBuffer[i] = binaryData.charCodeAt(i);
        }
  
        const blob = new Blob([arrayBuffer], { type: "audio/mp3" });
        const url = URL.createObjectURL(blob);
  
        // Crear un objeto de audio y reproducirlo directamente
        const audio = new Audio(url);
        audio.play();
      }
    } catch (error) {
      console.error("Error al obtener el audio:", error);
    }
  };
  
  if (!isVisible) return null;

  return (
    <div
      ref={popupRef}  // Asignamos el ref al contenedor del popup
      className="popup-scroll"
      style={{
        ...popupStyle,
        top: position.top,
        left: position.left,
        transform: "translate(0, -100%)" // Mueve el popup hacia arriba su altura completa
      }}
    >
      <div className="popup-header">
        <h2 className="word">{selectedText}</h2>
        {codeLang && <img
          src="/speaker.png"
          alt="sound button"
          className="audio-button"
          onClick={handleSound}
        />}
      </div>
      <p className="sentence" style={{ fontStyle: "italic", color: "#888" }}>
        {contextSentence}
      </p>
      <ReactMarkdown className="definition">{definition}</ReactMarkdown>
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
  overflowY: "auto",
  paddingRight: "15px",
  padding: "10px"
};

export default Popup;
