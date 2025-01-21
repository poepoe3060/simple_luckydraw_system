import React, { useState, useEffect, useRef } from 'react';
import './SlotMachine.css';
import Confetti from 'react-confetti';

// Import the JSON data directly
import employeesData from '../Staff_Party_Attendee.json';

const WinnerAnnouncement = ({ winner, onNewDraw, showWinner, showCongratsMessage }) => {
  const [showDrawButton, setShowDrawButton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDrawButton(true);
    }, 7000);

    return () => clearTimeout(timer); // Cleanup the timer on component unmount
  }, []);

  return (
    <div className={`winner-announcement ${showWinner ? 'visible' : ''}`}>
      {showCongratsMessage && (
        <h2 className={`winner-heading ${showCongratsMessage ? 'visible' : ''}`}>
          🎉 Congratulations! 🎉
        </h2>
      )}
      <h3 className="winner-name">{`The winner is: ${winner.employee_name} (ID: ${winner.employee_id})`}</h3>
      {showDrawButton && (
        <button className="new-draw-button" onClick={onNewDraw}>
          Start New Draw
        </button>
      )}
    </div>
  );
};

const SlotMachine = () => {
  const [employees, setEmployees] = useState([]);
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

  const songs = ['/LD4.MP3'];
  const [currentSongIndex, setCurrentSongIndex] = useState(0);

  const initialSelectionInterval = 200;
  const finalSelectionInterval = 1000;
  const slowDownTime = 10000;

  // Initial setup for employees in localStorage
  useEffect(() => {
    const storedEmployees = localStorage.getItem('employees');
    if (!storedEmployees) {
      // Store the employees data if it's not already in localStorage
      localStorage.setItem('employees', JSON.stringify(employeesData));
      setEmployees(employeesData);
    } else {
      setEmployees(JSON.parse(storedEmployees));
    }
  }, []);

  useEffect(() => {
    if (employees.length === 0) return;

    const audio = audioRef.current;

    if (isDrawing) {
      audio.play();
      setShowConfetti(false);

      const handleAudioEnd = () => {
        clearInterval(intervalRef.current);
        const finalWinnerIndex = lastHighlightRef.current;
        setWinnerIndex(finalWinnerIndex);
        setWinner(employees[finalWinnerIndex]);
        setHighlightIndex(finalWinnerIndex);
        setIsDrawing(false);
        setShowConfetti(true);
        setWinners((prev) => [...prev, employees[finalWinnerIndex]]);

        setTimeout(() => {
          setShowCongratsMessage(true);
        }, 500);
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
        setWinner(employees[randomIndex]);

        const interval = calculateSelectionInterval(remainingTime);
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(updateSelection, interval);
      };

      setTimeout(() => {
        setShowWinner(true);
        setScreenState('announcement');
        setShatterAnimation(true);
      }, songDuration - 5000);

      intervalRef.current = setInterval(updateSelection, initialSelectionInterval);

      return () => {
        audio.removeEventListener('ended', handleAudioEnd);
        clearInterval(intervalRef.current);
      };
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [isDrawing, employees]);

  useEffect(() => {
    const audio = audioRef.current;

    const handleSongEnd = () => {
      const nextSongIndex = (currentSongIndex + 1) % songs.length;
      setCurrentSongIndex(nextSongIndex);
      audio.src = songs[nextSongIndex];
      audio.play();
    };

    audio.addEventListener('ended', handleSongEnd);

    return () => {
      audio.removeEventListener('ended', handleSongEnd);
    };
  }, [currentSongIndex]);

  const drawWinner = () => {
    setIsDrawing(true);
    setWinnerIndex(null);
    setHighlightIndex(null);
    setShatterAnimation(false);
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
    setShowCongratsMessage(false);

    // Remove winner from localStorage
    const updatedEmployees = employees.filter((employee) => employee.employee_id !== winner.employee_id);
    localStorage.setItem('employees', JSON.stringify(updatedEmployees));
    setEmployees(updatedEmployees);
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
                  className={`box ${index === winnerIndex ? 'winner' : index === highlightIndex ? 'highlight' : ''}`}
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
          showCongratsMessage={showCongratsMessage}
        />
      )}

      {showConfetti && <Confetti />}

      <audio ref={audioRef} src={songs[currentSongIndex]} />
    </div>
  );
};

export default SlotMachine;