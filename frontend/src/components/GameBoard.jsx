import React, { useEffect, useState, useRef } from 'react';
import questions from '../data/questions.json';
import TimerOverlay from './TimerOverlay';
import { FaBackward, FaForward, FaStop, FaPlay, FaPause } from 'react-icons/fa';

const channel = new BroadcastChannel('jeopardy');

function GameBoard() {
    const [boardData, setBoardData] = useState([]);
    const [usedQuestions, setUsedQuestions] = useState([]);
    const [visibleQuestion, setVisibleQuestion] = useState(null);
    const [playerGuess, setPlayerGuess] = useState(null);
    const [showTimer, setShowTimer] = useState(false);
    const [players, setPlayers] = useState([]);
    const [awaitingBuzzerAssign, setAwaitingBuzzerAssign] = useState(null);
    const playersRef = useRef([]);
    const [buzzerReset, setBuzzerReset] = useState(false);
    const [doublePoints, setDoublePoints] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    const audioRef = useRef(null);
    const buzzerSoundRef = useRef(new Audio('/sounds/buzzer.mp3'));
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const visibleQuestionRef = useRef(null);
    const showTimerRef = useRef(false);

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
            ),
        }));
    };

    useEffect(() => {
        playersRef.current = players;
    }, [players]);

    useEffect(() => {
        visibleQuestionRef.current = visibleQuestion;
    }, [visibleQuestion]);

    useEffect(() => {
        showTimerRef.current = showTimer;
    }, [showTimer]);

    useEffect(() => {
        setBoardData(generateBoard());

        const ws = new WebSocket('ws://localhost:8000');
        ws.onmessage = (event) => {
            console.log('WebSocket message received:', event.data);
            const data = JSON.parse(event.data);
            if (data.message === 'BUTTON_PRESSED') {
                if (!visibleQuestionRef.current && !showTimerRef.current) {
                    return;
                }
                setAwaitingBuzzerAssign(null);
                buzzerSoundRef.current.play();
                const matchingPlayer = playersRef.current.find((p) => p.buzzerKey === data.spieler);
                setPlayerGuess(matchingPlayer ? matchingPlayer.name : data.spieler);
                setVisibleQuestion(null);
                setShowTimer(false);
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }
                setIsPlaying(false);
                setProgress(0);
            }
        }
        const handleMessage = (event) => {
            const { type, payload } = event.data;

            if (type === 'SHOW_QUESTION') {


                setVisibleQuestion(payload);
                setUsedQuestions((prev) => [...prev, payload.id]);
                setShowTimer(true);
                setIsPlaying(false);
                setProgress(0);
            }
            else if (type === 'TIMER_OVER') {
                setVisibleQuestion(null);
                setShowTimer(false);
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }
                setIsPlaying(false);
                setProgress(0);
            } else if (type === 'SET_PLAYERS') {
                setPlayers(payload);
            } else if (type === 'TOGGLE_DOUBLE_POINTS') {
                setDoublePoints(payload);
            } else if (type === 'NEW_BOARD_DATA') {
                setBoardData(payload);
                setUsedQuestions([]);
                setVisibleQuestion(null);
                setShowTimer(false);
                setIsPlaying(false);
                setProgress(0);
            } else if (type === 'RESET_GAME') {
                const newBoard = generateBoard();
                setBoardData(newBoard);
                setUsedQuestions([]);
                setVisibleQuestion(null);
                setShowTimer(false);
                setIsPlaying(false);
                setProgress(0);
            } else if (type === 'RESET_PLAYER_POINTS') {
                setPlayers((prev) =>
                    prev.map((p) => ({ ...p, points: 0, joker: true }))
                );
            } else if (type === 'RESET_QUESTION_COUNT') {
                setUsedQuestions([]);
                setVisibleQuestion(null);
                setShowTimer(false);
                setIsPlaying(false);
                setProgress(0);
            }
            else if (type === 'UNLOCK_BUZZER') {
                setBuzzerReset(payload);

                setTimeout(() => setBuzzerReset(false), 5000);
            } else if (type === 'AWAITING_BUZZER_ASSIGN') {
                setAwaitingBuzzerAssign(payload);
            }
        };

        channel.addEventListener('message', handleMessage);

        return () => {
            channel.removeEventListener('message', handleMessage);
        };
    }, []);

    useEffect(() => {
        let countdownInterval;
        if (playerGuess) {
            setTimeLeft(5);

            countdownInterval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(countdownInterval);
                        setPlayerGuess(null);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(countdownInterval);
    }, [playerGuess]);

    // Update progress as audio plays
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateProgress = () => {
            setProgress(audio.currentTime);
        };

        audio.addEventListener('timeupdate', updateProgress);

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
        };
    }, [visibleQuestion]);

    const handlePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio.play();
            setIsPlaying(true);
        }
    };

    const handleSeek = (event) => {
        const audio = audioRef.current;
        if (!audio) return;

        const newTime = Number(event.target.value);
        audio.currentTime = newTime;
        setProgress(newTime);
    };

    const handleRewind = () => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.currentTime = Math.max(0, audio.currentTime - 5);
        setProgress(audio.currentTime);
    };

    const handleForward = () => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
        setProgress(audio.currentTime);
    };

    return (
        <div className="min-h-screen bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-900 text-gray-100 p-6 flex flex-col">
            {/* Header */}
            <header className="mb-6 max-w-7xl mx-auto flex flex-col items-center space-y-4">
                <h1 className="text-5xl font-extrabold tracking-tight drop-shadow-lg">NerdQuizz</h1>
            </header>

            {/* Game Board */}
            <main className="max-w-9xl mx-auto mb-6">
                <div
                    className="grid gap-4 select-none "
                    style={{ gridTemplateColumns: 'repeat(7, 200px)' }}
                >
                    {boardData.map(({ category, questions }) => (
                        <div key={category} className="flex flex-col">
                            <div className="bg-indigo-700 text-center py-3 px-2 font-bold uppercase tracking-wide rounded-t-md shadow-inner">
                                {category}
                            </div>
                            {questions.map((q) => (
                                <button
                                    key={q.id}
                                    disabled={usedQuestions.includes(q.id)}
                                    className={`flex items-center justify-center h-20 rounded-b-md font-bold text-xl transition
                    ${usedQuestions.includes(q.id)
                                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            : 'bg-indigo-500 text-white cursor-pointer shadow-md'
                                        }`}
                                    aria-label={`Frage: ${q.question}, Wert: ${q.points} Punkte`}
                                >
                                    {doublePoints ? q.points * 2 : q.points}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
                {buzzerReset && (
                    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50">
                        Buzzer wurde zurückgesetzt!
                    </div>
                )}
            </main>

            {/* Player Scores */}
            <div className="max-w-7xl mx-auto">
                <h3 className="text-2xl font-semibold mb-4 text-center">Spielerpunkte</h3>
                {players.length === 0 ? (
                    <p className="text-center italic text-gray-500">Keine Spieler vorhanden.</p>
                ) : (
                    <div className="flex flex-wrap justify-center gap-6">
                        {players.map(({ name, points, joker }) => (
                            <div
                                key={name}
                                className="bg-gray-800 bg-opacity-60 rounded-lg p-5 min-w-[140px] flex flex-col items-center shadow-lg hover:bg-indigo-700 transition-colors"
                                title={joker ? 'Joker-Spieler' : ''}
                            >
                                <div className="flex items-center space-x-2 mb-3">
                                    {joker && (
                                        <img
                                            src="../public/images/joker.png"
                                            alt="Joker"
                                            className="w-14 h-14"
                                        />
                                    )}
                                    <span className="text-xl font-semibold truncate max-w-[100px]">{name}</span>
                                </div>
                                <div className="text-indigo-300 font-extrabold text-3xl">{points}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Question Overlay */}
            {visibleQuestion && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-6 z-50"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="question-title"
                    aria-describedby="question-text"
                >
                    <div className="bg-gray-900 rounded-lg max-w-3xl w-full p-8 shadow-xl space-y-6 text-center">
                        <h2 id="question-title" className="text-3xl font-bold tracking-wide">
                            {visibleQuestion.category}
                        </h2>
                        <p id="question-text" className="text-xl leading-relaxed">
                            {visibleQuestion.question}
                        </p>
                        {visibleQuestion.image && (
                            <img
                                src={visibleQuestion.image}
                                alt="Bild zur Frage"
                                className="mx-auto max-h-64 rounded-md shadow-md"
                            />
                        )}

                        {/* Audio Player */}
                        {visibleQuestion.sound && (
                            <div className="mt-4">
                                <audio
                                    ref={audioRef}
                                    src={visibleQuestion.sound}
                                    onEnded={() => setIsPlaying(false)}
                                />
                                <div className="flex items-center justify-center space-x-4 mt-2">
                                    <div className="bg-indigo-600 border border-indigo-600 p-2 rounded-full flexitems-center space-x-2">
                                        <button
                                            onClick={() => {
                                                if (audioRef.current) {
                                                    audioRef.current.currentTime = 0;
                                                    setProgress(0);
                                                }
                                                handlePlayPause();
                                            }}
                                            className="text-white px-3 py-1 rounded"
                                            aria-label="Audio neu starten"
                                        >
                                            <FaStop />
                                        </button>
                                        <button
                                            onClick={handleRewind}
                                            className="text-white px-3 py-1 rounded"
                                            aria-label="5 Sekunden zurückspulen"
                                        >
                                            <FaBackward />
                                        </button>
                                        <button
                                            onClick={handlePlayPause}
                                            className="text-white px-3 py-1 rounded"
                                        >
                                            {isPlaying ? <FaPause /> : <FaPlay />}
                                        </button>
                                        <button
                                            onClick={handleForward}
                                            className="text-white px-3 py-1 rounded"
                                            aria-label="5 Sekunden vorspulen"
                                        >
                                            <FaForward />
                                        </button>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={audioRef.current?.duration || 0}
                                    step="0.1"
                                    value={progress}
                                    onChange={handleSeek}
                                    className="w-full mt-4"
                                    aria-label="Audio Fortschrittsleiste"
                                />
                            </div>
                        )}

                        <button
                            className="mt-6 px-6 py-3 bg-red-600 rounded hover:bg-red-700 text-white font-semibold"
                            onClick={() => {
                                setVisibleQuestion(null);
                                setShowTimer(false);
                                if (audioRef.current) {
                                    audioRef.current.pause();
                                    audioRef.current.currentTime = 0;
                                }
                                setIsPlaying(false);
                                setProgress(0);
                            }}
                        >
                            Schließen
                        </button>
                    </div>
                </div>
            )}

            {/* Player Guess Overlay */}
            {playerGuess && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-6 z-50"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="guess-title"
                >

                    <div className="bg-gray-900 rounded-lg max-w-md w-full p-8 shadow-xl space-y-6 text-center">
                        <h2 id="guess-title" className="text-3xl font-bold tracking-wide mb-4">
                            {playerGuess}, du bist dran!
                        </h2>
                        <p className="text-lg font-medium text-gray-300">{timeLeft} Sekunde{timeLeft !== 1 ? 'n' : ''} verbleibend</p>
                        <button
                            className="mt-6 px-6 py-3 bg-red-600 rounded hover:bg-red-700 text-white font-semibold"
                            onClick={() => {
                                setPlayerGuess(null);
                            }}
                        >
                            Schließen
                        </button>
                    </div>
                </div>
            )}

            {/* Awaiting Buzzer Assignment Overlay */}
            {awaitingBuzzerAssign && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-6 z-40"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="assign-title"
                >
                    <div className="bg-gray-900 rounded-lg max-w-md w-full p-8 shadow-xl space-y-4 text-center">
                        <h2 id="assign-title" className="text-3xl font-bold tracking-wide">
                            Buzzer zuordnen
                        </h2>
                        <p className="text-lg font-medium text-gray-300">
                            {awaitingBuzzerAssign} drückt bitte jetzt seinen Buzzer zur Zuordnung.
                        </p>
                    </div>
                </div>
            )}

            {/* Timer Overlay */}
            {showTimer && (
                <TimerOverlay
                    onTimeOver={() => {
                        setVisibleQuestion(null);
                        setShowTimer(false);
                        if (audioRef.current) {
                            audioRef.current.pause();
                            audioRef.current.currentTime = 0;
                        }
                        setIsPlaying(false);
                        setProgress(0);
                    }}
                />
            )}

        </div>
    );
}

export default GameBoard;
