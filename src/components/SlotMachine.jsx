import React, { useState, useEffect, useRef } from 'react';
import './SlotMachine.css';
import Confetti from 'react-confetti'; // Import the confetti library

const SlotMachine = () => {
  const employees = Array.from({ length: 500 }, (_, i) => `Employee ${i + 1}`);
  const [winnerIndex, setWinnerIndex] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [showDrawBoxes, setShowDrawBoxes] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  const [currentSongIndex, setCurrentSongIndex] = useState(0); 
  const audioRef = useRef(null);
  const intervalRef = useRef(null); 

  // Define the songs
  const songs = [
    '/song2.mp3', 

  ];

  useEffect(() => {
    const audio = audioRef.current;

    if (isDrawing) {
      audio.play();

      // Determine winner when the song ends
      audio.addEventListener('ended', () => {
        clearInterval(intervalRef.current); 
        const winner = Math.floor(Math.random() * employees.length);
        setWinnerIndex(winner);
        setHighlightIndex(null);
        setIsDrawing(false); 
        setShowDrawBoxes(false);
        setShowConfetti(true); 
        alert(`🎉 Congratulations! The winner is ${employees[winner]}!`); 
      });
    } else {
      audio.pause();
      audio.currentTime = 0; 
    }

    return () => { 
      // Clean up event listener when the component unmounts
      if (audio) {
        audio.removeEventListener('ended', () => {}); 
      }
    };
  }, [isDrawing, songs[currentSongIndex]]); 

  const drawWinner = () => {
    setIsDrawing(true); 
    setWinnerIndex(null); 
    setHighlightIndex(null); 

    // Start the animation (you can adjust the interval as needed)
    intervalRef.current = setInterval(() => { 
      setHighlightIndex(Math.floor(Math.random() * employees.length)); 
    }, 150); 
  };

  const handleDrawButtonClick = () => {
    setShowDrawBoxes(true);
    setShowConfetti(false);
    // Increment song index for the next draw
    setCurrentSongIndex((prevIndex) => (prevIndex + 1) % songs.length); 
    drawWinner();
  };

  return (
    <div className="app">
      <h1>🎰 Lucky Box Draw 🎉</h1>
      {!showDrawBoxes && (
        <button className="start-button" onClick={handleDrawButtonClick}>
          <span className="button-text">Start Draw</span>
          <span className="button-icon">✨</span>
        </button>
      )}
      {showDrawBoxes && (
        <div className="grid">
          {employees.map((employee, index) => (
            <div
              key={index}
              className={`box ${
                index === winnerIndex ? 'winner' : index === highlightIndex ? 'highlight' : ''
              }`}
            >
              {employee}
            </div>
          ))}
        </div>
      )}
      {showConfetti && <Confetti />}
      <audio ref={audioRef} src={songs[currentSongIndex]} /> 
    </div>
  );
};

export default SlotMachine;