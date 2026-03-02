import asyncio
import keyboard
import websockets
import json

WS_URI = 'ws://localhost:8000'

pressed = False


async def send_button(button):
    async with websockets.connect(WS_URI) as websocket:
        msg = json.dumps({"button": button})
        await websocket.send(msg)
        print(f"Gesendet: {msg}")


def on_key_event(event):
    global pressed
    if pressed:
        print(f"Ignoriere weitere Buzzer: {event.name}")
        return

    if event.event_type == 'down':
        print(f"Taste gedrückt: {event.name}")
        pressed = True
        asyncio.run(send_button(event.name))


def main():
    print("Warte auf Buzzerdruck...")
    keyboard.hook(on_key_event)
    keyboard.wait()


if __name__ == "__main__":
    main()
