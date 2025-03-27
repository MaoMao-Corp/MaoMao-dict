import React, { useState, useEffect, useRef } from "react";
import { PopupHeader } from "./PopupHeader";
import ReactMarkdown from "react-markdown";
import { Examples } from "./Examples";
import { 
    getGlobalOffset, 
    extractSentence 
} from "../utils/textUtils";
import { getCompletion } from "../services/apiService";
import { getLocalData } from "../services/storageService";
import '../style/Popup.css';

function Popup() {
    const [word, setWord] = useState("");
    const [sentence, setSentence] = useState("");
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [definition, setDefinition] = useState("Thinking...");
    const [isKnownWord, setIsKnownWord] = useState(false);
    const [codeLang, setCodeLang] = useState("");
    const [isNewPhrase, setIsNewPhrase] = useState(true);
    const [lang, setLang] = useState("");
    const [phonetics, setPhonetics] = useState("");
    const popupRef = useRef(null);
    const mousePosRef = useRef({ x: 0, y: 0 });
    const isVisibleRef = useRef(isVisible);

    useEffect(() => {
        isVisibleRef.current = isVisible;
    }, [isVisible]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            mousePosRef.current = { x: e.clientX, y: e.clientY };
        };
        document.addEventListener('mousemove', handleMouseMove);
        return () => document.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popupRef.current && !popupRef.current.contains(e.target)) {
                resetPopup();
            }
        };

        const handleKeyDown = async (e) => {
            if (e.key === 'Shift' && !isVisibleRef.current) {
                const { x, y } = mousePosRef.current;
                const range = document.caretRangeFromPoint(x, y);
                
                if (range) {
                    const clonedRange = range.cloneRange();
                    clonedRange.expand('word');
                    const selectedWord = clonedRange.toString().trim();
                    
                    if (selectedWord && !selectedWord.includes(' ')) {
                        const commonAncestor = clonedRange.commonAncestorContainer.nodeType === Node.TEXT_NODE
                            ? clonedRange.commonAncestorContainer.parentElement
                            : clonedRange.commonAncestorContainer;

                        const fullText = commonAncestor.textContent;
                        const globalOffset = getGlobalOffset(commonAncestor, clonedRange.startContainer, clonedRange.startOffset);
                        const stnce = extractSentence(fullText, globalOffset);

                        setWord(selectedWord);
                        setSentence(stnce);
                        setIsVisible(true);
                        
                        const rect = clonedRange.getBoundingClientRect();
                        setPosition({
                            top: Math.min(
                                rect.top + window.scrollY,
                                window.innerHeight - 100
                            ),
                            left: rect.right + window.scrollX,
                        });

                        const data = await getLocalData(["definition", "pronunciation"]);
                        const completion = await getCompletion(selectedWord, stnce, data.definition, data.pronunciation);
                        
                        setCodeLang(completion.c);
                        setDefinition(completion.d);
                        setLang(completion.l?.toLowerCase());
                        setPhonetics(completion.p);
                        doIknowThisWord(completion.l?.toLowerCase(), selectedWord.toLowerCase());
                        checkIfPhraseSaved(completion.l?.toLowerCase(), selectedWord.toLowerCase(), stnce.toLowerCase());
                    }
                }
            }
        };

        document.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        
        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
    const resetPopup = () => {
        setIsVisible(false);
        setDefinition("Thinking...");
        setWord("");
        setSentence("");
        setCodeLang("");
        setIsKnownWord(false);
        setIsNewPhrase(true);
        setLang("");
        setPhonetics("");
    };

    const doIknowThisWord = async (lang, word) => {
        const data = await getLocalData(["wordsSaved"]);
        if (!data.wordsSaved || !data.wordsSaved[lang]) return;
        setIsKnownWord(Object.keys(data.wordsSaved[lang]).includes(word.toLowerCase()));
    };

    const checkIfPhraseSaved = async (lang, word, phrase) => {
        const data = await getLocalData(["wordsSaved"]);
        if (!data.wordsSaved || !data.wordsSaved[lang] || !data.wordsSaved[lang][word] || !data.wordsSaved[lang][word]["sentences"]) {
            setIsNewPhrase(true);
        } else {
            setIsNewPhrase(!data.wordsSaved[lang][word]["sentences"].includes(phrase));
        }
    };

    const handlePopupWheel = (e) => {
        e.stopPropagation()
    }

    if (!isVisible) return null;

    return (
        <div
            ref={popupRef}
            className="popup-bubble"
            onWheel={handlePopupWheel}
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
                sentence={sentence}
                definition={definition}
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