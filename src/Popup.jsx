import { useRef, useEffect } from "react";
import React from 'react';

function Popup({isOpen,selectedText, }) {
    if (!isOpen) return null;
    return(
        <>
            {isOpen && <h2>{selectedText}</h2>}
        </>
    )
}

export default Popup