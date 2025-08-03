import { useState } from 'react';
import Slider from '../ui/Slider';
import ColorWheel from '../ui/ColorWheel';
import { INITIAL_ADJUSTMENTS } from '../../utils/adjustments';

const ColorSwatch = ({ color, name, isActive, onClick }) => (
    <button
        onClick={() => onClick(name)}
        className={`w-6 h-6 rounded-full focus:outline-none transition-transform duration-150 ${isActive ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg-secondary transform scale-110' : 'hover:scale-110'}`}
        style={{ backgroundColor: color }}
        aria-label={`Select ${name} color`}
    />
);

const ColorGradingPanel = ({ adjustments, setAdjustments }) => {
    const colorGrading = adjustments.colorGrading || INITIAL_ADJUSTMENTS.colorGrading;

    const handleChange = (range, newValue) => {
        setAdjustments(prev => ({
          ...prev,
          colorGrading: {
            ...(prev.colorGrading || INITIAL_ADJUSTMENTS.colorGrading),
            [range]: newValue,
          }
        }));
    };

    const handleGlobalChange = (key, value) => {
        setAdjustments(prev => ({
          ...prev,
          colorGrading: {
            ...(prev.colorGrading || INITIAL_ADJUSTMENTS.colorGrading),
            [key]: parseFloat(value),
          }
        }));
    };

    return (
        <div>
            <div className="flex justify-center mb-4">
                <div className="w-[calc(50%-0.5rem)]">
                    <ColorWheel
                        label="Midtones"
                        value={colorGrading.midtones}
                        onChange={(val) => handleChange('midtones', val)}
                        defaultValue={INITIAL_ADJUSTMENTS.colorGrading.midtones}
                    />
                </div>
            </div>
            <div className="flex justify-between mb-2 gap-4">
                <div className="w-full">
                    <ColorWheel
                        label="Shadows"
                        value={colorGrading.shadows}
                        onChange={(val) => handleChange('shadows', val)}
                        defaultValue={INITIAL_ADJUSTMENTS.colorGrading.shadows}
                    />
                </div>
                <div className="w-full">
                    <ColorWheel
                        label="Highlights"
                        value={colorGrading.highlights}
                        onChange={(val) => handleChange('highlights', val)}
                        defaultValue={INITIAL_ADJUSTMENTS.colorGrading.highlights}
                    />
                </div>
            </div>
            <div>
                <Slider
                    label="Blending"
                    value={colorGrading.blending}
                    onChange={(e) => handleGlobalChange('blending', e.target.value)}
                    min="0" max="100" step="1"
                    defaultValue={50}
                />
                <Slider
                    label="Balance"
                    value={colorGrading.balance}
                    onChange={(e) => handleGlobalChange('balance', e.target.value)}
                    min="-100" max="100" step="1"
                    defaultValue={0}
                />
            </div>
        </div>
    );
};

const HSL_COLORS = [
    { name: 'reds', color: '#f87171' },
    { name: 'oranges', color: '#fb923c' },
    { name: 'yellows', color: '#facc15' },
    { name: 'greens', color: '#4ade80' },
    { name: 'aquas', color: '#2dd4bf' },
    { name: 'blues', color: '#60a5fa' },
    { name: 'purples', color: '#a78bfa' },
    { name: 'magentas', color: '#f472b6' },
];

export default function ColorPanel({ adjustments, setAdjustments }) {
    const [activeColor, setActiveColor] = useState('reds');

    const handleGlobalChange = (key, value) => {
        setAdjustments(prev => ({ ...prev, [key]: parseFloat(value) }));
    };

    const handleHslChange = (property, value) => {
        setAdjustments(prev => ({
            ...prev,
            hsl: {
                ...(prev.hsl || {}),
                [activeColor]: {
                    ...(prev.hsl?.[activeColor] || {}),
                    [property]: parseFloat(value),
                },
            },
        }));
    };
    
    const currentHsl = adjustments.hsl?.[activeColor] || { hue: 0, saturation: 0, luminance: 0 };

    return (
        <div> 
            <div className="mb-4 p-2 bg-bg-tertiary rounded-md">
                <p className="text-md font-semibold mb-2 text-primary">White Balance</p>
                <Slider
                    label="Temperature"
                    value={adjustments.temperature || 0}
                    onChange={(e) => handleGlobalChange('temperature', e.target.value)}
                    min="-100" max="100" step="1"
                />
                <Slider
                    label="Tint"
                    value={adjustments.tint || 0}
                    onChange={(e) => handleGlobalChange('tint', e.target.value)}
                    min="-100" max="100" step="1"
                />
            </div>

            <div className="mb-4 p-2 bg-bg-tertiary rounded-md">
                <p className="text-md font-semibold mb-2 text-primary">Presence</p>
                <Slider
                    label="Vibrance"
                    value={adjustments.vibrance || 0}
                    onChange={(e) => handleGlobalChange('vibrance', e.target.value)}
                    min="-100" max="100" step="1"
                />
                <Slider
                    label="Saturation"
                    value={adjustments.saturation || 0}
                    onChange={(e) => handleGlobalChange('saturation', e.target.value)}
                    min="-100" max="100" step="1"
                />
            </div>

            <div className="p-2 bg-bg-tertiary rounded-md mt-4">
                <p className="text-md font-semibold mb-3 text-primary">Color Grading</p>
                <ColorGradingPanel adjustments={adjustments} setAdjustments={setAdjustments} />
            </div>

            <div className="p-2 bg-bg-tertiary rounded-md mt-4">
                <p className="text-md font-semibold mb-3 text-primary">Color Mixer</p>
                <div className="flex justify-between mb-4 px-1">
                    {HSL_COLORS.map(({ name, color }) => (
                        <ColorSwatch
                            key={name}
                            name={name}
                            color={color}
                            isActive={activeColor === name}
                            onClick={setActiveColor}
                        />
                    ))}
                </div>
                <Slider
                    label="Hue"
                    value={currentHsl.hue}
                    onChange={(e) => handleHslChange('hue', e.target.value)}
                    min="-100" max="100" step="1"
                />
                <Slider
                    label="Saturation"
                    value={currentHsl.saturation}
                    onChange={(e) => handleHslChange('saturation', e.target.value)}
                    min="-100" max="100" step="1"
                />
                <Slider
                    label="Luminance"
                    value={currentHsl.luminance}
                    onChange={(e) => handleHslChange('luminance', e.target.value)}
                    min="-100" max="100" step="1"
                />
            </div>
        </div>
    );
}