
// Referencias a los elementos de configuración
const definitionInput = document.getElementById("definitionInput");
const ankiStructFrontInput = document.getElementById("ankiStructFrontInput");
const ankiMultiFrontInput = document.getElementById("ankiMultiFrontInput")
const ankiMultiBackInput = document.getElementById("ankiMultiBackInput");
const ankiBackInput = document.getElementById("ankiBackInput");
const pronunciationInput = document.getElementById("pronunciationInput")
const saveButton = document.getElementById("saveButton");

// Elementos para la visualización de las palabras conocidas por idioma
const languagesContainer = document.getElementById("languagesContainer");
const knownWordsDisplay = document.getElementById("knownWordsDisplay");

// Cargar la configuración guardada
chrome.storage.local.get(
    ["definition", "ankiStructFront", "ankiMultiFront", "ankiMultiBack", "ankiBack", "pronunciation"],
    (data) => {
    console.log(data)

    definitionInput.value = data.definition
    ankiStructFrontInput.value = data.ankiStructFront
    ankiMultiFrontInput.value = data.ankiMultiFront
    ankiMultiBackInput.value = data.ankiMultiBack
    ankiBackInput.value = data.ankiBack
    pronunciationInput.value = data.pronunciation
    }
);


// Cargar el diccionario de palabras conocidas
chrome.storage.local.get("wordsSaved", (data) => {
        if (data.wordsSaved && Object.keys(data.wordsSaved).length > 0) {
        const idiomas = Object.keys(data.wordsSaved);
        idiomas.forEach((idioma, index) => {
            // Crear un botón para cada idioma
            const languageButton = document.createElement("button");
            languageButton.innerText = idioma;
            languageButton.classList.add("language-button");
            
            // Seleccionar el primer idioma por defecto
            if (index === 0) {
            displayKnownWords(idioma, data.wordsSaved[idioma], data);
            }
            

            // Evento para mostrar palabras del idioma seleccionado
            languageButton.addEventListener("click", () => {
            displayKnownWords(idioma, data.wordsSaved[idioma], data);
            });

            languagesContainer.appendChild(languageButton);
        });
        } else {
        knownWordsDisplay.innerText = "There are no known words";
        }
});
// Función para mostrar las palabras conocidas como elementos clickables
function displayKnownWords(idioma, palabrasObj, data) {
        // Limpiar el contenedor de palabras
        knownWordsDisplay.innerHTML = "";
        
        // Crear un título para el idioma
        const title = document.createElement("p");
        title.innerText = `Words known in ${idioma}:`;
        knownWordsDisplay.appendChild(title);
        
        // Crear un contenedor con scroll para las palabras
        const scrollContainer = document.createElement("div");
        scrollContainer.classList.add("scroll-container-words")

        // Contenedor para las palabras clickables
        const wordsContainer = document.createElement("div");
        wordsContainer.classList.add("container-words")


        
        // Crear un elemento clickable para cada palabra
        const palabras = Object.keys(palabrasObj);
        palabras.forEach(palabra => {
        const wordButton = document.createElement("button");
        wordButton.classList.add("word-button");
        wordButton.innerText = palabra;
        
        // Añadir evento de clic para procesar la eliminación
        wordButton.addEventListener("click", () => {
            console.log("deleting", palabrasObj[palabra]["notesIds"]);
            const _ = data.wordsSaved
            
            fetch("http://localhost:8765", {
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({
                "action": "deleteNotes",
                "version": 6,
                "params": {
                "notes": palabrasObj[palabra]["notesIds"]
                }
            })
            })
            .then(response => response.json()) // Convertir la respuesta a JSON
            .then(data => {
            console.log("Respuesta del servidor:", data);
            })
            .catch(error => {
            console.error("Error:", error);
            });
            delete _[idioma][palabra]
            chrome.storage.local.set({wordsSaved: _})
        });
        
        // Agregar el botón al contenedor de palabras
        wordsContainer.appendChild(wordButton);
        });
        
        scrollContainer.appendChild(wordsContainer);
        knownWordsDisplay.appendChild(scrollContainer);
}

// Guardar la configuración
saveButton.addEventListener("click", () => {
    chrome.storage.local.set({
        definition : definitionInput.value,
        ankiStructFront : ankiStructFrontInput.value,
        ankiMultiFront : ankiMultiFrontInput.value,
        ankiMultiBack : ankiMultiBackInput.value,
        ankiBack : ankiBackInput.value,
        pronunciation : pronunciationInput.value,
    });
    alert("Prompt saved!");
});

document.getElementById("deck-load-button").addEventListener("click", async () => {
    const deck = `deck:"${document.getElementById("deck-load-input").value}"`
    console.log(deck)
    const response = await fetch("http://localhost:8765", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({
            "action": "findCards",
            "version": 6,
            "params": {
                "query":deck
            }
        })
    })
    
    const results = await response.json()
    console.log(results)
    const ids = await results.result
    console.log(ids)
    let wordsSaved = await new Promise((resolve) => {    chrome.storage.local.get("wordsSaved", data=>resolve(data.wordsSaved))    })
    
    await ids.forEach(async (id)=>{
        const response = await fetch("http://localhost:8765", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                "action":"getNoteTags", 
                "version":6,
                "params": {
                    "note": id
                }
            })
        })
        const results = await response.json()
        const tags = await results.result
        try{
            const word = await tags.filter(item=>item!=="miaumiau")
            console.log(word[0])
            const deck_ = document.getElementById("deck-load-input").value
            wordsSaved ||= {}
            wordsSaved[deck_] ||= {}
            wordsSaved[deck_][word] ||= {}
            wordsSaved[deck_][word].notesIds ||= []
            wordsSaved[deck_][word].sentences ||= []
            if (!wordsSaved[deck.toLowerCase()][word].notesIds.includes(id)){
                wordsSaved[deck.toLowerCase()][word].notesIds.push(id)
                chrome.storage.local.set({wordsSaved: wordsSaved})
            } else console.log(id, " already added")
        }catch(e){
            console.error(e)
        }
    })

    chrome.storage.local.get("wordsSaved", (data) => console.log(data.wordsSaved))
})