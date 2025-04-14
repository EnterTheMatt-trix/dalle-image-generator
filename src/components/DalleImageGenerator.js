import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const DalleImageGenerator = () => {
  const [inputText, setInputText] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  // Automatically focus the contentEditable div when the component mounts
  useEffect(() => {
    if (inputRef.current && !loading && !imageUrl) {
      inputRef.current.focus();
    }
  }, [loading, imageUrl]);

  // Countdown timer
  useEffect(() => {
    let timer;
    if (loading && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [loading, countdown]);

  const handleKeyPress = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent default form submission behavior

      if (!inputText) {
        alert('Please enter a prompt');
        return;
      }

      // Reset error state
      setError(null);
      
      // Start loading and countdown
      setLoading(true);
      setCountdown(30);

      try {
        // Instead of directly calling OpenAI's API with our key exposed,
        // we'll call our secure backend endpoint
        const response = await axios.post(
          '/api/generate-image', // Your backend endpoint
          {
            prompt: inputText,
            size: '1024x1024',
          }
        );

        if (response.data && response.data.imageUrl) {
          // As soon as the image is ready, display it (replacing the countdown)
          setImageUrl(response.data.imageUrl);
        } else {
          throw new Error('No image data returned');
        }
      } catch (error) {
        console.error('Error generating image:', error);
        setError('Failed to generate image. Please try again.');
      } finally {
        // Stop loading state after the API call finishes
        setLoading(false);
      }
    }
  };

  // Function to reset the generator
  const resetGenerator = () => {
    setImageUrl(null);
    setInputText('');
    setLoading(false);
    setCountdown(30);
    setError(null);
  };

  return (
    <div style={styles.container}>
      {/* Input field - show only when not loading and no image */}
      {!loading && !imageUrl && (
        <div 
          ref={inputRef} 
          style={styles.textInput} 
          contentEditable 
          onInput={(e) => setInputText(e.target.innerText)} 
          onKeyDown={handleKeyPress} 
          spellCheck="false" 
          role="textbox"
        />
      )}

      {/* Countdown - show only when loading and no image yet */}
      {loading && !imageUrl && (
        <div style={styles.countdown}>{countdown}</div>
      )}

      {/* Error message */}
      {error && (
        <div style={styles.error}>
          {error}
          <button onClick={resetGenerator} style={styles.resetButton}>
            Try Again
          </button>
        </div>
      )}

      {/* Image - show as soon as it's available */}
      {imageUrl && (
        <div style={styles.imageContainer}>
          <img src={imageUrl} alt="Generated" style={styles.image} />
          <button onClick={resetGenerator} style={styles.resetButton}>
            Generate New Image
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    flexDirection: 'column',
    textAlign: 'center',
  },
  textInput: {
    fontSize: '40px',
    padding: '10px 0',
    width: '300px',
    textAlign: 'center',
    outline: 'none',
    cursor: 'text',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    display: 'inline-block',
  },
  countdown: {
    fontSize: '80px',
    fontWeight: 'bold',
  },
  imageContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  image: {
    marginTop: '20px',
    maxWidth: '100%',
    height: 'auto',
  },
  error: {
    color: '#ff3333',
    fontSize: '18px',
    marginBottom: '20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  resetButton: {
    marginTop: '20px',
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  }
};

export default DalleImageGenerator;