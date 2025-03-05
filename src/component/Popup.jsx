import React, { useState, useEffect, useRef } from "react";

import { PopupHeader } from "./PopupHeader";
import ReactMarkdown from "react-markdown";
import { Examples } from "./Examples"

import { 
    getGlobalOffset, 
    extractSentence } 
from "../utils/textUtils";
import { getCompletion} from "../services/apiService"
import { getLocalData } from "../services/storageService";
import '../style/Popup.css';

function Popup() {
    const [word, setWord] = useState("");
    const [sentence, setSentence] = useState("");
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [definition, setDefinition] = useState("Thinking...");
    const [isKnownWord, setIsKnownWord] = useState(false)
    const [codeLang, setCodeLang] = useState("")
    const [isNewPhrase, setIsNewPhrase] = useState(true)
    const [lang, setLang] = useState("")
    const [phonetics, setPhonetics] = useState("")
    // Creamos un ref para el popup
    const popupRef = useRef(null);

    useEffect(() => {
        const handleSelection = async (event) => {
            // Si el clic se hizo dentro del popup, no hacemos nada.
            if (popupRef.current && popupRef.current.contains(event.target))  return;

            const selection = window.getSelection();
            const selectedWord = selection.toString().trim();
            
            
            if (selectedWord && !selectedWord.includes(" ")) {
                const range = selection.getRangeAt(0);
                const commonAncestor = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
                ? range.commonAncestorContainer.parentElement
                : range.commonAncestorContainer;
        
                const fullText = commonAncestor.textContent;
                const globalOffset = getGlobalOffset(commonAncestor, range.startContainer, range.startOffset);
                const stnce = extractSentence(fullText, globalOffset);

                setWord(selectedWord);
                setSentence(stnce);
                setIsVisible(true);
                const rect = range.getBoundingClientRect();
                setPosition({
                top: rect.top + window.scrollY,
                left: rect.right + window.scrollX,
                });
                
                const data = await getLocalData(["popupPrompt", "savedPhrases", "pronunciationInput"])
                const completion = await getCompletion(selectedWord, stnce, data.popupPrompt, data.pronunciationInput); // md (make it an option)
                
                setCodeLang(completion.c)
                setDefinition(completion.d);
                setLang(completion.l.toLowerCase())
                setPhonetics(completion.p)
                doIknowThisWord(completion.l.toLowerCase(), selectedWord.toLowerCase())
                checkIfPhraseSaved(completion.l.toLowerCase(), selectedWord.toLowerCase(), stnce.toLowerCase())
                ;

            } else resetPopup()
            
        };

        document.addEventListener("mouseup", handleSelection);
        return () => document.removeEventListener("mouseup", handleSelection);
    }, []);

    const resetPopup = () =>{
        // undo everything when pop up dissapears
        setIsVisible(false);
        setDefinition("Thinking...");
        setWord("");
        setSentence("");
        setCodeLang("")
        setIsKnownWord(false)
        setIsNewPhrase(true)
        setLang("")
        setPhonetics("")
    }

    const doIknowThisWord = async (lang, word) => {
        const data = await getLocalData(["wordsSaved"])
        if (!data.wordsSaved || !data.wordsSaved[lang]) return
        setIsKnownWord(Object.keys(data.wordsSaved[lang]).includes(word.toLowerCase()))
    }

    const checkIfPhraseSaved = async (lang, word, phrase) =>
    {
        const data = await getLocalData(["wordsSaved"])
        if (!data.wordsSaved || !data.wordsSaved[lang] || !data.wordsSaved[lang][word] || !data.wordsSaved[lang][word]["sentences"]) setIsNewPhrase(true)
        else    {
            setIsNewPhrase(!data.wordsSaved[lang][word]["sentences"].includes(phrase))
            console.log(data.wordsSaved[lang][word]["sentences"], phrase)
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
        }}
        >
            <PopupHeader
            word={word}
            codeLang={codeLang}
            sentence={sentence}
            definition={definition}
            lang={lang}
            phonetics={phonetics}
            isKnownWord={isKnownWord}
            isNewPhrase={isNewPhrase}
            setIsKnownWord={setIsKnownWord}
            setIsNewPhrase={setIsNewPhrase}
            />
            
            <ReactMarkdown className="definition">{definition}</ReactMarkdown>
            <Examples
                word={word}
                sentence= {sentence}
                definition = {definition}
                lang={lang}
                codeLang={codeLang}
                checkIfPhraseSaved={checkIfPhraseSaved}
                setSentence={setSentence}
                setDefinition={setDefinition}
            />

        </div>
    );
}


export default Popup;