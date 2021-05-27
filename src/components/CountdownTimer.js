import React, { useState, useEffect } from "react";

function CountdownTimer() {
    const calculateTimeLeft = () => {
        const difference = +new Date("DEC 19, 2023 23:59:59") - +new Date();
        let timeLeft = {};

        // Time calculations for days, hours, minutes and seconds
        if (difference > 0) {
            timeLeft = {
                d: Math.floor(difference / (1000 * 60 * 60 * 24)),
                h: Math.floor(
                    (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                ),
                m: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                s: Math.floor((difference % (1000 * 60)) / 1000),
            };
        }

        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
    });

    const timerComponents = [];
    Object.keys(timeLeft).forEach((interval) => {
        // if (!timeLeft[interval]) {
        //     return;
        // }

        timerComponents.push(
            <span key={interval + " " + timeLeft[interval]}>
                {timeLeft[interval]}
                {interval}{" "}
            </span>
        );
    });

    return (
        <div className="container">
            <h1>
                {" "}
                {timerComponents.length ? (
                    timerComponents
                ) : (
                    <span>Time's up!</span>
                )}
            </h1>
        </div>
    );
}

export default CountdownTimer;
