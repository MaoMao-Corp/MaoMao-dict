import { useState } from "react"
import { getExamples } from "../services/apiService"

export function Examples ({word, sentence, definition, lang, codeLang, checkIfPhraseSaved, setSentence, setDefinition}) {
    const [examples, setExamples] = useState([])
    
    const handleExamples = async (word, lang) => {
        const newExamples = await getExamples(word, lang)
        setExamples(newExamples)
    }

    const handleClickExample = (index) => {
        const currentExamples = examples

        checkIfPhraseSaved(lang, word, Object.keys(currentExamples)[index])
        setSentence(Object.keys(currentExamples)[index])
        setDefinition(Object.values(currentExamples)[index])

        delete currentExamples[Object.keys(currentExamples)[index]]
        currentExamples[sentence]= definition
        setExamples(currentExamples)
    }

    return (
        <div>
            <p className="example-hitbox" onClick={()=>handleExamples(word, codeLang)}>Examples</p>
            <ul className="examples-list">
                {
                    Object.keys(examples).length>0 && 
                    Object.keys(examples).map((example, index)=>
                        <li 
                            key={index} 
                            className="example" 
                            onClick={()=>handleClickExample(index)}> 
                            {example} 
                        </li>
                    )
                }
            </ul>
        </div>
    )
}