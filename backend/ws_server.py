import asyncio
import json
import websockets


HOST = "127.0.0.1"
PORT = 8000

clients = set()


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

    try:
        data = json.loads(raw)
    except Exception:
        data = None

    if isinstance(data, dict) and "button" in data:
        message = json.dumps(
            {"message": "BUTTON_PRESSED", "spieler": data["button"]}
        )
        await broadcast(message)
        return

    if raw == "UNLOCK_BUZZER":
        message = json.dumps({"type": "UNLOCK_BUZZER", "payload": True})
        await broadcast(message)
        return

    if isinstance(data, dict) and "type" in data:
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
