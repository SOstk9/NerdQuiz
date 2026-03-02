import asyncio
import json
import websockets


HOST = "127.0.0.1"
PORT = 8000

clients = set()
buzzer_open = False
assign_mode = False
allowed_buttons = set()


async def broadcast(message):
    if not clients:
        return
    dead = set()
    for ws in clients:
        try:
            await ws.send(message)
        except Exception:
            dead.add(ws)
    for ws in dead:
        clients.discard(ws)


async def handle_message(raw):
    global buzzer_open
    global assign_mode

    try:
        data = json.loads(raw)
    except Exception:
        data = None

    if isinstance(data, dict) and "button" in data:
        button = str(data["button"])
        if buzzer_open and (assign_mode or not allowed_buttons or button in allowed_buttons):
            buzzer_open = False
            assign_mode = False
            message = json.dumps(
                {"message": "BUTTON_PRESSED", "spieler": button}
            )
            await broadcast(message)
        return

    if isinstance(data, dict) and "type" in data:
        msg_type = data.get("type")
        if msg_type in {"SHOW_QUESTION", "START_TIMER"}:
            buzzer_open = True
            assign_mode = False
        elif msg_type == "ARM_BUZZER_ASSIGN":
            buzzer_open = True
            assign_mode = True
        elif msg_type in {"RESET_GAME", "RESET_QUESTION_COUNT", "TIMER_OVER"}:
            buzzer_open = False
            assign_mode = False
        elif msg_type == "SET_PLAYERS":
            payload = data.get("payload") or []
            allowed_buttons.clear()
            for p in payload:
                key = p.get("buzzerKey")
                if key is not None and key != "":
                    allowed_buttons.add(str(key))
        await broadcast(json.dumps(data))
        return

    # Fallback: forward raw
    await broadcast(raw)


async def handler(ws):
    clients.add(ws)
    try:
        async for message in ws:
            await handle_message(message)
    finally:
        clients.discard(ws)


async def main():
    async with websockets.serve(handler, HOST, PORT):
        print(f"WebSocket server running on ws://{HOST}:{PORT}")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
