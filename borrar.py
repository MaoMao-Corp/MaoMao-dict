import requests

# Configurar la URL de AnkiConnect
ANKICONNECT_URL = "http://127.0.0.1:8765"

# Función para enviar comandos a AnkiConnect
def anki_connect(action, params={}):
    return requests.post(ANKICONNECT_URL, json={"action": action, "version": 6, "params": params}).json()

# Obtener todos los tags
response = anki_connect("getTags")

# Verificar si la respuesta es válida
tags = response.get("result", []) if response.get("error") is None else []

# Imprimir los tags únicos
print("Tags en Anki:")
for tag in sorted(tags):
    print(tag)
