import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, ButtonGroup, CircularProgress } from '@mui/material';

const Timer = () => {
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const audioContext = useRef(null);

  useEffect(() => {
    let interval = null;
    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime === 11) {
            startCountdown();
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (time === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, time]);

  useEffect(() => {
    audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  const startTimer = (seconds) => {
    setTime(seconds);
    setSelectedTime(seconds);
    setIsActive(true);
  };

  const resetTo10Seconds = () => {
    setTime(10);
    setIsActive(true);
    startCountdown();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startCountdown = () => {
    for (let i = 10; i >= 1; i--) {
      setTimeout(() => speak(i), (10 - i) * 1000);
    }
  };

  const speak = (number) => {
    if (audioContext.current) {
      const oscillator = audioContext.current.createOscillator();
      const gainNode = audioContext.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.current.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContext.current.currentTime);
      
      gainNode.gain.setValueAtTime(0, audioContext.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(1, audioContext.current.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.current.currentTime + 0.5);
      
      oscillator.start(audioContext.current.currentTime);
      oscillator.stop(audioContext.current.currentTime + 0.5);

      const utterance = new SpeechSynthesisUtterance(number.toString());
      utterance.rate = 1.5;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <Box sx={{ textAlign: 'center', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Fantasy Timer
      </Typography>
      <Box sx={{ position: 'relative', display: 'inline-flex', mb: 4 }}>
        <CircularProgress
          variant="determinate"
          value={(time / selectedTime) * 100 || 0}
          size={200}
          thickness={4}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h3" component="div" color="text.secondary">
            {formatTime(time)}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ mb: 2 }}>
        <ButtonGroup variant="contained" aria-label="timer selection">
          {[1, 2, 3, 4, 5].map((minutes) => (
            <Button
              key={minutes}
              onClick={() => startTimer(minutes * 60)}
              disabled={isActive}
            >
              {minutes} min
            </Button>
          ))}
        </ButtonGroup>
      </Box>
      <Button
        variant="contained"
        color="secondary"
        onClick={resetTo10Seconds}
        sx={{ mt: 2 }}
      >
        +10 Seconds
      </Button>
    </Box>
  );
};

export default Timer;