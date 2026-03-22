// Add class from array of elements or just an element
export const addClass = function (xlass, ...el) {
  el.forEach((e) => e.classList.add(xlass));
};

// Remove class from array of elements or just an element
export const removeClass = function (xlass, ...el) {
  el.forEach((e) => e.classList.remove(xlass));
};

// Validate color
export const isValidColor = function (input) {
  const hexRegex = /^#([0-9A-Fa-f]{6})$/;
  const rgbRegex = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/;
  return hexRegex.test(input) || rgbRegex.test(input);
};

// normalize inputs (hex to rex)
export const hexToRgb = function (hex) {
  hex = hex.replace(/^#/, ""); // remove leading #
  if (hex.length === 3) {
    // expand shorthand like #abc -> #aabbcc
    hex = hex
      .split("")
      .map((x) => x + x)
      .join("");
  }
  const bigint = parseInt(hex, 16); // convert hex string to integer
  return {
    r: (bigint >> 16) & 255, // extract red channel
    g: (bigint >> 8) & 255, // extract green channel
    b: bigint & 255, // extract blue channel
  };
};

// Normalize inputs (rgb to hex)
export const rgbToHex = function (r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
};

//  convert rgb to HSL for harmonies
export const rgbToHsl = function (r, g, b) {
  // Normalize to 0-1
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

// Convert hsl to rgb
export const hslToRgb = function (h, s, l) {
  // convert percentages to decimals
  s /= 100;
  l /= 100;

  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  return {
    r: Math.round(255 * f(0)),
    g: Math.round(255 * f(8)),
    b: Math.round(255 * f(4)),
  };
};

let scrollTimeout;

// Smooth scrolling
export const smoothScrollDebounced = function (
  el,
  block = "center",
  inline = "nearest",
  delay = 100,
) {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    el.scrollIntoView({
      behavior: "smooth",
      block,
      inline,
    });
  }, delay);
};
