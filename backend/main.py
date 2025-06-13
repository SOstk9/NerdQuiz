import asyncio
import keyboard  # für Tastendruck-Events
import websockets
import json

WS_URI = 'ws://dein-websocket-server:port'  # Hier WebSocket-URL anpassen

pressed = False

async def send_button(button):
    async with websockets.connect(WS_URI) as websocket:
        msg = json.dumps({"button": button})
        await websocket.send(msg)
        print(f"Gesendet: {msg}")

def on_key_event(event):
    global pressed
    if pressed:
        print(f"Ignoriere weiteren Tastendruck: {event.name}")
        return

    if event.event_type == 'down':
        print(f"Taste gedrückt: {event.name}")
        pressed = True
        # WebSocket Nachricht senden (async muss in Thread oder Loop)
        asyncio.run(send_button(event.name))

def main():
    print("Warte auf Tastendruck (USB Encoder Buttons)...")
    keyboard.hook(on_key_event)
    keyboard.wait()  # blockiert und hört auf Tastendrücke

if __name__ == "__main__":
    main()
