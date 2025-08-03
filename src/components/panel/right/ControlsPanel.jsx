import { RotateCcw, Copy, ClipboardPaste, Aperture } from 'lucide-react';
import BasicAdjustments from '../../adjustments/Basic';
import CurveGraph from '../../adjustments/Curves';
import ColorPanel from '../../adjustments/Color';
import DetailsPanel from '../../adjustments/Details';
import EffectsPanel from '../../adjustments/Effects';
import CollapsibleSection from '../../ui/CollapsibleSection';
import { INITIAL_ADJUSTMENTS, ADJUSTMENT_SECTIONS } from '../../../utils/adjustments';
import { useContextMenu } from '../../../context/ContextMenuContext';

export default function Controls({
  theme,
  adjustments,
  setAdjustments,
  selectedImage,
  histogram,
  collapsibleState,
  setCollapsibleState,
  copiedSectionAdjustments,
  setCopiedSectionAdjustments,
  handleAutoAdjustments,
}) {
  const { showContextMenu } = useContextMenu();

  const handleToggleVisibility = (sectionName) => {
    setAdjustments(prev => {
      const currentVisibility = prev.sectionVisibility || INITIAL_ADJUSTMENTS.sectionVisibility;
      return {
        ...prev,
        sectionVisibility: {
          ...currentVisibility,
          [sectionName]: !currentVisibility[sectionName],
        }
      }
    });
  };

  const handleResetAdjustments = () => {
    setAdjustments(prev => ({
      ...prev,
      ...Object.keys(ADJUSTMENT_SECTIONS).flatMap(s => ADJUSTMENT_SECTIONS[s]).reduce((acc, key) => {
        acc[key] = INITIAL_ADJUSTMENTS[key];
        return acc;
      }, {}),
      sectionVisibility: { ...INITIAL_ADJUSTMENTS.sectionVisibility },
    }));
  };

  const handleToggleSection = (section) => {
    setCollapsibleState(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSectionContextMenu = (event, sectionName) => {
    event.preventDefault();
    event.stopPropagation();

    const sectionKeys = ADJUSTMENT_SECTIONS[sectionName];
    if (!sectionKeys) return;

    const handleCopy = () => {
      const adjustmentsToCopy = {};
      for (const key of sectionKeys) {
        if (adjustments.hasOwnProperty(key)) {
          adjustmentsToCopy[key] = JSON.parse(JSON.stringify(adjustments[key]));
        }
      }
      setCopiedSectionAdjustments({ section: sectionName, values: adjustmentsToCopy });
    };

    const handlePaste = () => {
      if (!copiedSectionAdjustments || copiedSectionAdjustments.section !== sectionName) return;
      setAdjustments(prev => ({
        ...prev,
        ...copiedSectionAdjustments.values,
        sectionVisibility: { ...(prev.sectionVisibility || INITIAL_ADJUSTMENTS.sectionVisibility), [sectionName]: true }
      }));
    };

    const handleReset = () => {
      const resetValues = {};
      for (const key of sectionKeys) {
        resetValues[key] = JSON.parse(JSON.stringify(INITIAL_ADJUSTMENTS[key]));
      }
      setAdjustments(prev => ({
        ...prev,
        ...resetValues,
        sectionVisibility: { ...(prev.sectionVisibility || INITIAL_ADJUSTMENTS.sectionVisibility), [sectionName]: true }
      }));
    };

    const isPasteAllowed = copiedSectionAdjustments && copiedSectionAdjustments.section === sectionName;
    const pasteLabel = copiedSectionAdjustments ? `Paste ${copiedSectionAdjustments.section.charAt(0).toUpperCase() + copiedSectionAdjustments.section.slice(1)} Settings` : 'Paste Settings';

    const options = [
      { label: `Copy ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} Settings`, icon: Copy, onClick: handleCopy },
      { label: pasteLabel, icon: ClipboardPaste, onClick: handlePaste, disabled: !isPasteAllowed },
      { type: 'separator' },
      { label: `Reset ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} Settings`, icon: RotateCcw, onClick: handleReset },
    ];

    showContextMenu(event.clientX, event.clientY, options);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex justify-between items-center flex-shrink-0 border-b border-surface">
        <h2 className="text-xl font-bold text-primary text-shadow-shiny">Adjustments</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={handleAutoAdjustments}
            disabled={!selectedImage}
            className="p-2 rounded-full hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Auto Adjustments"
          >
            <Aperture size={18} />
          </button>
          <button
            onClick={handleResetAdjustments}
            disabled={!selectedImage}
            className="p-2 rounded-full hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Reset All Adjustments"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-2">
        {Object.keys(ADJUSTMENT_SECTIONS).map(sectionName => {
          const SectionComponent = {
            basic: BasicAdjustments,
            curves: CurveGraph,
            color: ColorPanel,
            details: DetailsPanel,
            effects: EffectsPanel,
          }[sectionName];

          const title = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
          const sectionVisibility = adjustments.sectionVisibility || INITIAL_ADJUSTMENTS.sectionVisibility;

          return (
            <div className="flex-shrink-0" key={sectionName}>
              <CollapsibleSection
                title={title}
                isOpen={collapsibleState[sectionName]}
                onToggle={() => handleToggleSection(sectionName)}
                onContextMenu={(e) => handleSectionContextMenu(e, sectionName)}
                isContentVisible={sectionVisibility[sectionName]}
                onToggleVisibility={() => handleToggleVisibility(sectionName)}
              >
                <SectionComponent
                  adjustments={adjustments}
                  setAdjustments={setAdjustments}
                  histogram={histogram}
                  theme={theme}
                />
              </CollapsibleSection>
            </div>
          );
        })}
      </div>
    </div>
  );
}