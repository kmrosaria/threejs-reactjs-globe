import React from 'react';
import Globe from './globe/Globe'
import CountdownTimer from './CountdownTimer'

function Home ( {t} ) {
    return (
        <div>
            <CountdownTimer />
            <Globe />
        </div>
    )
}

export default Home;
