import ReactMarkdown from "react-markdown";
import React, { useState, useEffect, useRef } from "react";
import '../style/Popup.css';
import speaker from "../media/speaker.png"
import add from "../media/add.png"
import hat from "../media/hat.png"
import speakerGray from "../media/speaker_gray.png"

function Popup() {
  const [selectedText, setSelectedText] = useState("");
  const [contextSentence, setContextSentence] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [definition, setDefinition] = useState("Thinking...");
  const [knownWord, setKnownWord] = useState(false)
  const [audioWord, setAudioWord] = useState(null)
  const [audioSentence, setAudioSentence] = useState(null)
  const [codeLang, setCodeLang] = useState("")
  const [addError, setAddError] = useState(false)
  const [examples, setExamples] = useState([])
  const [newPhrase, setNewPhrase] = useState(true)
  const [lang, setLang] = useState("")
  const [phonetics, setPhonetics] = useState("")
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
        const commonAncestor = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentElement
        : range.commonAncestorContainer;
  
        const fullText = commonAncestor.textContent;
    
        const globalOffset = getGlobalOffset(commonAncestor, range.startContainer, range.startOffset);
    
        const sentence = extractSentence(fullText, globalOffset);

        setSelectedText(selectedWord);
        setContextSentence(sentence);
        setIsVisible(true);
        const rect = range.getBoundingClientRect();
        setPosition({
          top: rect.top + window.scrollY,
          left: rect.right + window.scrollX,
        });
        
        chrome.storage.local.get(["popupPrompt", "savedPhrases", "pronunciationInput"], async (data)=> {
          const completion = await getCompletion(selectedWord, sentence, data.popupPrompt, data.pronunciationInput, true); // md (make it an option)
          
          const lang = await completion.l
          const code = await completion.c
          const def = await completion.d
          const pron =  await completion.p
          setCodeLang(code)
          setDefinition(def);
          setLang(lang.toLowerCase())
          setPhonetics(pron)
          doIknowThisWord(lang.toLowerCase(), selectedWord.toLowerCase())
          checkIfPhraseSaved(lang.toLowerCase(), selectedWord.toLowerCase(), sentence.toLowerCase())
        });

      } else {
        // undo everything when pop up dissapears
        setIsVisible(false);
        setDefinition("Thinking...");
        setSelectedText("");
        setContextSentence("");
        setCodeLang("")
        setKnownWord(false)
        setAudioWord(null)
        setAudioSentence(null)
        setCodeLang("")
        setAddError(false)
        setExamples([])
        setNewPhrase(true)
        setLang("")
        setPhonetics("")
      }
    };

    document.addEventListener("mouseup", handleSelection);
    return () => document.removeEventListener("mouseup", handleSelection);
  }, []);

  const doIknowThisWord = (lang, word) => {
    chrome.storage.local.get("wordsNsentences", (data) => {

      if (!data.wordsNsentences || !data.wordsNsentences[lang]) return
      setKnownWord(Object.keys(data.wordsNsentences[lang]).includes(word.toLowerCase()))
    })
  }

  const checkIfPhraseSaved = (lang, word, phrase) =>
  {
    chrome.storage.local.get("wordsNsentences", (data)=>{
      if (!data.wordsNsentences || !data.wordsNsentences[lang] || !data.wordsNsentences[lang][word]) {
        setNewPhrase(true)
        return;
      }
      setNewPhrase(!data.wordsNsentences[lang][word].includes(phrase))
    })
  }

  const getGlobalOffset = (root, node, localOffset) => {
    let offset = 0;

    /**
     * Función recursiva que recorre los nodos en preorden.
     * Cuando encuentra el nodo objetivo, suma el offset local y termina.
     */
    const traverse = (current) => {
      if (current === node) {
        offset += localOffset;
        return true; // Se encontró el nodo
      }

      // Si es un nodo de texto, sumamos su longitud.
      if (current.nodeType === Node.TEXT_NODE) {
        offset += current.textContent.length;
      }

      // Recorremos los nodos hijos.
      for (let i = 0; i < current.childNodes.length; i++) {
        const child = current.childNodes[i];
        if (traverse(child)) {
          return true;
        }
      }
      return false;
    };

    traverse(root);
    return offset;
  };

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
  const getCompletion = async (word, sentence, structure, pronMethod, md) =>
  {
    const response = await fetch("https://maomao-dict.onrender.com/define/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: word, sentence: sentence, structure: structure, pronunciation: pronMethod, md}),
    });
    
    const result = await response.json()
    const completion = await result[0]
    return completion
  }

  // /tts/ endpoint related 
  const fetchAudio = async (text, code) => {
    
    const audioResponse = await fetch("https://maomao-dict.onrender.com/tts/", {
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
  
  const getDecks = async () => {
    const decksResponse = await fetch("http://localhost:8765/", {
      method : "POST",
      headers : {"Content-Type": "application/json"},
      body : JSON.stringify({
        action: "deckNames",
        version: 6
      })
    })
    const decksResult = await decksResponse.json()
    const decks = await decksResult.result
    return decks
  }

  const createDeck = async (name) => {
    const createDeckResponse = await fetch("http://localhost:8765/", 
      {
        method : "POST",
        headers : {"Content-Type":"application/json"},
        body : JSON.stringify({
          action: "createDeck",
          version: 6,
          params: {
            deck : name
          }
        })
      }
    )
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
  const addNote = async (deckName, audioFilename, word, sentence, frontStruct, back, fields) => {
    try{
      const frontKey = fields[0]
      const backKey = fields[1]
      const modelName = fields[2]
      const _____ = (frontStruct? frontStruct: "$SOUND $SENTENCE ($WORD)")
      const front = _____.replace("$SOUND", `[sound:${audioFilename}]`).replace("$WORD", `${word}`).replace("$SENTENCE", `${sentence}`)

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
                [frontKey]: front,
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
      console.error("Error while fetching localhost:8765 (anki connect api), MAKE SURE TO HAVE ANKI OPENED ;)", error)
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
  const handleSoundWord = async () => {
    if (audioWord) play_audio(audioWord);
    else {
      const newAudio = await getAudio(selectedText, codeLang)
      setAudioWord(newAudio)
      play_audio(newAudio)
    }
  }
  const handleSoundSentence = async () => {
      if (audioSentence) play_audio(audioSentence);
      else {
        const newAudio = await getAudio(contextSentence, codeLang)
        setAudioSentence(newAudio)
        play_audio(newAudio)
      }
  }  
  const handleAdd = async () => {
    try {
      chrome.storage.local.get(["deckInput","ankiFrontPrompt", "ankiBackPrompt"], async (data)=> {
        // retrieve local variables
        
        const FrontStruct = data.ankiFrontPrompt
        const backStruct = data.ankiBackPrompt;
        
        // Get anki card's back
        
        const back = data.ankiBackPrompt ? await (await getCompletion(selectedText, contextSentence, backStruct, false)).d : definition;
        const deckName = data.deckInput ? data.deckInput.replace("$SOUND","").replace("$SENTENCE", contextSentence).replace("$WORD", selectedText) : lang


        const audioFilename = `${contextSentence}_${deckName}_${codeLang}.mp3`.replace(/\s/g, "")
        // si no se ha generado el audio, se genera ahora,
        if (!audioSentence) {
          audioFile = await getAudio(selectedText, codeLang)
          setAudioSentence(audioFile)
        }  else { // si ya hay audio, solo refedinir
          var audioFile = audioSentence
        }
        storeMediaFiles(audioFilename, audioFile) // self-explanatory

        const deckNames = await getDecks()
        if (!deckNames.includes(deckName)) {
          await createDeck(deckName)
        }

        // generar new note
        const fieldNames = await getFieldNames()
        noteID = await addNote(deckName, audioFilename, selectedText, contextSentence, FrontStruct, back, fieldNames)
        if (!noteID) setAddError(true)
        else {
          
          chrome.storage.local.get(["wordsNsentences"], (data)=>{
            const prevWordsAndSentences = data.wordsNsentences
            const currentWordsNsentences = prevWordsAndSentences ?? {}
            const lang = lang.toLowerCase()
            const word = selectedText.toLowerCase()
            const phrase = contextSentence.toLowerCase()
            if (!currentWordsNsentences[lang]) currentWordsNsentences[lang] = {};
            
            if (!currentWordsNsentences[lang][word]) currentWordsNsentences[lang][word] = []
            currentWordsNsentences[lang][word].push(phrase)
            // Guardamos nuevamente el objeto actualizado en el almacenamiento

            chrome.storage.local.set({ wordsNsentences: currentWordsNsentences})
          })
          setKnownWord(true)
          setNewPhrase(false)
        }
    })} 
    // catch error
    catch (error) {
      setAddError(true)
      console.error("Error while adding card to anki: ", error);
    }
  }
  const handleExamples = async (word, lang) => {
    chrome.storage.local.get("popupPrompt", async (data)=>{
      const structure = data.popupPrompt
      const examplesResponse = await fetch("https://maomao-dict.onrender.com/examples/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({word, structure, lang}),
      });
      const examplesResult = await examplesResponse.json()
      const examples = await examplesResult[0]
      setExamples(examples)
    })

  }

  const handleClickExample = (index) => {
    const currentExamples = examples

    checkIfPhraseSaved(lang, selectedText, Object.keys(currentExamples)[index])
    setContextSentence(Object.keys(currentExamples)[index])
    setDefinition(Object.values(currentExamples)[index])
    setAudioSentence(null)

    delete currentExamples[Object.keys(currentExamples)[index]]
    currentExamples[contextSentence]= definition
    setExamples(currentExamples)
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
        <p className="phonetics">{phonetics}</p>
        {codeLang && <img
          src={speaker}
          alt="sound button"
          className="audio-img"
          onClick={handleSoundWord}
        />}
        <div className="img-derecha">
          {knownWord && <img src={hat} className="hat-img"></img>}
          {(newPhrase && !addError) && <img
          src={add}
          alt="add button"
          className="add-img"
          onClick={()=>handleAdd(selectedText, contextSentence, audioSentence)}></img> }

          {(!newPhrase && !addError) &&  <svg
            className="tick-img"
            width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12L10 17L20 7" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>}
          
            {addError && <svg
            className="error-img"
            width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <line x1="10" y1="10" x2="90" y2="90" stroke="white" stroke-width="20" stroke-linecap="round"/>
            <line x1="90" y1="10" x2="10" y2="90" stroke="white" stroke-width="20" stroke-linecap="round"/>
            </svg>
            }

        </div>
        </div>
      <div className="sentence-block">
        <p className="sentence" style={{ fontStyle: "italic", color: "#888" }}>
          {contextSentence}
        </p>
        {codeLang && <img
          src={speakerGray}
          alt="sound button"
          className="audio-sentence audio-img"
          onClick={handleSoundSentence}
        />}
      </div>
      <ReactMarkdown className="definition">{definition}</ReactMarkdown>
      <div>
        <p className="example-hitbox" onClick={()=>handleExamples(selectedText, codeLang)}>Examples</p>
        <ul className="examples-list">
          {Object.keys(examples).length>0 && Object.keys(examples).map((example, index)=>
          <li key={index} className="example" onClick={()=>handleClickExample(index)}> {example} </li>
          )}
        </ul>
      </div>
    </div>
  );
}


export default Popup;