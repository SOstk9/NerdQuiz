# NerdQuiz (Anwender-Guide)


NerdQuiz ist ein Quiz, das vom Rocketbeans‑Nerdquiz inspiriert ist.


## Voraussetzungen
- am besten 2 Monitore, einen großen für das Board, welches die Spieler sehen und einen für das Adminpanel
- Arcadebuzzer, oder Tastatur



## So startest du alles (lokal)
Bitte vorher in der main.py die Liste in `ALLOWED_SCAN_CODES = set()` leeren und prüfen, welche Scan-Codes die Buzzer haben
(im Terminal geloggt). Im Anschluss die Scan-Codes in die Liste einfügen (z.B. `ALLOWED_SCAN_CODES = set([1,2,3]`).

Danach einmalig vorher:

```bash
# Frontend-Abhängigkeiten
cd frontend
npm install

# Python-Abhängigkeiten
python -m pip install -r backend/requirements.txt
```

Du brauchst drei laufende Prozesse in drei Terminals:

1. **WebSocket‑Server**
```bash
python backend/ws_server.py
```

2. **Frontend**
```bash
cd frontend
npm run dev
```

3. **Buzzer‑Client (optional)**
```bash
python backend/main.py
```

## Spielablauf
1. Öffne die Startseite im Browser (Vite zeigt dir die URL im Terminal).
2. Klicke **Board** für das Spielfeld oder **Admin öffnen** für das Admin‑Panel.
3. Im Admin‑Panel:
   - Spieler hinzufügen
   - Punkte vergeben
   - Fragen ans Board senden
   - Spiel zurücksetzen
4. Im Board:
   - Frage wird als Overlay angezeigt
   - Timer läuft
   - Buzzer‑Ereignisse werden angezeigt (falls der Buzzer‑Client läuft)
