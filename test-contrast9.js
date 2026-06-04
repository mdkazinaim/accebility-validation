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

const bg = { r: parseInt('F6', 16), g: parseInt('F6', 16), b: parseInt('F8', 16) }; // #F6F6F8

for (let r = 0; r <= 255; r++) {
  const fg = {r, g: r, b: r};
  const cr = getContrastRatio(fg, bg);
  if (cr >= 9.85 && cr <= 9.95) {
    console.log("Found Gray FG:", r, "Hex:", r.toString(16), "Contrast:", cr.toFixed(2));
  }
}
