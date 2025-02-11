
document.addEventListener("DOMContentLoaded", () => {
    const promptInput = document.getElementById("promptInput");
    const deckInput = document.getElementById("deckInput");
    const ankiFrontInput = document.getElementById("ankiFrontInput");
    const ankiBackInput = document.getElementById("ankiBackInput")
    const saveButton = document.getElementById("savePrompt");
  
    // Cargar el prompt guardado
    chrome.storage.local.get("popupPrompt", (data) => {
      if (data.popupPrompt) {
        promptInput.value = data.popupPrompt;
      }
    });
    chrome.storage.local.get("deckInput", (data) => {
      if (data.deckInput) {
        deckInput.value = data.deckInput;
      }
    });
    chrome.storage.local.get("ankiFrontPrompt", (data) => {
      if (data.ankiFrontPrompt) {
        ankiFrontInput.value = data.ankiFrontPrompt;
      }
    });
    
    chrome.storage.local.get("ankiBackPrompt", (data) => {
      if (data.ankiBackPrompt) {
        ankiBackInput.value = data.ankiBackPrompt;
      }
    });
    // Guardar el prompt
    saveButton.addEventListener("click", () => {
      const newPrompt = promptInput.value;
      const newDeckInput = deckInput.value;
      const newAnkiFrontInput = ankiFrontInput.value;
      const newAnkiBackInput = ankiBackInput.value;
      
      chrome.storage.local.set({ popupPrompt: newPrompt });
      chrome.storage.local.set({ deckInput: newDeckInput });
      chrome.storage.local.set({ ankiFrontPrompt: newAnkiFrontInput});
      chrome.storage.local.set({ ankiBackPrompt: newAnkiBackInput});

      alert("Prompt saved!")
    });
  });
  