import React, { useState, useEffect, useRef } from 'react';
import questions from '../data/questions.json';

const channel = new BroadcastChannel('jeopardy');

function AdminPanel() {
    const [players, setPlayers] = useState([]);
    const [newPlayer, setNewPlayer] = useState('');
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [pointInputs, setPointInputs] = useState({});
    const [questionCount, setQuestionCount] = useState(0);
    const [doublePoints, setDoublePoints] = useState(false);
    const [usedQuestions, setUsedQuestions] = useState([]);
    const [boardData, setBoardData] = useState([]);
    const ws =useRef(null);

    const addPlayer = () => {
        if (newPlayer.trim() && !players.some((p) => p.name === newPlayer.trim())) {
            const updated = [...players, { name: newPlayer.trim(), points: 0, joker: true }];
            setPlayers(updated);
            setNewPlayer('');
        }
    };

    const removePlayer = (name) => {
        const updated = players.filter((p) => p.name !== name);
        setPlayers(updated);
    };

    const sendPlayers = () => {
        channel.postMessage({ type: 'SET_PLAYERS', payload: players });
    };

    const showQuestion = (question) => {
        setSelectedQuestion(question);
        channel.postMessage({ type: 'SHOW_QUESTION', payload: question });
        channel.postMessage({ type: 'START_TIMER' });
        setUsedQuestions((prev) => [...prev, question.id]);
        setQuestionCount((count) => count + 1);
    };

    const updatePoints = (name, delta) => {
        const updated = players.map((p) =>
            p.name === name ? { ...p, points: p.points + delta } : p
        );
        setPlayers(updated);
        channel.postMessage({ type: 'SET_PLAYERS', payload: updated });
    };

    const toggleDoublePoints = () => {
        const newValue = !doublePoints;
        setDoublePoints(newValue);
        channel.postMessage({ type: 'TOGGLE_DOUBLE_POINTS', payload: newValue });
    };

    const unlockBuzzer = () => {
    if (ws.current) {
        console.log('WebSocket readyState:', ws.current.readyState);
    }
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send('UNLOCK_BUZZER');
        console.log('UNLOCK_BUZZER message sent to server');
    } else {
        console.warn('WebSocket connection is not open.');
    }
};

    const generateBoard = () => {
        const grouped = {};
        questions.forEach((q) => {
            if (!grouped[q.category]) grouped[q.category] = [];
            grouped[q.category].push(q);
        });

        const allCategories = Object.keys(grouped).filter((cat) =>
            [100, 200, 400, 600, 1000].every((pts) =>
                grouped[cat].some((q) => q.points === pts)
            )
        );

        const selectedCategories = allCategories
            .sort(() => Math.random() - 0.5)
            .slice(0, 7);

        return selectedCategories.map((cat) => ({
            category: cat,
            questions: [100, 200, 400, 600, 1000].map(
                (pts) => grouped[cat].find((q) => q.points === pts)
            )
        }));
    };

    const handleReset = () => {
        const newBoard = generateBoard();
        setBoardData(newBoard);
        setUsedQuestions([]);
        setQuestionCount(0);
        setPlayers((prevPlayers) => prevPlayers.map(p => ({ ...p, points: 0, joker: true })));

        channel.postMessage({ type: 'RESET_GAME' });
        channel.postMessage({ type: 'RESET_PLAYER_POINTS' });
        channel.postMessage({ type: 'RESET_QUESTION_COUNT' });
        channel.postMessage({ type: 'NEW_BOARD_DATA', payload: newBoard });
        channel.postMessage({ type: 'SET_PLAYERS', payload: players });
    };

    useEffect(() => {
        setBoardData(generateBoard());

        ws.current = new WebSocket('ws://localhost:8000'); // Adjust the URL as needed
        ws.current.onopen = () => {
            console.log('WebSocket connection established');
        };

    
        const handleMessage = (event) => {
            const { type, payload } = event.data;

            if (type === 'RESET_QUESTION_COUNT') {
                setQuestionCount(0);
                setUsedQuestions([]);
            } else if (type === 'TOGGLE_DOUBLE_POINTS') {
                setDoublePoints(payload);
            } else if (type === 'RESET_PLAYER_POINTS') {
                setPlayers((prevPlayers) => prevPlayers.map(p => ({ ...p, points: 0, joker: true })));
            } else if (type === 'NEW_BOARD_DATA') {
                setBoardData(payload);
                setUsedQuestions([]);
                setQuestionCount(0);
            } else if (type === 'SET_PLAYERS') {
                setPlayers(payload);
            }
        };

        channel.addEventListener('message', handleMessage);

        return () => {
            channel.removeEventListener('message', handleMessage);
        };
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>

            <div className="mb-4 font-semibold">
                Gespielte Fragen: {questionCount}
            </div>

            <div className="mb-6">
                <button
                    onClick={toggleDoublePoints}
                    className={`px-4 py-2 rounded ${doublePoints ? 'bg-green-600 text-white' : 'bg-gray-400 text-black'}`}
                >
                    {doublePoints ? 'Punkte verdoppelt ✔' : 'Punkte verdoppeln'}
                </button>
            </div>

            <div className="mb-6">
                <input
                    value={newPlayer}
                    onChange={(e) => setNewPlayer(e.target.value)}
                    placeholder="Spielername"
                    className="border px-2 py-1 rounded mr-2"
                />
                <button onClick={addPlayer} className="bg-blue-600 text-white px-4 py-1 rounded">
                    Hinzufügen
                </button>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Spieler</h2>
                <ul className="space-y-2">
                    {players.map((p) => (
                        <li key={p.name} className="border p-3 rounded flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">
                                    {p.name}: {p.points} Punkte
                                </span>
                                <button
                                    onClick={() => removePlayer(p.name)}
                                    className="text-red-500 hover:underline"
                                >
                                    Entfernen
                                </button>
                            </div>

                            <div className="flex items-center gap-4">
                                <span>Joker:</span>
                                <button
                                    onClick={() => {
                                        const updated = players.map((pl) =>
                                            pl.name === p.name ? { ...pl, joker: !pl.joker } : pl
                                        );
                                        setPlayers(updated);
                                        channel.postMessage({ type: 'SET_PLAYERS', payload: updated });
                                    }}
                                    className={`px-3 py-1 rounded text-white ${p.joker ? 'bg-green-600' : 'bg-gray-500'}`}
                                >
                                    {p.joker ? '✔ Aktiv' : '✘ Inaktiv'}
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={pointInputs[p.name] || ''}
                                    onChange={(e) =>
                                        setPointInputs({
                                            ...pointInputs,
                                            [p.name]: e.target.value,
                                        })
                                    }
                                    placeholder="Punkte"
                                    className="border px-2 py-1 rounded w-24"
                                />

                                <button
                                    onClick={() => {
                                        const val = parseInt(pointInputs[p.name]);
                                        if (!isNaN(val)) updatePoints(p.name, val);
                                    }}
                                    className="bg-green-600 text-white px-3 py-1 rounded"
                                >
                                    +
                                </button>

                                <button
                                    onClick={() => {
                                        const val = parseInt(pointInputs[p.name]);
                                        if (!isNaN(val)) updatePoints(p.name, -val);
                                    }}
                                    className="bg-red-600 text-white px-3 py-1 rounded"
                                >
                                    -
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>

                <button
                    onClick={sendPlayers}
                    className="mt-4 bg-green-700 text-white px-4 py-2 rounded"
                >
                    An Spielbrett senden
                </button>
            </div>

            {/* Reset Button */}
            <div className="mt-6">
                <button
                    onClick={handleReset}
                    className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded text-white font-semibold shadow"
                >
                    Spiel zurücksetzen
                </button>
            </div>

            {/*Buzzer freigeben */}
            <div className="mt-6">
                <button
                    onClick={unlockBuzzer}
                    className="bg-yellow-500 hover:bg-yellow-600 px-6 py-2 rounded text-white font-semibold shadow"
                >
                    Buzzer freigeben
                </button>
            </div>
            {/* Fragenraster mit Frage + Antwort + Senden-Button */}
            <div className="grid grid-cols-7 gap-4 mt-8">
                {boardData.map((cat) => (
                    <div key={cat.category}>
                        <div className="bg-indigo-500 text-white text-center p-2 font-bold uppercase rounded-t">
                            {cat.category}
                        </div>
                        {cat.questions.map((q) => (
                            <div key={q.id} className={`border border-blue-400 p-3 rounded mb-2 bg-white text-black`}>
                                <p className="font-bold text-lg mb-1 text-center">
                                    {doublePoints ? q.points * 2 : q.points}</p>
                                <p className="font-semibold text-center">{q.question}</p>
                                <p className="text-sm italic text-green-700 mb-2 text-center">Antwort: {q.answer}</p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        showQuestion(q);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                                >
                                    Frage ans Spielbrett senden
                                </button>
                            </div>

                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AdminPanel;
