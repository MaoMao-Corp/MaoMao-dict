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
          const def = await getDefinition(selectedWord, sentence, data.miauPrompt);
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

  // /define/ endpoint related
  const fetchCompletion = async (word, sentence, structure) =>
  {
    const response = await fetch("https://miau-miau-dict-backend.onrender.com/define/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, sentence, structure}),
    });
    const result = await response.json()
    const completion = await result[0]
    setCodeLang(completion.c)
    return completion.d
  }
  const getDefinition = async (word, sentence, structure) => {
    try {
      const def = await fetchCompletion(word, sentence, structure)
      return def
    } 
    catch (error) {
      return "Error al obtener la definición.";
    }
  };


  // /tts/ endpoint related 
  const fetchAudio = async (text, code) => {
    
    const audioResponse = await fetch("https://miau-miau-dict-backend.onrender.com/tts/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({text, code}),
    });
    const audioResult = await audioResponse.json();
    if (audioResult.audio) return await audioResult.audio
  }
  const getAudio = async (text, code) => {
    try {
      const audio = await fetchAudio(text, code)
      return audio
    }    catch (error)
    {console.error("Error while getting audio:", error)}
  }
  
  const getFieldNames = async () => {
    const modelNamesResponse = await fetch("http://localhost:8765/", 
      {
        method : "POST",
        headers : {"Content-Type":"application/json"},
        body : JSON.stringify({
          action: "modelNames",
          version: 6
        })
      }
    )
    const modelNamesResult = await modelNamesResponse.json()
    const modelNames = await modelNamesResult.result
    const basic = await modelNames[0]
    const modelFieldResponse = await fetch("http://localhost:8765/", 
      {
        method : "POST",
        headers : {"Content-Type":"application/json"},
        body : JSON.stringify({
          action: "modelFieldNames",
          version: 6,
          params : {
            "modelName" : basic
          }
        })
      }
    )
    const modelFieldResult = await modelFieldResponse.json()
    const modelField = await modelFieldResult.result
    return [...modelField, basic ]
  }
  // localhost:8765 (anki) related
  const storeMediaFiles = async (filename, file) => {
    const storeMediaResponse = await fetch("http://localhost:8765", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "storeMediaFile",
        version: 6,
        params: { filename: filename, data: file },
      }),
    });
    const storeMediaResult = await storeMediaResponse.json();
    if (!storeMediaResult.result) console.error("Error while storing media files")
  }
  const addNote = async (deckName, audioFilename, word, back, fields) => {
    try{
      const frontKey = fields[0]
      const backKey = fields[1]
      const modelName = fields[2]
      const addNoteResponse = await fetch("http://localhost:8765", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({
          "action": "addNote",
          "version": 6,
          "params": {
            "note": {
              "deckName": deckName,
              "modelName": modelName,
              "fields": {
                [frontKey]: `[sound:${audioFilename}] ${word}`,
                [backKey]: back
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
      return await addNoteResult.result
    } catch(error) {
      console.error("Error while fetching localhost:8765 (anki connect api), MAKE SURE TO HAVE ANKI OPENED ;)")
    }
  }


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


  // handle buttons
  const handleSound = async () => {
    if (audio) play_audio(audio);
    else {
      const newAudio = await getAudio(selectedText, codeLang)
      setAudio(newAudio)
      play_audio(newAudio)
    }
  }  
  const handleAdd = async () => {
    try {
      chrome.storage.local.get(["miauDeckInput", "miauAnkiInput"], async (data)=> {
        // retrieve local variables
        const struct = data.miauAnkiInput;
        const deckName = data.miauDeckInput;
        const audioFilename = `${selectedText}_${deckName}_${codeLang}.mp3`.replace(/\s/g, "")
        console.log(audioFilename)
        // Get anki card's back
        const back = await fetchCompletion(selectedText, contextSentence, struct)

        // si no se ha generado el audio, se genera ahora,
        if (!audio) {
          audioFile = await getAudio(selectedText, codeLang)
          setAudio(audioFile)
        }  else { // si ya hay audio, solo refedinir
          var audioFile = audio
        }
        storeMediaFiles(audioFilename, audioFile) // self-explanatory
        // generar new note
        const fieldNames = await getFieldNames()
        noteID = await addNote(deckName, audioFilename, selectedText, back, fieldNames)
        console.log(noteID)
    })} 
    // catch error
    catch (error) {
      console.error("Error while adding card to anki: ", error);
    }
  }
  
  if (!isVisible) return null;

  return (
    <div
      ref={popupRef} 
      className="popup-bubble"
      style={{
        top: position.top,
        left: position.left,
        transform: "translate(0, -100%)"
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


export default Popup;
