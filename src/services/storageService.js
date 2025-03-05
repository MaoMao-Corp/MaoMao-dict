export const getLocalData = (keys)=>{
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, data=>resolve(data))
    })
}

export const setLocalData = (key, value) => {
    chrome.storage.local.set({ [key] : value})
}