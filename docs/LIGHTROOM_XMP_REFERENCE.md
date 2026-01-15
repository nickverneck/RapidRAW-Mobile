# Lightroom XMP Sidecar File Reference

## Overview
This document provides a comprehensive reference for Adobe Lightroom XMP (Extensible Metadata Platform) sidecar files. These files store non-destructive editing adjustments and metadata for images.

## File Structure

### Basic Format
```xml
<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/"
      xmlns:xmp="http://ns.adobe.com/xap/1.0/"
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:exif="http://ns.adobe.com/exif/1.0/">
      
      <!-- Camera Raw Settings (crs:) -->
      <!-- XMP Core Properties (xmp:) -->
      <!-- Dublin Core Metadata (dc:) -->
      <!-- EXIF Data (exif:) -->
      
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
```

### XML Namespaces
- **`crs:`** - Camera Raw Settings (all editing adjustments)
- **`xmp:`** - XMP core properties (ratings, labels, dates)
- **`dc:`** - Dublin Core (title, description, creator, keywords)
- **`exif:`** - EXIF camera data
- **`aux:`** - Auxiliary data (lens info, firmware)
- **`photoshop:`** - Photoshop-specific metadata
- **`Iptc4xmpCore:`** - IPTC metadata

---

## Camera Raw Settings (crs:) - Adjustments

### 1. Basic Adjustments

#### Version & Process
```xml
<crs:Version>15.3</crs:Version>
<crs:ProcessVersion>11.0</crs:ProcessVersion>
<crs:HasSettings>True</crs:HasSettings>
```
- **ProcessVersion**: `11.0` = 2012 Process, `6.7` = 2010 Process
- **Implementation**: ✅ **Supported** (version tracking)

#### Exposure & Tone
```xml
<crs:Exposure2012>+0.50</crs:Exposure2012>
<crs:Contrast2012>+25</crs:Contrast2012>
<crs:Highlights2012>-50</crs:Highlights2012>
<crs:Shadows2012>+75</crs:Shadows2012>
<crs:Whites2012>+30</crs:Whites2012>
<crs:Blacks2012>-20</crs:Blacks2012>
```
- **Range**: `-4.0` to `+4.0` (Exposure), `-100` to `+100` (others)
- **Implementation**: 
  - ✅ Exposure2012 → `exposure`
  - ✅ Contrast2012 → `contrast`
  - ✅ Highlights2012 → `highlights`
  - ✅ Shadows2012 → `shadows` (scaled by 1.5x)
  - ✅ Whites2012 → `whites`
  - ✅ Blacks2012 → `blacks`

### 2. White Balance
```xml
<crs:WhiteBalance>As Shot</crs:WhiteBalance>
<crs:Temperature>5500</crs:Temperature>
<crs:Tint>+10</crs:Tint>
```
- **WhiteBalance**: `As Shot`, `Auto`, `Daylight`, `Cloudy`, `Shade`, `Tungsten`, `Fluorescent`, `Flash`, `Custom`
- **Temperature**: Kelvin value (2000-50000)
- **Tint**: -150 to +150 (green to magenta)
- **Implementation**: 
  - ✅ Temperature → `temperature` (converted via mired shift)
  - ✅ Tint → `tint` (scaled to -100 to +100)

### 3. Presence
```xml
<crs:Clarity2012>+30</crs:Clarity2012>
<crs:Dehaze>+20</crs:Dehaze>
<crs:Vibrance>+15</crs:Vibrance>
<crs:Saturation>0</crs:Saturation>
<crs:Texture>+10</crs:Texture>
```
- **Range**: -100 to +100
- **Implementation**: 
  - ✅ Clarity2012 → `clarity`
  - ✅ Dehaze → `dehaze`
  - ✅ Vibrance → `vibrance`
  - ✅ Saturation → `saturation`
  - ✅ Texture → `structure`

---

### 4. Tone Curve

#### Parametric Curve (Legacy)
```xml
<crs:ParametricShadows>0</crs:ParametricShadows>
<crs:ParametricDarks>0</crs:ParametricDarks>
<crs:ParametricLights>0</crs:ParametricLights>
<crs:ParametricHighlights>0</crs:ParametricHighlights>
<crs:ParametricShadowSplit>25</crs:ParametricShadowSplit>
<crs:ParametricMidtoneSplit>50</crs:ParametricMidtoneSplit>
<crs:ParametricHighlightSplit>75</crs:ParametricHighlightSplit>
```
- **Implementation**: ❌ **Not supported** (uses point curve instead)

