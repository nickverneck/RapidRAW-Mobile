import { motion } from 'framer-motion';
import clsx from 'clsx';
import Slider from '../ui/Slider';
import { Adjustments, BasicAdjustment } from '../../utils/adjustments';
import { useEffect, useRef, useState } from 'react';

interface BasicAdjustmentsProps {
  adjustments: Adjustments;
  setAdjustments(adjustments: Partial<Adjustments>): any;
}

const toneMapperOptions = [
  { id: 'basic', label: 'Basic' },
  { id: 'agx', label: 'AgX' },
];

interface ToneMapperSwitchProps {
  selectedMapper: string;
  onMapperChange: (mapper: string) => void;
}

const ToneMapperSwitch = ({ selectedMapper, onMapperChange }: ToneMapperSwitchProps) => {
  const [buttonRefs, setButtonRefs] = useState<Map<string, HTMLButtonElement>>(new Map());
  const [bubbleStyle, setBubbleStyle] = useState({});
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialAnimation = useRef(true);

  useEffect(() => {
    const selectedButton = buttonRefs.get(selectedMapper);

    if (selectedButton && containerRef.current) {
      const targetStyle = {
        x: selectedButton.offsetLeft,
        width: selectedButton.offsetWidth,
      };

      if (isInitialAnimation.current && containerRef.current.offsetWidth > 0) {
        let initialX;
        if (selectedMapper === 'agx') {
          initialX = containerRef.current.offsetWidth;
        } else {
          initialX = -targetStyle.width;
        }

        setBubbleStyle({
          x: [initialX, targetStyle.x],
          width: targetStyle.width,
        });
        isInitialAnimation.current = false;
      } else {
        setBubbleStyle(targetStyle);
      }
    }
  }, [selectedMapper, buttonRefs]);

  return (
    <div className="group">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-text-secondary select-none">Tone Mapper</span>
      </div>
      <div
        className="w-full p-1 bg-card-active rounded-md"
      >
        <div
          ref={containerRef}
          className="relative flex w-full"
        >
          <motion.div
            className="absolute top-0 bottom-0 z-0 bg-accent"
            style={{ borderRadius: 6 }}
            animate={bubbleStyle}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
          {toneMapperOptions.map((mapper) => (
            <button
              key={mapper.id}
              ref={(el) => {
                if (el) {
                  const newRefs = new Map(buttonRefs);
                  if (newRefs.get(mapper.id) !== el) {
                    newRefs.set(mapper.id, el);
                    setButtonRefs(newRefs);
                  }
                }
              }}
              onClick={() => onMapperChange(mapper.id)}
              className={clsx(
                'relative flex-1 flex items-center justify-center gap-2 px-3 p-1.5 text-sm font-medium rounded-md transition-colors',
                {
                  'text-text-primary hover:bg-surface': selectedMapper !== mapper.id,
                  'text-button-text': selectedMapper === mapper.id,
                },
              )}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span className="relative z-10 flex items-center">{mapper.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function BasicAdjustments({ adjustments, setAdjustments }: BasicAdjustmentsProps) {
  const handleAdjustmentChange = (key: BasicAdjustment, value: any) => {
    const numericValue = parseFloat(value);
    setAdjustments((prev: Partial<Adjustments>) => ({ ...prev, [key]: numericValue }));
  };

  const handleToneMapperChange = (mapper: string) => {
    setAdjustments((prev: Partial<Adjustments>) => ({
      ...prev,
      toneMapper: mapper as 'basic' | 'agx',
    }));
  };

  return (
    <div>
      <Slider
        label="Exposure"
        max={5}
        min={-5}
        onChange={(e: any) => handleAdjustmentChange(BasicAdjustment.Exposure, e.target.value)}
        step={0.01}
        value={adjustments.exposure}
      />
      <Slider
        label="Contrast"
        max={100}
        min={-100}
        onChange={(e: any) => handleAdjustmentChange(BasicAdjustment.Contrast, e.target.value)}
        step={1}
        value={adjustments.contrast}
      />
      <Slider
        label="Highlights"
        max={100}
        min={-100}
        onChange={(e: any) => handleAdjustmentChange(BasicAdjustment.Highlights, e.target.value)}
        step={1}
        value={adjustments.highlights}
      />
      <Slider
        label="Shadows"
        max={100}
        min={-100}
        onChange={(e: any) => handleAdjustmentChange(BasicAdjustment.Shadows, e.target.value)}
        step={1}
        value={adjustments.shadows}
      />
      <Slider
        label="Whites"
        max={100}
        min={-100}
        onChange={(e: any) => handleAdjustmentChange(BasicAdjustment.Whites, e.target.value)}
        step={1}
        value={adjustments.whites}
      />
      <Slider
        label="Blacks"
        max={100}
        min={-100}
        onChange={(e: any) => handleAdjustmentChange(BasicAdjustment.Blacks, e.target.value)}
        step={1}
        value={adjustments.blacks}
      />
      <ToneMapperSwitch selectedMapper={adjustments.toneMapper || 'agx'} onMapperChange={handleToneMapperChange} />
    </div>
  );
}