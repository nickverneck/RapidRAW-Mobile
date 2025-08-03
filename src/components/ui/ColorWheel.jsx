import { useState, useRef, useEffect } from 'react';
import Slider from './Slider';
import Wheel from '@uiw/react-color-wheel';
import { hsvaToHex } from '@uiw/color-convert';
import { Sun } from 'lucide-react';

const ResetIcon = () => (
    <svg 
      width="14" 
      height="14" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className="text-text-secondary hover:text-text-primary transition-colors duration-150"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
);

const ColorWheel = ({ label, value, onChange, defaultValue = { h: 0, s: 0, lum: 0 } }) => {
    const { h, s, lum } = value;
    const sizerRef = useRef(null);
    const [wheelSize, setWheelSize] = useState(0);
    const containerRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isWheelDragging, setIsWheelDragging] = useState(false);
    const [isSliderDragging, setIsSliderDragging] = useState(false);

    const isDragging = isWheelDragging || isSliderDragging;

    useEffect(() => {
        const observer = new ResizeObserver(entries => {
            if (entries[0]) {
                const width = entries[0].contentRect.width;
                if (width > 0) {
                    setWheelSize(width);
                }
            }
        });

        const currentSizer = sizerRef.current;
        if (currentSizer) {
            observer.observe(currentSizer);
        }

        return () => {
            if (currentSizer) {
                observer.unobserve(currentSizer);
            }
        };
    }, []);

    useEffect(() => {
        const handleInteractionEnd = () => {
            setIsWheelDragging(false);
            if (containerRef.current && !containerRef.current.matches(':hover')) {
                setIsHovered(false);
            }
        };

        if (isWheelDragging) {
            window.addEventListener('mouseup', handleInteractionEnd);
            window.addEventListener('touchend', handleInteractionEnd);
        }

        return () => {
            window.removeEventListener('mouseup', handleInteractionEnd);
            window.removeEventListener('touchend', handleInteractionEnd);
        };
    }, [isWheelDragging]);
  
    const handleWheelChange = (color) => {
      onChange({ ...value, h: color.hsva.h, s: color.hsva.s });
    };
  
    const handleLumChange = (e) => {
      onChange({ ...value, lum: parseFloat(e.target.value) });
    };

    const handleReset = () => {
        onChange(defaultValue);
    };
  
    const hsva = { h, s, v: 100, a: 1 };
    const hexColor = hsvaToHex(hsva);
  
    return (
      <div 
        ref={containerRef}
        className="relative flex flex-col items-center gap-2"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
            if (!isDragging) {
                setIsHovered(false);
            }
        }}
      >
        <div 
            className="flex items-center justify-center cursor-pointer"
            onDoubleClick={handleReset}
            title={`Double-click to reset ${label.toLowerCase()}`}
        >
            <p className="text-sm font-medium text-text-secondary select-none">{label}</p>
        </div>
        <button
            onClick={handleReset}
            className={`absolute top-0 right-0 p-0.5 rounded hover:bg-card-active transition-all duration-200 cursor-pointer active:scale-95 ${isHovered && !isDragging ? 'opacity-100' : 'opacity-0'}`}
            title={`Reset ${label.toLowerCase()}`}
            type="button"
        >
            <ResetIcon />
        </button>

        <div ref={sizerRef} className="relative w-full aspect-square">
            {wheelSize > 0 && (
                <div 
                    className="absolute inset-0 cursor-pointer"
                    onDoubleClick={handleReset}
                    title="Double-click to reset"
                    onMouseDown={() => setIsWheelDragging(true)}
                    onTouchStart={() => setIsWheelDragging(true)}
                >
                    <Wheel
                        color={hsva}
                        onChange={handleWheelChange}
                        width={wheelSize}
                        height={wheelSize}
                        pointer={({ style }) => (
                            <div style={{...style, zIndex: 1}}>
                                <div
                                    style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        transform: 'translate(-6px, -6px)',
                                        border: '2px solid white',
                                        boxShadow: '0 0 2px rgba(0,0,0,0.5)',
                                        backgroundColor: s > 5 ? hexColor : 'transparent',
                                    }}
                                />
                            </div>
                        )}
                    />
                </div>
            )}
        </div>

        <div className="w-full">
          <Slider
            label={<Sun size={16} className="text-text-secondary" />}
            value={lum}
            onChange={handleLumChange}
            min="-100"
            max="100"
            step="1"
            defaultValue={defaultValue.lum}
            onDragStateChange={setIsSliderDragging}
          />
        </div>
      </div>
    );
};

export default ColorWheel;