#### Point Curve
```xml
<crs:ToneCurvePV2012>
  <rdf:Seq>
    <rdf:li>0, 0</rdf:li>
    <rdf:li>32, 35</rdf:li>
    <rdf:li>64, 70</rdf:li>
    <rdf:li>128, 128</rdf:li>
    <rdf:li>255, 255</rdf:li>
  </rdf:Seq>
</crs:ToneCurvePV2012>
<crs:ToneCurvePV2012Red>
  <rdf:Seq>
    <rdf:li>0, 0</rdf:li>
    <rdf:li>255, 255</rdf:li>
  </rdf:Seq>
</crs:ToneCurvePV2012Red>
<crs:ToneCurvePV2012Green>...</crs:ToneCurvePV2012Green>
<crs:ToneCurvePV2012Blue>...</crs:ToneCurvePV2012Blue>
```
- **Format**: Comma-separated points (x, y) where x,y = 0-255
- **Implementation**: 
  - ✅ ToneCurvePV2012 → `curves.luma` (with shadow dampening)
  - ✅ ToneCurvePV2012Red → `curves.red`
  - ✅ ToneCurvePV2012Green → `curves.green`
  - ✅ ToneCurvePV2012Blue → `curves.blue`

---

### 5. HSL / Color Adjustments

#### HSL Panel
```xml
<crs:HueAdjustmentRed>0</crs:HueAdjustmentRed>
<crs:HueAdjustmentOrange>0</crs:HueAdjustmentOrange>
<crs:HueAdjustmentYellow>0</crs:HueAdjustmentYellow>
<crs:HueAdjustmentGreen>0</crs:HueAdjustmentGreen>
<crs:HueAdjustmentAqua>0</crs:HueAdjustmentAqua>
<crs:HueAdjustmentBlue>0</crs:HueAdjustmentBlue>
<crs:HueAdjustmentPurple>0</crs:HueAdjustmentPurple>
<crs:HueAdjustmentMagenta>0</crs:HueAdjustmentMagenta>

<crs:SaturationAdjustmentRed>0</crs:SaturationAdjustmentRed>
<crs:SaturationAdjustmentOrange>0</crs:SaturationAdjustmentOrange>
<!-- ... same colors ... -->

<crs:LuminanceAdjustmentRed>0</crs:LuminanceAdjustmentRed>
<crs:LuminanceAdjustmentOrange>0</crs:LuminanceAdjustmentOrange>
<!-- ... same colors ... -->
```
- **Range**: -100 to +100
- **Colors**: Red, Orange, Yellow, Green, Aqua, Blue, Purple, Magenta
- **Implementation**: 
  - ✅ HueAdjustment[Color] → `hsl.[color].hue` (scaled by 0.75x)
  - ✅ SaturationAdjustment[Color] → `hsl.[color].saturation`
  - ✅ LuminanceAdjustment[Color] → `hsl.[color].luminance`

---

### 6. Split Toning / Color Grading

#### Legacy Split Toning (LR < 10)
```xml
<crs:SplitToningShadowHue>0</crs:SplitToningShadowHue>
<crs:SplitToningShadowSaturation>0</crs:SplitToningShadowSaturation>
<crs:SplitToningHighlightHue>0</crs:SplitToningHighlightHue>
<crs:SplitToningHighlightSaturation>0</crs:SplitToningHighlightSaturation>
<crs:SplitToningBalance>0</crs:SplitToningBalance>
```
- **Implementation**: 
  - ✅ SplitToningShadowHue → `colorGrading.shadows.hue`
  - ✅ SplitToningShadowSaturation → `colorGrading.shadows.saturation`
  - ✅ SplitToningHighlightHue → `colorGrading.highlights.hue`
  - ✅ SplitToningHighlightSaturation → `colorGrading.highlights.saturation`
  - ✅ SplitToningBalance → `colorGrading.balance`

