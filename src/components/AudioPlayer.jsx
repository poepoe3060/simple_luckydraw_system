import React, { useState, useEffect } from 'react';

const AudioPlayer = ({ songs, onSongEnd }) => {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [currentSongDuration, setCurrentSongDuration] = useState(null);

  useEffect(() => {
    const audio = new Audio(songs[currentSongIndex]);
    audio.addEventListener('loadedmetadata', () => {
      setCurrentSongDuration(audio.duration);
    });
    audio.play();

    audio.addEventListener('ended', () => {
      setCurrentSongIndex((prevIndex) => (prevIndex + 1) % songs.length);
      onSongEnd();
    });
  }, [currentSongIndex, songs]);

  return null;
};

export default AudioPlayer;