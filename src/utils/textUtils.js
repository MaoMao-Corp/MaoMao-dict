
export const getGlobalOffset = (root, node, localOffset) => {
    let offset = 0
  
    /**
     * Recursive function that traverses nodes in preorder.
     * When it finds the target node, it adds the local offset and ends.
     */
    const traverse = (current) => {
        if (current === node) {
            offset += localOffset;
            return true // Found the node
        }
  
        // If it's a text node, add its length.
        if (current.nodeType === Node.TEXT_NODE) {
            offset += current.textContent.length
        }
  
        // Traverse child nodes.
        for (let i = 0; i < current.childNodes.length; i++) {
            const child = current.childNodes[i]
            if (traverse(child)) return true
        return false
        }
    }
    traverse(root)
    return offset
}
  
export const extractSentence = (text, offset) => {
    let start = offset;
    let end = offset;
  
    // Define sentence-ending punctuation for Korean, Chinese, and Japanese.
    const sentenceEndPattern = /[。！？\n]/; // Use common punctuation
  
    // Move backward to find the start of the sentence.
    while (start > 0 && !sentenceEndPattern.test(text[start - 1])) {
        start--;
    }
    
    // Move forward to find the end of the sentence.
    while (end < text.length && !sentenceEndPattern.test(text[end])) {
        end++;
    }
  
    // Return the sentence in the range.
    return text.slice(start, end).trim();
  };
