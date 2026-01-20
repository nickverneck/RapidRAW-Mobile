import { useState, useMemo, useCallback } from 'react';
import { ExportPreset, WatermarkAnchor } from '../components/ui/ExportImportProperties';

export function useExportSettings() {
  const [fileFormat, setFileFormat] = useState('jpeg');
  const [jpegQuality, setJpegQuality] = useState(90);
  const [enableResize, setEnableResize] = useState(false);
  const [resizeMode, setResizeMode] = useState('longEdge');
  const [resizeValue, setResizeValue] = useState(2048);
  const [dontEnlarge, setDontEnlarge] = useState(true);
  const [keepMetadata, setKeepMetadata] = useState(true);
  const [stripGps, setStripGps] = useState(true);
  const [filenameTemplate, setFilenameTemplate] = useState('{original_filename}_edited');
  const [enableWatermark, setEnableWatermark] = useState(false);
  const [watermarkPath, setWatermarkPath] = useState<string | null>(null);
  const [watermarkAnchor, setWatermarkAnchor] = useState<WatermarkAnchor>(WatermarkAnchor.BottomRight);
  const [watermarkScale, setWatermarkScale] = useState(10);
  const [watermarkSpacing, setWatermarkSpacing] = useState(5);
  const [watermarkOpacity, setWatermarkOpacity] = useState(75);

  const handleApplyPreset = useCallback((preset: ExportPreset) => {
    setFileFormat(preset.fileFormat);
    setJpegQuality(preset.jpegQuality);
    setEnableResize(preset.enableResize);
    setResizeMode(preset.resizeMode);
    setResizeValue(preset.resizeValue);
    setDontEnlarge(preset.dontEnlarge);
    setKeepMetadata(preset.keepMetadata);
    setStripGps(preset.stripGps);
    setFilenameTemplate(preset.filenameTemplate);
    setEnableWatermark(preset.enableWatermark);
    setWatermarkPath(preset.watermarkPath);
    setWatermarkAnchor(preset.watermarkAnchor as WatermarkAnchor);
    setWatermarkScale(preset.watermarkScale);
    setWatermarkSpacing(preset.watermarkSpacing);
    setWatermarkOpacity(preset.watermarkOpacity);
  }, []);

  const currentSettingsObject = useMemo(
    () => ({
      fileFormat,
      jpegQuality,
      enableResize,
      resizeMode,
      resizeValue,
      dontEnlarge,
      keepMetadata,
      stripGps,
      filenameTemplate,
      enableWatermark,
      watermarkPath,
      watermarkAnchor,
      watermarkScale,
      watermarkSpacing,
      watermarkOpacity,
    }),
    [
      fileFormat,
      jpegQuality,
      enableResize,
      resizeMode,
      resizeValue,
      dontEnlarge,
      keepMetadata,
      stripGps,
      filenameTemplate,
      enableWatermark,
      watermarkPath,
      watermarkAnchor,
      watermarkScale,
      watermarkSpacing,
      watermarkOpacity,
    ]
  );

  return {
    fileFormat,
    setFileFormat,
    jpegQuality,
    setJpegQuality,
    enableResize,
    setEnableResize,
    resizeMode,
    setResizeMode,
    resizeValue,
    setResizeValue,
    dontEnlarge,
    setDontEnlarge,
    keepMetadata,
    setKeepMetadata,
    stripGps,
    setStripGps,
    filenameTemplate,
    setFilenameTemplate,
    enableWatermark,
    setEnableWatermark,
    watermarkPath,
    setWatermarkPath,
    watermarkAnchor,
    setWatermarkAnchor,
    watermarkScale,
    setWatermarkScale,
    watermarkSpacing,
    setWatermarkSpacing,
    watermarkOpacity,
    setWatermarkOpacity,
    handleApplyPreset,
    currentSettingsObject,
  };
}