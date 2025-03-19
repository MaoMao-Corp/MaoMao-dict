import requests
import re
# Configuración de AnkiConnect
ANKI_CONNECT_URL = "http://localhost:8765"

def get_tag(text):
    
    tag = re.search( r"\((.+)\)$",text)
    print(tag)
    print(tag.group(1))
    return tag.group(1)


def add_a_to_default_deck():
    # Obtener todas las notas del mazo "Default"
    payload = {
        "action": "findNotes",
        "version": 6,
        "params": {"query": "deck:Default"}
    }
    response = requests.post(ANKI_CONNECT_URL, json=payload).json()
    note_ids = response.get("result", [])
    
        
    # Obtener los campos de cada nota
    payload = {
        "action": "notesInfo",
        "version": 6,
        "params": {"notes": note_ids}
    }
    response = requests.post(ANKI_CONNECT_URL, json=payload).json()
    notes_info = response.get("result", [])
    
    # Modificar cada nota agregando 'A' al primer campo
    for note in notes_info:
        note_id = note["noteId"]
        fields = note["fields"]
        first_field_name = list(fields.keys())[0]  # Obtener el primer campo
        print(fields[first_field_name]["value"])
        
        text = fields[first_field_name]["value"]
        tag = get_tag(text)
        print(tag)
        update_payload = {
            "action": "addTags",
            "version": 6,
            "params": {
                "notes": [note_id],
                "tags": tag
            }
        }
        requests.post(ANKI_CONNECT_URL, json=update_payload)
    
    print("Se ha agregado 'A' a todas las tarjetas del mazo 'Default'.")

if __name__ == "__main__":
    add_a_to_default_deck()