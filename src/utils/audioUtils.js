export  const play_audio = (audio64) => {
    const binaryData = atob(audio64); // Decodificar base64 a binario
    const arrayBuffer = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
        arrayBuffer[i] = binaryData.charCodeAt(i);
    }
    const blob = new Blob([arrayBuffer], { type: "audio/mp3" });
    const url = URL.createObjectURL(blob);
    
    // Crear un objeto de audio y reproducirlo directamente
    const audio = new Audio(url);
    audio.play();
}
