import Slider from '../ui/Slider';

export default function BasicAdjustments({ adjustments, setAdjustments }) {
  const handleAdjustmentChange = (key, value) => {
    const numericValue = parseFloat(value);
    setAdjustments(prev => ({ ...prev, [key]: numericValue }));
  };

  return (
    <div>
      <Slider
        label="Exposure"
        value={adjustments.exposure}
        onChange={(e) => handleAdjustmentChange('exposure', e.target.value)}
        min="-5"
        max="5"
        step="0.01"
      />
      <Slider
        label="Contrast"
        value={adjustments.contrast}
        onChange={(e) => handleAdjustmentChange('contrast', e.target.value)}
        min="-100"
        max="100"
        step="1"
      />
      <Slider
        label="Highlights"
        value={adjustments.highlights}
        onChange={(e) => handleAdjustmentChange('highlights', e.target.value)}
        min="-100"
        max="100"
        step="1"
      />
      <Slider
        label="Shadows"
        value={adjustments.shadows}
        onChange={(e) => handleAdjustmentChange('shadows', e.target.value)}
        min="-100"
        max="100"
        step="1"
      />
      <Slider
        label="Whites"
        value={adjustments.whites}
        onChange={(e) => handleAdjustmentChange('whites', e.target.value)}
        min="-100"
        max="100"
        step="1"
      />
      <Slider
        label="Blacks"
        value={adjustments.blacks}
        onChange={(e) => handleAdjustmentChange('blacks', e.target.value)}
        min="-100"
        max="100"
        step="1"
      />
    </div>
  );
}