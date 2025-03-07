document.addEventListener("DOMContentLoaded", () => {
  // Referencias a los elementos de configuración
  const promptInput = document.getElementById("promptInput");
  const deckInput = document.getElementById("deckInput");
  const ankiFrontInput = document.getElementById("ankiFrontInput");
  const ankiBackInput = document.getElementById("ankiBackInput");
  const pronInput = document.getElementById("pronunciationInput")
  const saveButton = document.getElementById("savePrompt");

  // Elementos para la visualización de las palabras conocidas por idioma
  const languagesContainer = document.getElementById("languagesContainer");
  const knownWordsDisplay = document.getElementById("knownWordsDisplay");
  
  // Cargar la configuración guardada
  chrome.storage.local.get(
    ["popupPrompt", "deckInput", "ankiFrontPrompt", "ankiBackPrompt", "pronunciationInput"],
    (data) => {
      console.log(data)
      if (data.popupPrompt || data.popupPrompt=="") promptInput.value = data.popupPrompt;
      if (data.deckInput || data.popupPrompt=="") deckInput.value = data.deckInput;
      if (data.ankiFrontPrompt || data.popupPrompt=="") ankiFrontInput.value = data.ankiFrontPrompt;
      if (data.ankiBackPrompt || data.popupPrompt=="") ankiBackInput.value = data.ankiBackPrompt;
      if (data.pronunciationInput) pronInput.value=data.pronunciationInput
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
      knownWordsDisplay.innerText = "No hay palabras conocidas guardadas.";
    }
  });

  // Función para mostrar las palabras conocidas como elementos clickables
  function displayKnownWords(idioma, palabrasObj, data) {
    // Limpiar el contenedor de palabras
    knownWordsDisplay.innerHTML = "";
    
    // Crear un título para el idioma
    const title = document.createElement("p");
    title.innerText = `Palabras en ${idioma}:`;
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
      popupPrompt: promptInput.value,
      deckInput: deckInput.value,
      ankiFrontPrompt: ankiFrontInput.value,
      ankiBackPrompt: ankiBackInput.value,
      pronunciationInput: pronInput.value
    });
    alert("Prompt saved!");
  });
});