#### Modern Color Grading (LR 10+)
```xml
<crs:ColorGradeShadowLum>0</crs:ColorGradeShadowLum>
<crs:ColorGradeMidtoneLum>0</crs:ColorGradeMidtoneLum>
<crs:ColorGradeHighlightLum>0</crs:ColorGradeHighlightLum>
<crs:ColorGradeMidtoneHue>0</crs:ColorGradeMidtoneHue>
<crs:ColorGradeMidtoneSat>0</crs:ColorGradeMidtoneSat>
<crs:ColorGradeBlending>50</crs:ColorGradeBlending>
<crs:ColorGradeGlobalHue>0</crs:ColorGradeGlobalHue>
<crs:ColorGradeGlobalSat>0</crs:ColorGradeGlobalSat>
<crs:ColorGradeGlobalLum>0</crs:ColorGradeGlobalLum>
```
- **Implementation**: 
  - ✅ ColorGradeShadowLum → `colorGrading.shadows.luminance`
  - ✅ ColorGradeMidtoneLum → `colorGrading.midtones.luminance`
  - ✅ ColorGradeHighlightLum → `colorGrading.highlights.luminance`
  - ✅ ColorGradeMidtoneHue → `colorGrading.midtones.hue`
  - ✅ ColorGradeMidtoneSat → `colorGrading.midtones.saturation`
  - ✅ ColorGradeBlending → `colorGrading.blending`
  - ❌ Global adjustments not mapped

---

### 7. Detail (Sharpening & Noise Reduction)

#### Sharpening
```xml
<crs:Sharpness>40</crs:Sharpness>
<crs:SharpenRadius>1.0</crs:SharpenRadius>
<crs:SharpenDetail>25</crs:SharpenDetail>
<crs:SharpenEdgeMasking>0</crs:SharpenEdgeMasking>
```
- **Range**: 0-150 (Sharpness), 0.5-3.0 (Radius), 0-100 (Detail, Masking)
- **Implementation**: 
  - ✅ Sharpness → `sharpness` (scaled: /150 * 100)
  - ✅ SharpenRadius → `sharpenRadius`
  - ✅ SharpenDetail → `sharpenDetail`
  - ✅ SharpenEdgeMasking → `sharpenMasking`

#### Noise Reduction
```xml
<crs:LuminanceSmoothing>0</crs:LuminanceSmoothing>
<crs:LuminanceNoiseReductionDetail>50</crs:LuminanceNoiseReductionDetail>
<crs:LuminanceNoiseReductionContrast>0</crs:LuminanceNoiseReductionContrast>
<crs:ColorNoiseReduction>25</crs:ColorNoiseReduction>
<crs:ColorNoiseReductionDetail>50</crs:ColorNoiseReductionDetail>
<crs:ColorNoiseReductionSmoothness>50</crs:ColorNoiseReductionSmoothness>
```
- **Range**: 0-100
- **Implementation**: 
  - ✅ LuminanceSmoothing → `lumaNoiseReduction`
  - ❌ LuminanceNoiseReductionDetail
  - ❌ LuminanceNoiseReductionContrast
  - ✅ ColorNoiseReduction → `colorNoiseReduction`
  - ✅ ColorNoiseReductionDetail → `colorNoiseDetail`
  - ✅ ColorNoiseReductionSmoothness → `colorNoiseSmoothness`

---

### 8. Lens Corrections

#### Chromatic Aberration
```xml
<crs:ChromaticAberrationR>0</crs:ChromaticAberrationR>
<crs:ChromaticAberrationB>0</crs:ChromaticAberrationB>
```
- **Implementation**: ❌ **Not supported** (using newer keys below)

```xml
<crs:ChromaticAberrationRedCyan>0</crs:ChromaticAberrationRedCyan>
<crs:ChromaticAberrationBlueYellow>0</crs:ChromaticAberrationBlueYellow>
```
- **Implementation**: ✅ Both mapped directly

#### Distortion & Vignette Removal
```xml
<crs:LensProfileEnable>1</crs:LensProfileEnable>
<crs:LensManualDistortionAmount>0</crs:LensManualDistortionAmount>
<crs:VignetteAmount>0</crs:VignetteAmount>
<crs:DefringePurpleAmount>0</crs:DefringePurpleAmount>
<crs:DefringePurpleHueLo>30</crs:DefringePurpleHueLo>
<crs:DefringePurpleHueHi>70</crs:DefringePurpleHueHi>
<crs:DefringeGreenAmount>0</crs:DefringeGreenAmount>
<crs:DefringeGreenHueLo>40</crs:DefringeGreenHueLo>
<crs:DefringeGreenHueHi>60</crs:DefringeGreenHueHi>
```
- **Implementation**: ❌ **Not supported**

