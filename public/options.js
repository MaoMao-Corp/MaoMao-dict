document.addEventListener("DOMContentLoaded", () => {
  // Referencias a los elementos de configuración
  const promptInput = document.getElementById("promptInput");
  const deckInput = document.getElementById("deckInput");
  const ankiFrontInput = document.getElementById("ankiFrontInput");
  const ankiBackInput = document.getElementById("ankiBackInput");
  const pronInput = document.getElementById("pronuntiationInput")
  const saveButton = document.getElementById("savePrompt");

  // Elementos para la visualización de las palabras conocidas por idioma
  const languagesContainer = document.getElementById("languagesContainer");
  const knownWordsDisplay = document.getElementById("knownWordsDisplay");
  languagesContainer.style.display = "flex";
  languagesContainer.style.gap = "8px";

  // Cargar la configuración guardada
  chrome.storage.local.get(
    ["popupPrompt", "deckInput", "ankiFrontPrompt", "ankiBackPrompt", "pronuntiationInput"],
    (data) => {
      console.log(data)
      if (data.popupPrompt || data.popupPrompt=="") promptInput.value = data.popupPrompt;
      if (data.deckInput || data.popupPrompt=="") deckInput.value = data.deckInput;
      if (data.ankiFrontPrompt || data.popupPrompt=="") ankiFrontInput.value = data.ankiFrontPrompt;
      if (data.ankiBackPrompt || data.popupPrompt=="") ankiBackInput.value = data.ankiBackPrompt;
      if (data.pronuntiationInput) pronInput.value=data.pronuntiationInput
    }
  );

  // Cargar el diccionario de palabras conocidas
  chrome.storage.local.get("wordsNsentences", (data) => {
    if (data.wordsNsentences && Object.keys(data.wordsNsentences).length > 0) {
      const idiomas = Object.keys(data.wordsNsentences);
      idiomas.forEach((idioma, index) => {
        // Crear un botón para cada idioma
        const languageButton = document.createElement("button");
        languageButton.innerText = idioma;
        languageButton.classList.add("language-button");
        languageButton.style.padding = "8px 0px";
        languageButton.style.fontSize = "14px";
        languageButton.style.borderRadius = "12px";
        
        // Seleccionar el primer idioma por defecto
        if (index === 0) {
          displayKnownWords(idioma, Object.keys(data.wordsNsentences[idioma]));
        }

        // Evento para mostrar palabras del idioma seleccionado
        languageButton.addEventListener("click", () => {
          displayKnownWords(idioma, Object.keys(data.wordsNsentences[idioma]));
        });

        languagesContainer.appendChild(languageButton);
      });
    } else {
      knownWordsDisplay.innerText = "No hay palabras conocidas guardadas.";
    }
  });

  // Función para mostrar las palabras conocidas
  function displayKnownWords(idioma, palabrasArray) {
    knownWordsDisplay.innerText = `Palabras en ${idioma}: ${palabrasArray.join(", ")}`;
  }

  // Guardar la configuración
  saveButton.addEventListener("click", () => {
    chrome.storage.local.set({
      popupPrompt: promptInput.value,
      deckInput: deckInput.value,
      ankiFrontPrompt: ankiFrontInput.value,
      ankiBackPrompt: ankiBackInput.value,
      pronuntiationInput: pronInput.value
    });
    alert("Prompt saved!");
  });
});
