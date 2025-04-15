import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const DalleImageGenerator = () => {
  const [inputText, setInputText] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [error, setError] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [blurAmount, setBlurAmount] = useState(30);
  const [opacity, setOpacity] = useState(0);
  const inputRef = useRef(null);
  const blurAnimationRef = useRef(null);
  const [imagesLoaded, setImagesLoaded] = useState(0);

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
      const duration = 3000; // 3 seconds for the animation
      
      const animateBlur = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic function for smoother end of animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const newBlurAmount = 30 * (1 - easeOutCubic);
        
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
      setBlurAmount(30);
      setOpacity(0);
      setImageLoaded(false);
      setImagesLoaded(0);
      
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
    setImagesLoaded(prev => prev + 1);
    
    // Only set loaded state when the first image is loaded
    if (imagesLoaded === 0) {
      setImageLoaded(true);
      setLoading(false);
    }
  };

  // Function to reset the generator
  const resetGenerator = () => {
    setImageUrl(null);
    setInputText('');
    setLoading(false);
    setCountdown(30);
    setError(null);
    setBlurAmount(30);
    setOpacity(0);
    setImageLoaded(false);
    setImagesLoaded(0);
  };

  // Generate random positions for the 3 images
  const imagePositions = [
    {
      top: '10%',
      left: '10%',
      transform: 'rotate(-5deg)',
      zIndex: 3,
    },
    {
      top: '50%',
      right: '10%',
      transform: 'rotate(5deg)',
      zIndex: 2,
    },
    {
      bottom: '10%',
      left: '30%',
      transform: 'rotate(3deg)',
      zIndex: 1,
    }
  ];

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

      {/* Multiple floating images with blur effect */}
      {imageUrl && (
        <div style={styles.imagesContainer}>
          {/* Create 3 instances of the same image */}
          {imagePositions.map((position, index) => (
            <div 
              key={index} 
              style={{
                ...styles.floatingImageContainer,
                ...position
              }}
            >
              <img
                src={imageUrl}
                alt={`Generated Image ${index + 1}`}
                style={{
                  ...styles.image,
                  opacity: opacity,
                  filter: `blur(${blurAmount}px)`,
                  transition: 'opacity 0.5s ease-in-out, filter 3s ease-out'
                }}
                onLoad={handleImageLoad}
              />
            </div>
          ))}
          
          {/* Reset button appears in the center */}
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
    position: 'relative',
    overflow: 'hidden',
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
    zIndex: 10,
  },
  imagesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingImageContainer: {
    position: 'absolute',
    maxWidth: '45%',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    backgroundColor: 'white',
    padding: '10px',
  },
  image: {
    width: '100%',
    height: 'auto',
    maxHeight: '50vh',
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
    zIndex: 10,
  },
  resetButton: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    fontSize: '16px',
    backgroundColor: '#0066ff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    zIndex: 10,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  }
};

export default DalleImageGenerator;