#### Perspective & Transform
```xml
<crs:PerspectiveUpright>0</crs:PerspectiveUpright>
<crs:PerspectiveVertical>0</crs:PerspectiveVertical>
<crs:PerspectiveHorizontal>0</crs:PerspectiveHorizontal>
<crs:PerspectiveRotate>0.0</crs:PerspectiveRotate>
<crs:PerspectiveAspect>0</crs:PerspectiveAspect>
<crs:PerspectiveScale>100</crs:PerspectiveScale>
<crs:PerspectiveX>0.00</crs:PerspectiveX>
<crs:PerspectiveY>0.00</crs:PerspectiveY>
```
- **Implementation**: ❌ **Not supported**

---

### 9. Effects

#### Post-Crop Vignette
```xml
<crs:PostCropVignetteAmount>0</crs:PostCropVignetteAmount>
<crs:PostCropVignetteMidpoint>50</crs:PostCropVignetteMidpoint>
<crs:PostCropVignetteFeather>50</crs:PostCropVignetteFeather>
<crs:PostCropVignetteRoundness>0</crs:PostCropVignetteRoundness>
<crs:PostCropVignetteStyle>1</crs:PostCropVignetteStyle>
<crs:PostCropVignetteHighlightContrast>0</crs:PostCropVignetteHighlightContrast>
```
- **Range**: -100 to +100 (Amount), 0-100 (others)
- **Style**: 1 = Highlight Priority, 2 = Color Priority, 3 = Paint Overlay
- **Implementation**: 
  - ✅ PostCropVignetteAmount → `vignetteAmount`
  - ✅ PostCropVignetteMidpoint → `vignetteMidpoint`
  - ✅ PostCropVignetteFeather → `vignetteFeather`
  - ✅ PostCropVignetteRoundness → `vignetteRoundness`
  - ❌ Style, HighlightContrast

#### Grain
```xml
<crs:GrainAmount>0</crs:GrainAmount>
<crs:GrainSize>25</crs:GrainSize>
<crs:GrainFrequency>50</crs:GrainFrequency>
```
- **Range**: 0-100
- **Implementation**: 
  - ✅ GrainAmount → `grainAmount`
  - ✅ GrainSize → `grainSize`
  - ✅ GrainFrequency → `grainRoughness`

---

### 10. Crop & Transform

```xml
<crs:HasCrop>True</crs:HasCrop>
<crs:CropTop>0.123456</crs:CropTop>
<crs:CropLeft>0.234567</crs:CropLeft>
<crs:CropBottom>0.876543</crs:CropBottom>
<crs:CropRight>0.765432</crs:CropRight>
<crs:CropAngle>-2.5</crs:CropAngle>
<crs:CropConstrainToWarp>0</crs:CropConstrainToWarp>
```
- **Values**: 0.0 to 1.0 (normalized coordinates)
- **Implementation**: ❌ **Not supported**

---

### 11. Local Adjustments (Masks)

#### Graduated Filter
```xml
<crs:GradientBasedCorrections>
  <rdf:Seq>
    <rdf:li>
      <rdf:Description>
        <crs:What>Correction</crs:What>
        <crs:CorrectionAmount>1.0</crs:CorrectionAmount>
        <crs:LocalExposure>0.50</crs:LocalExposure>
        <crs:LocalContrast>0.25</crs:LocalContrast>
        <crs:LocalClarity>0.30</crs:LocalClarity>
        <crs:LocalSaturation>0.15</crs:LocalSaturation>
        <crs:LocalSharpness>0.20</crs:LocalSharpness>
        <!-- Gradient geometry -->
      </rdf:Description>
    </rdf:li>
  </rdf:Seq>
</crs:GradientBasedCorrections>
```
- **Implementation**: ❌ **Not supported**

#### Radial Filter
```xml
<crs:CircularGradientBasedCorrections>
  <rdf:Seq>
    <rdf:li>
      <rdf:Description>
        <crs:What>Correction</crs:What>
        <!-- Similar to gradient filter -->
      </rdf:Description>
    </rdf:li>
  </rdf:Seq>
</crs:CircularGradientBasedCorrections>
```
- **Implementation**: ❌ **Not supported**

#### Adjustment Brush
```xml
<crs:PaintBasedCorrections>
  <rdf:Seq>
    <rdf:li>
      <rdf:Description>
        <crs:What>Correction</crs:What>
        <crs:Masks>
          <rdf:Seq>
            <rdf:li>
              <rdf:Description>
                <crs:What>Mask/Paint</crs:What>
                <crs:MaskValue>1.0</crs:MaskValue>
                <!-- Brush stroke data -->
              </rdf:Description>
            </rdf:li>
          </rdf:Seq>
        </crs:Masks>
      </rdf:Description>
    </rdf:li>
  </rdf:Seq>
</crs:PaintBasedCorrections>
```
- **Implementation**: ❌ **Not supported**

