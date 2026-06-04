function getLuminance(rgb) {
  const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(fg, bg) {
  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const fg = { r: parseInt('15', 16), g: parseInt('5D', 16), b: parseInt('FC', 16) }; // #155DFC

const bgs = [
  { r: 243, g: 244, b: 246 }, // #F3F4F6 gray-100
  { r: 229, g: 231, b: 235 }, // #E5E7EB gray-200
  { r: 248, g: 250, b: 252 }, // #F8FAFC slate-50
  { r: 241, g: 245, b: 249 }, // #F1F5F9 slate-100
  { r: 226, g: 232, b: 240 }, // #E2E8F0 slate-200
  { r: 219, g: 234, b: 254 }, // #DBEAFE blue-100
  { r: 191, g: 219, b: 254 }, // #BFDBFE blue-200
  { r: 239, g: 246, b: 255 }, // #EFF6FF blue-50
];

bgs.forEach(bg => {
  console.log(`Bg: ${bg.r},${bg.g},${bg.b} -> Contrast: ${getContrastRatio(fg, bg).toFixed(2)}`);
});
