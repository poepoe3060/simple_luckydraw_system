import React, { useState, useEffect, useRef } from 'react';
import './SlotMachine.css';
import Confetti from 'react-confetti';

// Import the JSON data directly
import employeesData from '../Staff_Party_Attendee.json';

const WinnerAnnouncement = ({ winner, onNewDraw, showWinner, showCongratsMessage }) => {
  const [showDrawButton, setShowDrawButton] = useState(false);

  useEffect(() => {
    // Start a timer to show the button after 7 seconds
    const timer = setTimeout(() => {
      setShowDrawButton(true);
    }, 7000);

    return () => clearTimeout(timer); // Cleanup the timer on component unmount
  }, []); // Empty dependency array ensures this runs only on initial render

  return (
    <div className={`winner-announcement ${showWinner ? 'visible' : ''}`}>
      {showCongratsMessage && (
        <h2 className={`winner-heading ${showCongratsMessage ? 'visible' : ''}`}>
          🎉 Congratulations! 🎉
        </h2>
      )}
      <h3 className="winner-name">{`The winner is: ${winner.employee_name} (ID: ${winner.employee_id})`}</h3>
      {showDrawButton && ( // Only render the button after 7 seconds
        <button className="new-draw-button" onClick={onNewDraw}>
          Start New Draw
        </button>
      )}
    </div>
  );
};


const SlotMachine = () => {
  const [employees, setEmployees] = useState(employeesData);
  const [winnerIndex, setWinnerIndex] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [screenState, setScreenState] = useState('start');
  const [showConfetti, setShowConfetti] = useState(false);
  const [winners, setWinners] = useState([]);
  const [winner, setWinner] = useState(null);
  const [showWinner, setShowWinner] = useState(false);
  const [shatterAnimation, setShatterAnimation] = useState(false);
  const [showCongratsMessage, setShowCongratsMessage] = useState(false);

  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  const lastHighlightRef = useRef(null);

  const songs = ['/song_one.MP3', '/song_two.MP3', '/song_three.MP3', '/pink soldier.MP3'];
  const [currentSongIndex, setCurrentSongIndex] = useState(0);  // Track the current song index

  const initialSelectionInterval = 200;
  const finalSelectionInterval = 1000;
  const slowDownTime = 10000;

  useEffect(() => {
    const audio = audioRef.current;

    if (isDrawing) {
      audio.play();
      setShowConfetti(false);

      const handleAudioEnd = () => {
        clearInterval(intervalRef.current); // Stop the random selection when audio ends
        const finalWinnerIndex = lastHighlightRef.current;
        setWinnerIndex(finalWinnerIndex);
        setWinner(employees[finalWinnerIndex]); // Lock the winner at the end
        setHighlightIndex(finalWinnerIndex);
        setIsDrawing(false);
        setShowConfetti(true);
        setWinners((prev) => [...prev, employees[finalWinnerIndex]]);
        
        // Show the Congratulations message after a delay
        setTimeout(() => {
          setShowCongratsMessage(true); // Show the Congratulations message after a delay
        }, 500); // Delay for smooth transition after song ends
      };

      audio.addEventListener('ended', handleAudioEnd);

      const songDuration = audio.duration * 1000;

      const calculateSelectionInterval = (remainingTime) => {
        if (remainingTime > songDuration - slowDownTime) {
          return initialSelectionInterval;
        } else {
          const remainingSlowdownTime = songDuration - slowDownTime - remainingTime;
          const ratio = Math.min(remainingSlowdownTime / slowDownTime, 1);
          const interval = initialSelectionInterval + (finalSelectionInterval - initialSelectionInterval) * ratio;
          return Math.floor(interval);
        }
      };

      let startTime = Date.now();
      let remainingTime = songDuration;

      const updateSelection = () => {
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;
        remainingTime = songDuration - elapsedTime;

        if (remainingTime <= 0) {
          clearInterval(intervalRef.current);
          handleAudioEnd();
          return;
        }

        const randomIndex = Math.floor(Math.random() * employees.length);
        lastHighlightRef.current = randomIndex;
        setHighlightIndex(randomIndex);
        setWinner(employees[randomIndex]); // Continuously update winner until song ends

        const interval = calculateSelectionInterval(remainingTime);
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(updateSelection, interval);
      };

      // Show winner popup 5 seconds before the song ends
      setTimeout(() => {
        setShowWinner(true); // Show the winner popup
        setScreenState('announcement');
        setShatterAnimation(true); // Trigger shatter animation
      }, songDuration - 5000); // 5 seconds before song ends

      intervalRef.current = setInterval(updateSelection, initialSelectionInterval);

      return () => {
        audio.removeEventListener('ended', handleAudioEnd);
        clearInterval(intervalRef.current); // Clear the interval when component is unmounted
      };
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [isDrawing, winners, slowDownTime, employees]);

  // Handle looping the song list
  useEffect(() => {
    const audio = audioRef.current;

    const handleSongEnd = () => {
      // Update to next song in the array, or back to the first one if it's the last song
      const nextSongIndex = (currentSongIndex + 1) % songs.length;
      setCurrentSongIndex(nextSongIndex);
      audio.src = songs[nextSongIndex];  // Update the audio source to the next song
      audio.play();  // Play the next song
    };

    audio.addEventListener('ended', handleSongEnd);

    return () => {
      audio.removeEventListener('ended', handleSongEnd);
    };
  }, [currentSongIndex, songs]);

  const drawWinner = () => {
    setIsDrawing(true);
    setWinnerIndex(null);
    setHighlightIndex(null);
    setShatterAnimation(false); // Reset shatter animation state
  };

  const handleDrawButtonClick = () => {
    setScreenState('cards');
    setShowConfetti(false);
    drawWinner();
  };

  const handleNewDraw = () => {
    setWinnerIndex(null);
    setScreenState('start');
    setShowConfetti(true);
    setShowWinner(false);
    setShowCongratsMessage(false); // Reset the Congratulations message
  };

  return (
    <div className="app">

      {screenState === 'start' && (
        <>
          <Confetti />
          <img src="/party-photo.png" alt="Party Logo" className="party-logo" />
          <button className="start-button" onClick={handleDrawButtonClick}>
            <span className="button-icon">✨ </span>
            <span className="button-text">Start Draw</span>
            <span className="button-icon">✨</span>
          </button>
        </>
      )}

      {screenState === 'cards' && (
        <>
          <div className={`grid ${shatterAnimation ? 'shatter' : ''}`}>
            {employees
              .filter((employee) => !winners.includes(employee))
              .map((employee, index) => (
                <div
                  key={employee.employee_id}
                  className={`box ${
                    index === winnerIndex ? 'winner' : index === highlightIndex ? 'highlight' : ''
                  }`}
                >
                  {employee.employee_id}
                </div>
              ))}
          </div>
        </>
      )}

      {screenState === 'announcement' && (
        <WinnerAnnouncement
          winner={winner}
          onNewDraw={handleNewDraw}
          showWinner={showWinner}
          showCongratsMessage={showCongratsMessage} // Pass this state
        />
      )}

      {showConfetti && <Confetti />}

      <audio ref={audioRef} src={songs[currentSongIndex]} />
    </div>
  );
};

export default SlotMachine;
