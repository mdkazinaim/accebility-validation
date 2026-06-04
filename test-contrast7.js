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

const fg = { r: parseInt('36', 16), g: parseInt('41', 16), b: parseInt('53', 16) }; // #364153
const bg = { r: parseInt('F6', 16), g: parseInt('F6', 16), b: parseInt('F8', 16) }; // #F6F6F8

console.log("Contrast for #364153 on #F6F6F8:", getContrastRatio(fg, bg).toFixed(2));
