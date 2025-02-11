
document.addEventListener("DOMContentLoaded", () => {
    const promptInput = document.getElementById("promptInput");
    const ankiInput = document.getElementById("ankiInput");
    const deckInput = document.getElementById("deckInput");
    const saveButton = document.getElementById("savePrompt");
  
    // Cargar el prompt guardado
    chrome.storage.local.get("popupPrompt", (data) => {
      if (data.popupPrompt) {
        promptInput.value = data.popupPrompt;
      }
    });
    chrome.storage.local.get("ankiPrompt", (data) => {
      if (data.ankiPrompt) {
        ankiInput.value = data.ankiPrompt;
      }
    });
    chrome.storage.local.get("deckInput", (data) => {
      if (data.deckInput) {
        deckInput.value = data.deckInput;
      }
    });
    
  
    // Guardar el prompt
    saveButton.addEventListener("click", () => {
      const newPrompt = promptInput.value;
      const newAnkiInput = ankiInput.value;
      const newDeckInput = deckInput.value;
      chrome.storage.local.set({ popupPrompt: newPrompt });
      chrome.storage.local.set({ ankiPrompt: newAnkiInput });
      chrome.storage.local.set({ deckInput: newDeckInput });
      alert("Prompt saved!")
    });
  });
  