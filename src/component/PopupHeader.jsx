import { useEffect, useState } from "react"

// SERVICES
import { 
    fetchAudio,
    getCards,
    storeMediaFiles,
    getDecks,
    createDeck,
    getFieldNames,
    addMultipleNotes,
    addNote,
    getBack
} from "../services/apiService"

import { getLocalData, setLocalData } from "../services/storageService"

// UTILS
import { play_audio } from "../utils/audioUtils"

// IMAGES
import speaker from "../media/speaker.png"
import add from "../media/add.png"
import hat from "../media/hat.png"
import speakerGray from "../media/speaker_gray.png"
import addGray from "../media/add_gray.png"


export function PopupHeader({word, sentence, definition, lang, codeLang, phonetics, isKnownWord, isNewPhrase, setIsKnownWord, setIsNewPhrase}) {
    const [audioWord, setAudioWord] = useState(null)
    const [audioSentence, setAudioSentence] = useState(null)
    const [addError, setAddError] = useState(false)
    const [multiAdded, setMultiAdded] = useState(false)

    const [decks, setDecks] = useState([])

    useEffect(()=>{
        setAudioSentence(null)
        setMultiAdded(false)
    },[sentence])

    // HANDLE BUTTONS
    const handleSoundWord = async () => {
        if (audioWord) play_audio(audioWord);
        else {
            const newAudio = await fetchAudio(word, codeLang)
            setAudioWord(newAudio)
            play_audio(newAudio)
        }
    }
    const handleSoundSentence = async () => {
        if (audioSentence) play_audio(audioSentence);
        else 
        {
                const newAudio = await fetchAudio(sentence, codeLang)
                setAudioSentence(newAudio)
                play_audio(newAudio)
        }
    }

    const handleSelectDeck = async() => {
        const decks = await getDecks()
        setDecks(decks)

    }
    
    const handleAddMulti = async () => {
        try {
            const data = await getLocalData(["deckInput","ankiFrontPrompt", "ankiBackPrompt", "pronunciationInput", "wordsSaved", "ankimultiExamples"])
            // retrieve local variables
            
            const FrontStruct = data.ankiFrontPrompt
            const backStruct = data.ankiBackPrompt;
            const pronunciation = data.pronunciationInput
            const ankimultiExamplesPrompt = data.ankimultiExamples
            // Get anki card's back
            const [phrases, explanations] = await getCards(word, ankimultiExamplesPrompt,backStruct, pronunciation);
            phrases.forEach((p)=>{
                console.log(p)
            })
            const deckName = data.deckInput ? data.deckInput.replace("$SOUND","").replace("$SENTENCE", "").replace("$WORD", "") : lang
            
            // Get Audio
            const audioFilenames = phrases.map(sntce=>{return `${sntce}_${deckName}_${codeLang}.mp3`.replace(/\s/g, "")})
            // si no se ha generado el audio, se genera ahora,
            
            const audioList = await Promise.all(phrases.map((stnce) => fetchAudio(stnce, codeLang)))

            await Promise.all(audioFilenames.map((filename, index)=>{
                storeMediaFiles(filename, audioList[index]) // self-explanatory
            }))        
            const deckNames = await getDecks()
            if (!deckNames.includes(deckName)) {
                await createDeck(deckName)
            }
        
            // generar new note
            const fieldNames = await getFieldNames()
            notesID = await addMultipleNotes(deckName, audioFilenames, word, phrases, FrontStruct, explanations, fieldNames)
            console.log(notesID)
            if (notesID.length==0) setAddError(true)
            else {
                const currentWordsSaved = data.wordsSaved ?? {}
                const language = lang.toLowerCase()
                const _word_ = word.toLowerCase()
        
                if (!currentWordsSaved[language]) currentWordsSaved[language] = {};
                if (!currentWordsSaved[language][_word_]) currentWordsSaved[language][_word_] = {};
                if (!currentWordsSaved[language][_word_]["notesIds"]) currentWordsSaved[language][_word_]["notesIds"] = [];
                if (!currentWordsSaved[language][_word_]["sentences"]) currentWordsSaved[language][_word_]["sentences"] = [];
                
                currentWordsSaved[language][_word_]["notesIds"].push(...notesID)
                currentWordsSaved[language][_word_]["sentences"].push(...phrases)
                // Guardamos nuevamente el objeto actualizado en el almacenamiento
                
                setLocalData("wordsSaved", currentWordsSaved)
                
                setMultiAdded(true)
            }
        } 
        // catch error
        catch (error) {
            setAddError(true)
            console.error("Error while adding card to anki: ", error);
        }
    }
    
    const handleAdd = async () => {
        console.log("only add this sentence")
        const data = await getLocalData(["deckInput","ankiFrontPrompt", "ankiBackPrompt", "pronunciationInput", "wordsSaved"])
        
        // retrieve local variables
        const FrontStruct = data.ankiFrontPrompt
        const backStruct = data.ankiBackPrompt;
        const pronunciation = data.pronunciationInput
        // Get anki card's back
        const back = backStruct? await getBack(word, sentence, backStruct, pronunciation) : definition
        
        const deckName = data.deckInput ? data.deckInput.replace("$SOUND","").replace("$SENTENCE", "").replace("$WORD", "") : lang
        
        // Get Audio
        const audioFilename = `${sentence}_${deckName}_${codeLang}.mp3`.replace(/\s/g, "")
        // si no se ha generado el audio, se genera ahora,
        
        const audio = await fetchAudio(sentence, codeLang)

        await storeMediaFiles(audioFilename, audio) // self-explanatory
                
        const deckNames = await getDecks()
        if (!deckNames.includes(deckName)) {
            await createDeck(deckName)
        }
        // generar new note
        const fieldNames = await getFieldNames()
        const borrar =  await addNote(deckName, audioFilename, word, sentence, FrontStruct, back, fieldNames)
        console.log("borrar", borrar)
        const noteID = await borrar.result
        console.log(noteID)
        if (!noteID) setAddError(true)
        else {
            const currentWordsSaved = data.wordsSaved ?? {}
            const language = lang.toLowerCase()
            const _word_ = word.toLowerCase()
                    if (!currentWordsSaved[language]) currentWordsSaved[language] = {};
            if (!currentWordsSaved[language][_word_]) currentWordsSaved[language][_word_] = {}
            if (!currentWordsSaved[language][_word_]["notesIds"]) currentWordsSaved[language][_word_]["notesIds"] = []
            if (!currentWordsSaved[language][_word_]["sentences"]) currentWordsSaved[language][_word_]["sentences"] = []
            currentWordsSaved[language][_word_]["notesIds"].push(noteID)
            currentWordsSaved[language][_word_]["sentences"].push(sentence)
            
            // Guardamos nuevamente el objeto actualizado en el almacenamiento
            setLocalData("wordsSaved", currentWordsSaved)
            
            setIsKnownWord(true)
            setIsNewPhrase(false)
        }
    }

    return (
        <>      
            <div className="popup-header">
                <h2 className="word">{word}</h2>
                <p className="phonetics">{phonetics}</p>
                {codeLang && <img
                    src={speaker}
                    alt="sound button"
                    className="audio-img"
                    onClick={handleSoundWord}
                />}
                <div className="img-derecha">
                    <select name="deck-select" id="deck-select" onClick={handleSelectDeck}>
                        {
                            decks.map((deck) =>(
                                <option value="deck">{deck}</option>)
                            )
                        }
                    </select>
                    {
                        (multiAdded || isKnownWord) && <img src={hat} className="hat-img"></img>
                    }
                    {
                        (!multiAdded && !addError && codeLang) && <img
                        src={add}
                        alt="add button"
                        className="add-img"
                        onClick={()=>handleAddMulti(word, sentence, audioSentence)}></img> 
                    }
                    {
                        (multiAdded && !addError) &&  <svg
                        className="tick-img"
                        width="24" 
                        height="24"
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg">
                            <path 
                            d="M5 12L10 17L20 7" 
                            stroke="white" 
                            stroke-width="3" 
                            stroke-linecap="round" 
                            stroke-linejoin="round"/>
                        </svg>
                    }
                    
                    {
                        addError && <svg
                        className="error-img"
                        width="100"
                        height="100" 
                        viewBox="0 0 100 100" 
                        xmlns="http://www.w3.org/2000/svg">
                            <line 
                            x1="10" 
                            y1="10" 
                            x2="90" 
                            y2="90" 
                            stroke="white" 
                            stroke-width="20" 
                            stroke-linecap="round"/>
                            <line 
                            x1="90" 
                            y1="10" 
                            x2="10" 
                            y2="90" 
                            stroke="white" 
                            stroke-width="20" 
                            stroke-linecap="round"/>
                        </svg>
                    }
                </div>
                
            </div>
            <div className="sentence-block">
                <p className="sentence" 
                    style={{ fontStyle: "italic", color: "#888" }}>
                    {sentence}
                </p>
                {
                    codeLang && <img
                    src={speakerGray}
                    alt="sound button"
                    className="audio-sentence audio-img"
                    onClick={handleSoundSentence}
                    />
                }
                {
                    (isNewPhrase && codeLang) && <img
                    src={addGray}
                    alt="add button"
                    className="add-img"
                    onClick={handleAdd}></img> 
                }
                {
                    !isNewPhrase && 
                    <svg
                    className="tick-img"
                    width="24" 
                    height="24"
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg">
                        <path 
                        d="M5 12L10 17L20 7" 
                        stroke="#888" 
                        stroke-width="3" 
                        stroke-linecap="round" 
                        stroke-linejoin="round"/>
                    </svg>
                }
            </div>
        </>
    )
}