#### Modern Masking (LR 11+)
```xml
<crs:MaskGroupBasedCorrections>
  <rdf:Seq>
    <rdf:li>
      <rdf:Description>
        <crs:What>Correction</crs:What>
        <crs:CorrectionMasks>
          <rdf:Seq>
            <rdf:li>
              <rdf:Description>
                <crs:What>Mask/Image</crs:What>
                <crs:MaskVersion>1</crs:MaskVersion>
                <crs:MaskSubType>2</crs:MaskSubType>
                <!-- AI masks: Subject, Sky, Background, Person -->
              </rdf:Description>
            </rdf:li>
          </rdf:Seq>
        </crs:CorrectionMasks>
      </rdf:Description>
    </rdf:li>
  </rdf:Seq>
</crs:MaskGroupBasedCorrections>
```
- **MaskSubType**: 0=Paint, 1=Linear, 2=Radial, 3=Magic Wand, 4=AI
- **Implementation**: ❌ **Not supported**

---

### 12. Calibration

```xml
<crs:ShadowTint>0</crs:ShadowTint>
<crs:RedHue>0</crs:RedHue>
<crs:RedSaturation>0</crs:RedSaturation>
<crs:GreenHue>0</crs:GreenHue>
<crs:GreenSaturation>0</crs:GreenSaturation>
<crs:BlueHue>0</crs:BlueHue>
<crs:BlueSaturation>0</crs:BlueSaturation>
```
- **Range**: -100 to +100
- **Implementation**: ❌ **Not supported**

---

### 13. Camera Profile

```xml
<crs:CameraProfile>Adobe Standard</crs:CameraProfile>
<crs:CameraProfileDigest>...</crs:CameraProfileDigest>
<crs:LensProfileSetup>LensDefaults</crs:LensProfileSetup>
<crs:LensProfileName>...</crs:LensProfileName>
```
- **Implementation**: ❌ **Not supported**

---

### 14. AI Features (LR 12+)

#### Denoise
```xml
<crs:RawFileName>IMG_1234.CR2</crs:RawFileName>
<crs:RawFileDigest>...</crs:RawFileDigest>
<crs:NoiseReductionApplied>True</crs:NoiseReductionApplied>
```
- **Implementation**: ❌ **Not supported** (RapidRAW has separate denoise system)

#### Enhance Details
```xml
<crs:EnhanceDetailsApplied>True</crs:EnhanceDetailsApplied>
```
- **Implementation**: ❌ **Not supported**

#### Super Resolution
```xml
<crs:SuperResolutionApplied>True</crs:SuperResolutionApplied>
```
- **Implementation**: ❌ **Not supported**

---

## XMP Core Properties (xmp:)

```xml
<xmp:Rating>5</xmp:Rating>
<xmp:Label>Red</xmp:Label>
<xmp:ModifyDate>2024-01-15T10:30:00</xmp:ModifyDate>
<xmp:CreateDate>2024-01-15T09:00:00</xmp:CreateDate>
<xmp:MetadataDate>2024-01-15T10:30:00</xmp:MetadataDate>
<xmp:CreatorTool>Adobe Lightroom Classic 13.1 (Macintosh)</xmp:CreatorTool>
```
- **Rating**: 0-5 stars
- **Label**: `Red`, `Yellow`, `Green`, `Blue`, `Purple`
- **Implementation**: ⚠️ **Partially supported** (RapidRAW has rating/tagging system)

---

## Dublin Core Metadata (dc:)

```xml
<dc:format>image/dng</dc:format>
<dc:creator>
  <rdf:Seq>
    <rdf:li>Photographer Name</rdf:li>
  </rdf:Seq>
</dc:creator>
<dc:title>
  <rdf:Alt>
    <rdf:li xml:lang="x-default">Image Title</rdf:li>
  </rdf:Alt>
</dc:title>
<dc:description>
  <rdf:Alt>
    <rdf:li xml:lang="x-default">Image description</rdf:li>
  </rdf:Alt>
</dc:description>
<dc:subject>
  <rdf:Bag>
    <rdf:li>keyword1</rdf:li>
    <rdf:li>keyword2</rdf:li>
    <rdf:li>keyword3</rdf:li>
  </rdf:Bag>
</dc:subject>
<dc:rights>
  <rdf:Alt>
    <rdf:li xml:lang="x-default">Copyright notice</rdf:li>
  </rdf:Alt>
</dc:rights>
```
- **Implementation**: ⚠️ **Partially supported** (RapidRAW has tagging system)

