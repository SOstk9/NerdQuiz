import asyncio
import keyboard
import websockets
import json

WS_URI = 'ws://localhost:8000'


ALLOWED_SCAN_CODES = set([1, 2, 3])


async def send_button(button):
    async with websockets.connect(WS_URI) as websocket:
        msg = json.dumps({"button": button})
        await websocket.send(msg)
        print(f"Gesendet: {msg}")


def on_key_event(event):
    if ALLOWED_SCAN_CODES and event.scan_code not in ALLOWED_SCAN_CODES:
        return

    if event.event_type == 'down':
        print(f"Taste gedrückt: name={event.name} scan_code={event.scan_code}")
        button_id = event.name if event.name is not None else str(
            event.scan_code)
        asyncio.run(send_button(button_id))


def main():
    print("Warte auf Buzzerdruck...")
    keyboard.hook(on_key_event)
    keyboard.wait()


if __name__ == "__main__":
    main()
