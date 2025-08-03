import Slider from '../ui/Slider';

export default function DetailsPanel({ adjustments, setAdjustments }) {
  const handleAdjustmentChange = (key, value) => {
    const numericValue = parseInt(value, 10);
    setAdjustments(prev => ({ ...prev, [key]: numericValue }));
  };

  return (
    <div>
      <div className="mb-4 p-2 bg-bg-tertiary rounded-md">
        <p className="text-md font-semibold mb-2 text-primary">Sharpening</p>
        <Slider
          label="Sharpness"
          value={adjustments.sharpness}
          onChange={(e) => handleAdjustmentChange('sharpness', e.target.value)}
          min="0" max="100" step="1"
        />
      </div>

      <div className="mb-4 p-2 bg-bg-tertiary rounded-md">
        <p className="text-md font-semibold mb-2 text-primary">Presence</p>
        <Slider
          label="Clarity"
          value={adjustments.clarity}
          onChange={(e) => handleAdjustmentChange('clarity', e.target.value)}
          min="-100" max="100" step="1"
        />
        <Slider
          label="Dehaze"
          value={adjustments.dehaze}
          onChange={(e) => handleAdjustmentChange('dehaze', e.target.value)}
          min="-100" max="100" step="1"
        />
         <Slider
          label="Structure"
          value={adjustments.structure}
          onChange={(e) => handleAdjustmentChange('structure', e.target.value)}
          min="-100" max="100" step="1"
        />
      </div>

      <div className="p-2 bg-bg-tertiary rounded-md">
        <p className="text-md font-semibold mb-2 text-primary">Noise Reduction</p>
        <Slider
          label="Luminance"
          value={adjustments.lumaNoiseReduction}
          onChange={(e) => handleAdjustmentChange('lumaNoiseReduction', e.target.value)}
          min="0" max="100" step="1"
        />
        <Slider
          label="Color"
          value={adjustments.colorNoiseReduction}
          onChange={(e) => handleAdjustmentChange('colorNoiseReduction', e.target.value)}
          min="0" max="100" step="1"
        />
      </div>
    </div>
  );
}