import Slider from '../ui/Slider';
import Switch from '../ui/Switch';

export default function EffectsPanel({ adjustments, setAdjustments, isForMask = false }) {
  const handleAdjustmentChange = (key, value) => {
    const numericValue = parseInt(value, 10);
    setAdjustments(prev => ({ ...prev, [key]: numericValue }));
  };

  const handleCheckedChange = (key, checked) => {
    setAdjustments(prev => ({ ...prev, [key]: checked }));
  };

  const handleColorChange = (key, value) => {
    setAdjustments(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      {!isForMask && (
        <>
          <div className="mb-4 p-2 bg-bg-tertiary rounded-md">
            <p className="text-md font-semibold mb-2 text-primary">Negative Conversion</p>
            <div className="mb-2">
              <Switch
                label="Enable"
                checked={!!adjustments.enableNegativeConversion}
                onChange={(checked) => handleCheckedChange('enableNegativeConversion', checked)}
              />
            </div>
            {adjustments.enableNegativeConversion && (
              <div className="space-y-2 mt-2 pt-2 border-t border-bg-secondary">
                <div className="flex items-center justify-between">
                  <label htmlFor="filmBaseColor" className="text-sm font-medium text-text-primary">Film Base Color</label>
                  <input
                    type="color"
                    id="filmBaseColor"
                    value={adjustments.filmBaseColor || '#ff8800'}
                    onChange={(e) => handleColorChange('filmBaseColor', e.target.value)}
                    className="p-0 h-8 w-12 border-none rounded-md cursor-pointer bg-bg-secondary"
                  />
                </div>
                <Slider
                  label="Red Balance"
                  value={adjustments.negativeRedBalance || 0}
                  onChange={(e) => handleAdjustmentChange('negativeRedBalance', e.target.value)}
                  min="-100" max="100" step="1"
                />
                <Slider
                  label="Green Balance"
                  value={adjustments.negativeGreenBalance || 0}
                  onChange={(e) => handleAdjustmentChange('negativeGreenBalance', e.target.value)}
                  min="-100" max="100" step="1"
                />
                <Slider
                  label="Blue Balance"
                  value={adjustments.negativeBlueBalance || 0}
                  onChange={(e) => handleAdjustmentChange('negativeBlueBalance', e.target.value)}
                  min="-100" max="100" step="1"
                />
              </div>
            )}
          </div>

          <div className="mb-4 p-2 bg-bg-tertiary rounded-md">
            <p className="text-md font-semibold mb-2 text-primary">Vignette</p>
            <Slider
              label="Amount"
              value={adjustments.vignetteAmount}
              onChange={(e) => handleAdjustmentChange('vignetteAmount', e.target.value)}
              min="-100" max="100" step="1"
            />
            <Slider
              label="Midpoint"
              value={adjustments.vignetteMidpoint}
              onChange={(e) => handleAdjustmentChange('vignetteMidpoint', e.target.value)}
              min="0" max="100" step="1" defaultValue="50"
            />
            <Slider
              label="Roundness"
              value={adjustments.vignetteRoundness}
              onChange={(e) => handleAdjustmentChange('vignetteRoundness', e.target.value)}
              min="-100" max="100" step="1"
            />
            <Slider
              label="Feather"
              value={adjustments.vignetteFeather}
              onChange={(e) => handleAdjustmentChange('vignetteFeather', e.target.value)}
              min="0" max="100" step="1" defaultValue="50"
            />
          </div>

          <div className="p-2 bg-bg-tertiary rounded-md">
            <p className="text-md font-semibold mb-2 text-primary">Grain</p>
            <Slider
              label="Amount"
              value={adjustments.grainAmount}
              onChange={(e) => handleAdjustmentChange('grainAmount', e.target.value)}
              min="0" max="100" step="1"
            />
            <Slider
              label="Size"
              value={adjustments.grainSize}
              onChange={(e) => handleAdjustmentChange('grainSize', e.target.value)}
              min="0" max="100" step="1" defaultValue="25"
            />
            <Slider
              label="Roughness"
              value={adjustments.grainRoughness}
              onChange={(e) => handleAdjustmentChange('grainRoughness', e.target.value)}
              min="0" max="100" step="1" defaultValue="50"
            />
          </div>
        </>
      )}
    </div>
  );
};