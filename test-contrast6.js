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

for (let i = 0; i <= 255; i++) {
  const bg = {r: i, g: i, b: i};
  if (Math.abs(getContrastRatio(fg, bg) - 3.8) < 0.05) {
    console.log("Found Bg:", i, "Contrast:", getContrastRatio(fg, bg).toFixed(2));
  }
}