---

## EXIF Data (exif:)

```xml
<exif:DateTimeOriginal>2024-01-15T09:00:00</exif:DateTimeOriginal>
<exif:Make>Canon</exif:Make>
<exif:Model>Canon EOS R5</exif:Model>
<exif:ExposureTime>1/250</exif:ExposureTime>
<exif:FNumber>28/10</exif:FNumber>
<exif:ISO>400</exif:ISO>
<exif:FocalLength>50/1</exif:FocalLength>
<exif:LensModel>RF 50mm F1.2 L USM</exif:LensModel>
<exif:GPSLatitude>37,46.8600N</exif:GPSLatitude>
<exif:GPSLongitude>122,25.2300W</exif:GPSLongitude>
```
- **Implementation**: ✅ **Read-only** (RapidRAW reads EXIF, can strip GPS on export)

---

## Preset Name Storage

```xml
<crs:Name>
  <rdf:Alt>
    <rdf:li xml:lang="x-default">My Custom Preset</rdf:li>
  </rdf:Alt>
</crs:Name>
```
- **Implementation**: ✅ **Supported** (extracted when importing XMP presets)

---

## Implementation Summary

### ✅ Fully Supported (33 parameters)
- Basic tone adjustments (Exposure, Contrast, Highlights, Shadows, Whites, Blacks)
- White balance (Temperature, Tint)
- Presence (Clarity, Dehaze, Vibrance, Saturation, Texture)
- Tone curves (Luma, Red, Green, Blue channels)
- HSL adjustments (all 8 colors × 3 properties)
- Color grading (Split toning + modern color grading)
- Sharpening (Amount, Radius, Detail, Masking)
- Noise reduction (Luma, Color with detail controls)
- Chromatic aberration correction
- Post-crop vignette (4 parameters)
- Grain effects (Amount, Size, Frequency)
- Preset name extraction

### ⚠️ Partially Supported
- Ratings and labels (via RapidRAW's tagging system)
- Keywords/metadata (via RapidRAW's tagging system)
- EXIF data (read-only)

### ❌ Not Supported (High Priority)
- **Crop & straighten** - Essential for complete workflow
- **Local adjustments** (Brushes, Gradients, Radial filters)
- **AI-based masks** (Subject, Sky, etc.)
- **Lens corrections** (Distortion, defringing)
- **Perspective corrections**
- **Camera calibration**
- **Camera profiles**
- **Parametric tone curve**

### ❌ Not Supported (Lower Priority)
- AI Denoise (RapidRAW has own system)
- Enhance Details
- Super Resolution
- Lens profile metadata
- Various detail parameters

---

## File Naming Conventions

### Sidecar Files
- **Lightroom**: `IMG_1234.CR2` → `IMG_1234.xmp`
- **RapidRAW**: Uses `.rrdata` files for edits

### Exported Presets
- **Lightroom**: `.xmp` or `.lrtemplate`
- **RapidRAW**: `.rrpreset` (JSON format)

---

## Compatibility Notes

1. **Process Version**: Most modern presets use Process Version 11.0 (2012 Process). Older versions may have different parameter names.

2. **Scaling Factors**: Some adjustments require scaling when converting:
   - Shadows: 1.5x multiplier in RapidRAW
   - Sharpness: LR uses 0-150, RapidRAW uses 0-100
   - Hue adjustments: 0.75x multiplier
   - Temperature: Complex mired-based conversion

3. **Missing Features**: For full Lightroom compatibility, RapidRAW would need to implement:
   - Crop tool with rotation
   - Local adjustment tools
   - Lens correction database
   - Camera profile system

4. **Export Workflow**: Consider generating XMP sidecars on export for compatibility with other software.

---

## Resources

- [Adobe XMP Specification](https://github.com/adobe/xmp-docs)
- [Camera Raw Settings Schema](http://ns.adobe.com/camera-raw-settings/1.0/)
- [EXIF Standard](https://www.exif.org/)
- [Dublin Core Metadata](https://www.dublincore.org/)

---

## Related Files in RapidRAW

- **Parser**: `src-tauri/src/preset_converter.rs` - XMP to RapidRAW conversion
- **Import UI**: `src/components/panel/right/PresetsPanel.tsx` - Handles `.xmp` imports
- **Presets Hook**: `src/hooks/usePresets.ts` - Preset management system
