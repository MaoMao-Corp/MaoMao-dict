import ReactMarkdown from "react-markdown";
import React, { useState, useEffect, useRef } from "react";
import '../style/Popup.css';
import speaker from "../media/speaker.png"
import add from "../media/add.png"


function Popup() {
  const [selectedText, setSelectedText] = useState("");
  const [contextSentence, setContextSentence] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [definition, setDefinition] = useState("Thinking...");
  const [knownWord, setKnownWord] = useState(true)
  const [audio, setAudio] = useState(null)
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
        
        chrome.storage.local.get("miauPrompt", async (data)=> {
          const def = await fetchDefinition(selectedWord, sentence, data.miauPrompt);
          setDefinition(def);
        });

      } else {
        // undo everything when pop up dissapears
        setIsVisible(false);
        setDefinition("Thinking...");
        setSelectedText("");
        setContextSentence("");
        setCodeLang("")
        //setKnownWord(false)
        setAudio(null)
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

  const fetchDefinition = async (word, sentence, structure) => {
    try {
      const response = await fetch("https://miau-miau-dict-backend.onrender.com/define/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, sentence, structure}),
      });
      const data = await response.json();
      const clean_data = await data[0]
      setCodeLang(clean_data.c)
      return clean_data.d;
    } 
    catch (error) {
      return "Error al obtener la definición.";
    }
  };
  const play_audio = (audio64) => {
    const binaryData = atob(audio64); // Decodificar base64 a binario
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
  const handleSound = async () => {

    if (audio)
    {
      play_audio(audio);
      console.log("no new audio generated")
      return null;
    }
    try {
      const response = await fetch("https://miau-miau-dict-backend.onrender.com/tts/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedText, code:codeLang}),
      });
  
      const data = await response.json();
      if (data.audio) {
        setAudio(data.audio)
        play_audio(data.audio)
        console.log("new audio generated")
      }

  } catch(error)
  {console.log("error while handling sound",error)}
  }
  
  const handleAdd = async () => {
    try {
      chrome.storage.local.get(["miauDeckInput", "miauAnkiInput"], async (data)=> {
      const structure = data.miauAnkiInput;
      const deckName = data.miauDeckInput;
      // Get anki card's back
      const response1 = await fetch("https://miau-miau-dict-backend.onrender.com/define/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: selectedText, sentence: contextSentence, structure: structure}),
      });
      const data1 = await response1.json();
      const clean_data = await data1[0] 
      const back = clean_data.d // reverso de la carta

      // si no se ha generado el audio, se genera ahora,
      if (!audio)
      {
        try {
          const audioResponse = await fetch("https://miau-miau-dict-backend.onrender.com/tts/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: selectedText, code:codeLang}),
          });
          console.log("fetch hecho")
          const data = await audioResponse.json();
          if (data.audio) {var audioFile = data.audio};
        } catch (error) {
          console.error("Error al obtener el audio:", error);
        }
      }
      // si ya hay audio, solo refedinir
      else{
        console.log("no new audio")
        var audioFile = audio
      }

      // Guardar audio en la carpeta Anki
      const audioFilename = `${selectedText}_test.mp3`
      const storeMediaResponse = await fetch("http://localhost:8765", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "storeMediaFile",
          version: 6,
          params: { filename: audioFilename, data: audioFile },
        }),
      });
      const storeMediaResult = await storeMediaResponse.json();
      // check for errors
      if (!storeMediaResult.result) {
        console.error("Error al guardar el audio en Anki");
        return;
      }
      // generar new note
      const addNoteResponse = await fetch("http://localhost:8765", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({
          "action": "addNote",
          "version": 6,
          "params": {
            "note": {
              "deckName": deckName,
              "modelName": "Básico",
              "fields": {
                "Anverso": `[sound:${audioFilename}] ${selectedText}`,
                "Reverso": back
              },
              "tags": ["miaumiau"],
              "options": {
                "allowDuplicate": false
              }
            }
          }
        }
        )
      });
      const addNoteResult = await addNoteResponse.json();
      console.log(addNoteResult); // todo correcto

    })} 
    // catch error
    catch (error) {
      console.error("Error al agregar la flashcard:", error);
    }
  }
  
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
          src={speaker}
          alt="sound button"
          className="audio-img"
          onClick={handleSound}
        />}
        {knownWord && <img
        src={add}
        alt="add button"
        className="add-img"
        onClick={()=>handleAdd(selectedText, contextSentence, audio)}></img> }
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
