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

const fg = { r: parseInt('8A', 16), g: parseInt('8E', 16), b: parseInt('99', 16) }; // Try some grays
const bg = { r: 255, g: 255, b: 255 }; // #FFFFFF

console.log("Contrast for #8A8E99 on #FFFFFF:", getContrastRatio(fg, bg).toFixed(2));
const fg2 = { r: parseInt('9C', 16), g: parseInt('A3', 16), b: parseInt('AF', 16) }; // #9CA3AF (gray-400)
console.log("Contrast for #9CA3AF on #FFFFFF:", getContrastRatio(fg2, bg).toFixed(2));
const fg3 = { r: parseInt('6B', 16), g: parseInt('72', 16), b: parseInt('80', 16) }; // #6B7280 (gray-500)
console.log("Contrast for #6B7280 on #FFFFFF:", getContrastRatio(fg3, bg).toFixed(2));
const fg4 = { r: parseInt('94', 16), g: parseInt('A3', 16), b: parseInt('B8', 16) }; // slate-400
console.log("Contrast for #94A3B8 on #FFFFFF:", getContrastRatio(fg4, bg).toFixed(2));
const fg5 = { r: parseInt('82', 16), g: parseInt('8D', 16), b: parseInt('99', 16) }; // ???
console.log("Contrast for #828D99 on #FFFFFF:", getContrastRatio(fg5, bg).toFixed(2));
