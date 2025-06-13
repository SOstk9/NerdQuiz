import React from 'react';

export default function StartScreen({ onStart, onAdmin }) {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900 text-white p-8">
            <h1 className="text-6xl font-extrabold mb-8 drop-shadow-lg">NerdQuizz</h1>
            <p className="mb-12 text-xl max-w-xl text-center">
                Jetzt wird abgequizzt!
            </p>
            <div className="flex gap-8">
                <button
                    onClick={onStart}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-lg font-semibold shadow-lg transition"
                >
                    Board
                </button>
                <button
                    onClick={onAdmin}
                    className="px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-lg font-semibold shadow-lg transition"
                >
                    Admin öffnen
                </button>
            </div>
        </div>
    );
}
