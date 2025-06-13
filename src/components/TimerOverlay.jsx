import React, { useEffect, useState } from 'react';

function TimerOverlay({ onTimeOver }) {
    const [timeLeft, setTimeLeft] = useState(30);

    useEffect(() => {
        if (timeLeft === 0) {
            onTimeOver(); // <- Keine BroadcastChannel-Nutzung hier!
            return;
        }

        const timer = setTimeout(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [timeLeft, onTimeOver]);

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-yellow-300 text-black font-bold px-6 py-4 rounded-xl shadow-lg text-xl animate-pulse">
                ⏳ {timeLeft}s
            </div>
        </div>
    );
}

export default TimerOverlay;
