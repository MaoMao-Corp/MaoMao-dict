// /define/ endpoint related
export const getCompletion = async (word, sentence, structure, pronMethod) =>
{
    console.log(word, sentence, structure, pronMethod)
    const response = await fetch("https://maomao-dict.onrender.com/define/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word, sentence: sentence, structure: structure, pronunciation: pronMethod}),
    });
      
    const result = await response.json()
    const completion = await result[0]
    return completion
}

// /tts/ endpoint related 
export const fetchAudio = async (text, code) => {
    const audioResponse = await fetch("https://maomao-dict.onrender.com/tts/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({text, code}),
    });
    const audioResult = await audioResponse.json();
    if (audioResult.audio) return await audioResult.audio
}


// /anki/ endpoint related
export const getBack = async (word, sentence, structure, pronMethod) =>
{
    const response = await fetch("https://maomao-dict.onrender.com/anki/", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({word: word, sentence: sentence, structure: structure, pronunciation: pronMethod})
    })
    const ankiResult = await response.json()
    return await ankiResult.back
}


// /ankimulti/ endpoint related
export const getCards = async (word, front, back, pronMethod) =>
{
    const ankiResponse = await fetch("https://maomao-dict.onrender.com/ankimulti/", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({word: word, front:front, back:back, pronunciation: pronMethod})
    })
    const ankiResult = await ankiResponse.json()
    const ankiMulti = await ankiResult[0]
  
    return [Object.keys(ankiMulti), Object.values(ankiMulti)]
}



// /examples/ endpoint related
export const getExamples = async (word, lang) => {
    console.log("getexamples in", word, lang)
    const storageData = await new Promise((resolve)=>{
        chrome.storage.local.get("popupPrompt", (data)=>{
            resolve(data)
        })
    })
    
    const structure = storageData.popupPrompt;
    try
    {
        const response = await fetch("https://maomao-dict.onrender.com/examples/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({word: word, structure: structure, lang:lang})
        })
        const examplesResult = await response.json()
        return await examplesResult[0]
    } catch(e){
        console.error("error getting examples:", error)
        return []
    }
}


// localhost:8765 (anki) related
export const storeMediaFiles = async (filename, file) => {
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
    if (!storeMediaResult.result) error("Error while storing media files")
}

export const getDecks = async () => {
    const decksResponse = await fetch("http://localhost:8765/", {
        method : "POST",
        headers : {"Content-Type": "application/json"},
        body : JSON.stringify({
            action: "deckNames",
            version: 6
        })
    })
    const decksResult = await decksResponse.json()
    const allDecks = await decksResult.result
    const decks = await allDecks.filter(deck=>!deck.includes("::"))
    return decks

}
export const createDeck = async (name) => {
    await fetch("http://localhost:8765/", 
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
    })
}

export const getFieldNames = async () => {
    const modelNamesResponse = await fetch("http://localhost:8765/", 
    {
        method : "POST",
        headers : {"Content-Type":"application/json"},
        body : JSON.stringify({
            action: "modelNames",
            version: 6
        })
    })
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
    })
  const modelFieldResult = await modelFieldResponse.json()
  const modelField = await modelFieldResult.result
  return [...modelField, basic ]
}
export const addMultipleNotes = async (deckName, audioFilenames, word, sentences, frontStruct, explanations, fields) => {
    try{
        const notePromises = sentences.map(async (sentence, index) => addNote(deckName, audioFilenames[index], word, sentence, frontStruct, explanations[index], fields))
    
        const results = await Promise.all(notePromises);
        return results.map(result=> result.result)
    } catch(error) {
        setAddError(true)
        console.error("Error while fetching localhost:8765 (anki connect api), MAKE SURE TO HAVE ANKI OPENED ;)", error)
        return []
    }
}

export const addNote = async (deckName, audioFilename, word, sentence, frontStruct, explanation, fields) => {
    const frontKey = fields[0]
    const backKey = fields[1]
    const modelName = fields[2]

    const _ = frontStruct? frontStruct: "$SOUND $SENTENCE ($WORD)"
    const front = _.replace("$SOUND", `[sound:${audioFilename}]`).replace("$WORD", `${word}`).replace("$SENTENCE", `${sentence}`)
    return fetch("http://localhost:8765", { 
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
                        [backKey]: explanation
                    },
                    "tags": ["miaumiau", word],
                    "options": {
                        "allowDuplicate": false
                    }
                }
            }
        })
    }).then(response=>response.json());
}
