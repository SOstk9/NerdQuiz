# NerdQuiz (Anwender-Guide)

## Kurzüberblick
NerdQuiz ist ein Jeopardy‑ähnliches Quiz mit zwei Ansichten:
- **Start/Board**: zeigt das Spielfeld und die Fragen.
- **Admin**: verwaltet Spieler, Punkte und schickt Fragen ans Board.

Optional kannst du einen **USB‑Encoder / Arcade‑Buzzer** verwenden. Dann braucht es zusätzlich den Python‑Client.

## So startest du alles (lokal)
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

## Hinweis zum Buzzer
Der USB‑Encoder liefert Tastendrücke an `backend/main.py`.
Diese werden per WebSocket an das Board geschickt.
Ohne laufenden WebSocket‑Server funktionieren Buzzer‑Events nicht.
