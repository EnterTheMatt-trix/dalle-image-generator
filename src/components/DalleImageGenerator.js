import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const DalleImageGenerator = () => {
  const [inputText, setInputText] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [error, setError] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [blurAmount, setBlurAmount] = useState(20);
  const [opacity, setOpacity] = useState(0);
  const inputRef = useRef(null);
  const blurAnimationRef = useRef(null);

  // Automatically focus the contentEditable div when the component mounts
  useEffect(() => {
    if (inputRef.current && !loading && !imageUrl) {
      inputRef.current.focus();
    }
  }, [loading, imageUrl]);

  // Countdown timer
  useEffect(() => {
    let timer;
    if (loading && countdown > 0 && !imageUrl) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [loading, countdown, imageUrl]);

  // Animation effect when image loads
  useEffect(() => {
    if (imageLoaded && blurAmount > 0) {
      // Start with initial visibility
      setOpacity(1);
      
      // Gradually reduce blur over time
      const startTime = Date.now();
      const duration = 3000; // 3 seconds for the animation (increased from 1.5s)
      
      const animateBlur = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic function for smoother end of animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const newBlurAmount = 30 * (1 - easeOutCubic); // Increased from 20px to 30px
        
        setBlurAmount(newBlurAmount);
        
        if (progress < 1) {
          blurAnimationRef.current = requestAnimationFrame(animateBlur);
        }
      };
      
      blurAnimationRef.current = requestAnimationFrame(animateBlur);
      
      return () => {
        if (blurAnimationRef.current) {
          cancelAnimationFrame(blurAnimationRef.current);
        }
      };
    }
  }, [imageLoaded]);

  const handleKeyPress = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent default form submission behavior

      if (!inputText) {
        alert('Please enter a prompt');
        return;
      }

      // Reset states
      setError(null);
      setBlurAmount(30); // Increased from 20px to 30px
      setOpacity(0);
      setImageLoaded(false);
      
      // Start loading and countdown
      setLoading(true);
      setCountdown(30);

      try {
        // Send request to your backend API endpoint
        const response = await axios.post(
          '/api/generate-image',
          {
            prompt: "emoji of a " + inputText,
            size: '1024x1024',
          }
        );

        if (response.data && response.data.imageUrl) {
          // When image URL is received
          setImageUrl(response.data.imageUrl);
        } else {
          throw new Error('No image data returned');
        }
      } catch (error) {
        console.error('Error generating image:', error);
        setError('Failed to generate image. Please try again.');
        setLoading(false);
      }
    }
  };

  // Handle image load event
  const handleImageLoad = () => {
    setImageLoaded(true);
    setLoading(false);
  };

  // Function to reset the generator
  const resetGenerator = () => {
    setImageUrl(null);
    setInputText('');
    setLoading(false);
    setCountdown(30);
    setError(null);
    setBlurAmount(30); // Increased from 20px to 30px
    setOpacity(0);
    setImageLoaded(false);
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

      {/* Countdown - show only when loading and no image loaded yet */}
      {loading && !imageLoaded && (
        <div style={styles.countdown}>{countdown}</div>
      )}

      {/* Image with blur effect */}
      {imageUrl && (
        <div style={styles.imageContainer}>
          <img
            src={imageUrl}
            alt="Generated"
            style={{
              ...styles.image,
              opacity: opacity,
              filter: `blur(${blurAmount}px)`,
              transition: 'opacity 0.5s ease-in-out'
            }}
            onLoad={handleImageLoad}
          />
          
          {imageLoaded && (
            <button onClick={resetGenerator} style={styles.resetButton}>
              Generate New Image
            </button>
          )}
        </div>
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
    backgroundColor: '#f0f4f8',
  },
  textInput: {
    fontSize: '40px',
    padding: '10px 0',
    width: '80%',
    maxWidth: '600px',
    textAlign: 'center',
    outline: 'none',
    cursor: 'text',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    display: 'inline-block',
    borderBottom: '2px solid #0066ff',
    marginBottom: '20px',
  },
  countdown: {
    fontSize: '80px',
    fontWeight: 'bold',
    color: '#0066ff',
  },
  imageContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '90%',
  },
  image: {
    maxWidth: '100%',
    maxHeight: '70vh',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    borderRadius: '4px',
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
    backgroundColor: '#0066ff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  }
};

export default DalleImageGenerator;