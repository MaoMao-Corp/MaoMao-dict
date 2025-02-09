
document.addEventListener("DOMContentLoaded", () => {
    const promptInput = document.getElementById("promptInput");
    const saveButton = document.getElementById("savePrompt");
  
    // Cargar el prompt guardado
    chrome.storage.local.get("miauPrompt", (data) => {
      if (data.miauPrompt) {
        promptInput.value = data.miauPrompt;
      }
    });
  
    // Guardar el prompt
    saveButton.addEventListener("click", () => {
      const newPrompt = promptInput.value;
      chrome.storage.local.set({ miauPrompt: newPrompt }, () => {
        alert("Prompt guardado!");
      });
    });
  });
  