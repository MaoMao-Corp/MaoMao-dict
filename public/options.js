
document.addEventListener("DOMContentLoaded", () => {
    const promptInput = document.getElementById("promptInput");
    const ankiInput = document.getElementById("ankiInput");
    const deckInput = document.getElementById("deckInput");
    const saveButton = document.getElementById("savePrompt");
  
    // Cargar el prompt guardado
    chrome.storage.local.get("miauPrompt", (data) => {
      if (data.miauPrompt) {
        promptInput.value = data.miauPrompt;
      }
    });
    chrome.storage.local.get("miauAnkiInput", (data) => {
      if (data.miauAnkiInput) {
        ankiInput.value = data.miauAnkiInput;
      }
    });
    chrome.storage.local.get("miauDeckInput", (data) => {
      if (data.miauDeckInput) {
        deckInput.value = data.miauDeckInput;
      }
    });
    
  
    // Guardar el prompt
    saveButton.addEventListener("click", () => {
      const newPrompt = promptInput.value;
      const newAnkiInput = ankiInput.value;
      const newDeckInput = deckInput.value;
      chrome.storage.local.set({ miauPrompt: newPrompt });
      chrome.storage.local.set({ miauAnkiInput: newAnkiInput });
      chrome.storage.local.set({ miauDeckInput: newDeckInput });
      alert("Prompt guardado!")
    });
  });
  