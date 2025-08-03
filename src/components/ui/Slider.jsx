// src/components/ui/Slider.jsx

import React, { useState, useEffect, useRef } from 'react';

/**
 * A reusable slider component...
 *
 * @param {string} label - The text label for the slider.
 * @param {number|string} value - The current value of the slider.
 * @param {function} onChange - The callback function to execute on value change.
 * @param {number|string} min - The minimum value of the slider.
 * @param {number|string} max - The maximum value of the slider.
 * @param {number|string} step - The increment step of the slider.
 * @param {number} [defaultValue=0] - The value to reset to.
 * @param {function} [onDragStateChange] - Optional callback to report dragging state to a parent.
 */
const Slider = ({ label, value, onChange, min, max, step, defaultValue = 0, onDragStateChange = () => {} }) => {
  const [displayValue, setDisplayValue] = useState(Number(value));
  const [isDragging, setIsDragging] = useState(false);
  const animationFrameRef = useRef();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(value));
  const inputRef = useRef(null);
  const [isLabelHovered, setIsLabelHovered] = useState(false);
  const containerRef = useRef(null);
  
  useEffect(() => {
    onDragStateChange(isDragging);
  }, [isDragging, onDragStateChange]);

  useEffect(() => {
    const handleDragEndGlobal = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleDragEndGlobal);
      window.addEventListener('touchend', handleDragEndGlobal);
    }

    return () => {
      window.removeEventListener('mouseup', handleDragEndGlobal);
      window.removeEventListener('touchend', handleDragEndGlobal);
    };
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const startValue = displayValue;
    const endValue = Number(value);
    const duration = 300;
    let startTime = null;

    const easeInOut = (t) => t * t * (3 - 2 * t);

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const linearFraction = Math.min(progress / duration, 1);
      const easedFraction = easeInOut(linearFraction);
      const currentValue = startValue + (endValue - startValue) * easedFraction;
      setDisplayValue(currentValue);

      if (linearFraction < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, isDragging]);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(String(value));
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleReset = () => {
    const syntheticEvent = {
      target: {
        value: defaultValue,
      },
    };
    onChange(syntheticEvent);
  };

  const handleChange = (e) => {
    setDisplayValue(Number(e.target.value));
    onChange(e);
  };

  const handleDragStart = () => setIsDragging(true);
  const handleDragEnd = () => setIsDragging(false);

  const handleValueClick = () => {
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputCommit = () => {
    let newValue = parseFloat(inputValue);

    if (isNaN(newValue)) {
      newValue = Number(value);
    } else {
      newValue = Math.max(Number(min), Math.min(Number(max), newValue));
    }

    const syntheticEvent = {
      target: {
        value: newValue,
      },
    };
    onChange(syntheticEvent);
    setIsEditing(false);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleInputCommit();
      e.target.blur();
    } else if (e.key === 'Escape') {
      setInputValue(String(value));
      setIsEditing(false);
      e.target.blur();
    }
  };

  const handleRangeKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && ['z', 'y'].includes(e.key.toLowerCase())) {
      e.target.blur();
      return;
    }

    const globalKeys = [' ', 'ArrowUp', 'ArrowDown', 'f'];

    if (globalKeys.includes(e.key)) {
      e.target.blur();
    }
  };

  const stepStr = String(step);
  const decimalPlaces = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;
  
  const numericValue = isNaN(Number(value)) ? 0 : Number(value);

  return (
    <div 
      ref={containerRef}
      className="mb-2"
    >
      <div className="flex justify-between items-center mb-1">
        <div
          className={`grid ${typeof label === 'string' ? 'cursor-pointer' : ''}`}
          onMouseEnter={typeof label === 'string' ? () => setIsLabelHovered(true) : undefined}
          onMouseLeave={typeof label === 'string' ? () => setIsLabelHovered(false) : undefined}
          onClick={typeof label === 'string' ? handleReset : undefined}
          onDoubleClick={typeof label === 'string' ? handleReset : undefined}
          title={typeof label === 'string' && label ? `Click or double-click to reset ${label.toLowerCase()} to ${defaultValue}` : ''}
        >
          <span
            className={`col-start-1 row-start-1 text-sm font-medium text-text-secondary select-none transition-opacity duration-200 ease-in-out ${isLabelHovered && typeof label === 'string' ? 'opacity-0' : 'opacity-100'}`}
            aria-hidden={isLabelHovered && typeof label === 'string'}
          >
            {label}
          </span>

          {typeof label === 'string' && (
            <span
              className={`col-start-1 row-start-1 text-sm font-medium text-text-primary select-none transition-opacity duration-200 ease-in-out pointer-events-none ${isLabelHovered ? 'opacity-100' : 'opacity-0'}`}
              aria-hidden={!isLabelHovered}
            >
              Reset
            </span>
          )}
        </div>
        <div className="w-12 text-right">
          {isEditing ? (
            <input
              ref={inputRef}
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputCommit}
              onKeyDown={handleInputKeyDown}
              min={min}
              max={max}
              step={step}
              className="w-full text-sm text-right bg-card-active border border-gray-500 rounded px-1 py-0 outline-none focus:ring-1 focus:ring-blue-500 text-text-primary"
            />
          ) : (
            <span 
              className="text-sm text-text-primary w-full text-right select-none cursor-text"
              onClick={handleValueClick}
              onDoubleClick={handleReset}
              title={`Click to edit, double-click to reset to ${defaultValue}`}
            >
              {label === 'Exposure' && numericValue === 0 ? '0' : numericValue.toFixed(decimalPlaces)}
            </span>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={displayValue}
        onChange={handleChange}
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchEnd={handleDragEnd}
        onDoubleClick={handleReset}
        onKeyDown={handleRangeKeyDown}
        className={`w-full h-1.5 bg-card-active rounded-full appearance-none cursor-pointer slider-input ${isDragging ? 'slider-thumb-active' : ''}`}
      />
    </div>
  );
};

export default Slider;