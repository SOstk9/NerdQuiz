import React, { useEffect, useState } from 'react';

function TimerOverlay() {
    const [timeLeft, setTimeLeft] = useState(30);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-yellow-300 text-black font-bold px-6 py-4 rounded-xl shadow-lg text-xl animate-pulse">
                ⏳ {timeLeft}s
            </div>
        </div>
    );
}

export default TimerOverlay;