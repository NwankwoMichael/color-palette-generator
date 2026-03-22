import namer from "color-namer";
import {
  hslToRgb,
  rgbToHex,
  hexToRgb,
  rgbToHsl,
  isValidColor,
} from "./helper.js";

export const paletteModel = {
  intensity: 10,
  palettes: [],
  favorites: [],
};

// Create a new palette
export const createNewPalette = function (baseColor) {
  const newPalette = {
    baseColor,
    paletteId: Date.now().toString(),
    name: assignColorName(baseColor),
    tints: [],
    shades: [],
    harmonies: {},
    harmoniesPalettes: {},
    favorited: false,
  };

  return newPalette;
};

// Assign a user friendly name for each user input color
export const assignColorName = function (baseColor) {
  // Resolve name via color-namer
  const names = namer(baseColor);
  return names.ntc[0].name; // store friendly name;
};

// update palette base color
export const updatePaletteBaseColor = function (id, updatedColor) {
  const palette = paletteModel.palettes.find((p) => p.paletteId === id);
  if (!palette) return null;
  Object.assign(palette, updatedColor);
  return palette;
};

// Remmove generated palette by ID
export const removePalette = function (id) {
  const index = paletteModel.palettes.findIndex((p) => p.paletteId === id);
  // Remove palette From palettes
  if (index === -1) return false;
  paletteModel.palettes.splice(index, 1);
  return true;
};

export const removeSavedPalette = function (id) {
  const index = paletteModel.favorites.findIndex((p) => p.paletteId === id);

  // Remove palette from favorite palettes
  if (index === -1) return false;
  paletteModel.favorites.splice(index, 1);
  return true;
};

// // Fill arrays
export const generateTintsShades = function (
  baseColor,
  intensity = colorModel.intensity,
) {
  // Initializing empty arrays
  let tints = [];
  let shades = [];

  if (!baseColor) {
    console.error("No base color provided to generateTintsAndShadesPalettes");
    return { tints: [], shades: [] };
  }

  //   Update currentBase
  paletteModel.baseColor = baseColor.toLowerCase();

  let rgbValues;

  // Normalizing every input to RGB format
  if (paletteModel.baseColor.startsWith("#")) {
    // hex input
    const { r, g, b } = hexToRgb(paletteModel.baseColor);
    rgbValues = [r, g, b];
  } else if (paletteModel.baseColor.startsWith("rgb")) {
    // rgb string input
    const innerValues = paletteModel.baseColor.slice(
      paletteModel.baseColor.indexOf("(") + 1,
      paletteModel.baseColor.indexOf(")"),
    );
    rgbValues = innerValues.split(/,\s*/).map(Number);
  } else {
    console.error("Unsupported color format:", paletteModel.baseColor);
    return { tints: [], shades: [] };
  }

  //   converting intensity to decimal
  const step = intensity / 100;

  //   Loop from current intensity to 100%
  for (let current = step; current <= 1.01; current += step) {
    // Ensure not to exceed 1.0 (white)
    let level = Math.min(current, 1.0);

    //   Generating tints (move towards white)
    let tintRgb = rgbValues.map((val) => Math.round(val + (255 - val) * level));

    //   Generating shades (move toward black)
    let shadeRgb = rgbValues.map((val) => Math.round(val * (1 - level)));

    //   convert color to match user input format
    let tintFinal = paletteModel.baseColor.startsWith("#")
      ? rgbToHex(tintRgb[0], tintRgb[1], tintRgb[2])
      : `rgb(${tintRgb.join(", ")})`; // Convert tint back to strings

    // Pushing each generated tint into initialized tints array
    tints.push(tintFinal);

    let shadeFinal = paletteModel.baseColor.startsWith("#")
      ? rgbToHex(shadeRgb[0], shadeRgb[1], shadeRgb[2])
      : `rgb(${shadeRgb.join(", ")})`; // Convert shade back to strings

    // Pushing each generated shade into initializes shadePalette array
    shades.push(shadeFinal);
  }
  return { tints, shades };
};

export const generateHarmony = function (colorInput, type) {
  // Guard clause
  if (
    !isValidColor(colorInput) ||
    (type !== "complementary" && type !== "analogous" && type !== "triadic")
  )
    return;

  let format = "hex";
  let rgb;

  // Detect format
  if (colorInput.startsWith("#")) {
    format = "hex";
    rgb = hexToRgb(colorInput);
  } else if (colorInput.startsWith("rgb")) {
    format = "rgb";
    const [r, g, b] = colorInput
      .slice(colorInput.indexOf("(") + 1, colorInput.indexOf(")"))
      .split(/,\s*/)
      .map(Number);

    rgb = { r, g, b };
  }

  // Convert to HSL for harmony math
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const harmonies = {};

  if (type === "complementary") {
    const comp = hslToRgb((h + 180) % 360, s, l);
    harmonies.complementary =
      format === "hex"
        ? [rgbToHex(comp.r, comp.g, comp.b)]
        : [`rgb(${comp.r}, ${comp.g}, ${comp.b})`];
  }

  if (type === "analogous") {
    const ana1 = hslToRgb((h + 30) % 360, s, l);
    const ana2 = hslToRgb(h - 30 + (360 % 360), s, l);
    harmonies.analogous =
      format === "hex"
        ? [rgbToHex(ana1.r, ana1.g, ana1.b), rgbToHex(ana2.r, ana2.g, ana2.b)]
        : [
            `rgb(${ana1.r}, ${ana1.g}, ${ana1.b})`,
            `rgb(${ana2.r}, ${ana2.g}, ${ana2.b});`,
          ];
  }

  if (type === "triadic") {
    const tri1 = hslToRgb((h + 120) % 360, s, l);
    const tri2 = hslToRgb((h - 120 + 360) % 360, s, l);
    harmonies.triadic =
      format === "hex"
        ? [rgbToHex(tri1.r, tri1.g, tri1.b), rgbToHex(tri2.r, tri2.g, tri2.b)]
        : [
            `rgb(${tri1.r}, ${tri1.g}, ${tri1.b})`,
            `rgb(${tri2.r}, ${tri2.g}, ${tri2.b})`,
          ];
  }

  return harmonies;
};

export const generateHarmonyPaletteDelegation = function (
  paletteModel,
  paletteId,
  type,
) {
  // Universally find the palette (works for base or harmony palettes)
  const basePalette = findPaletteById(paletteModel, paletteId);
  if (!basePalette) return [];

  // Generate harmony colors based on type
  const harmonyColors = generateHarmony(basePalette.baseColor, type);
  if (!harmonyColors || !harmonyColors[type]) return [];

  // Wrap each harmony color into a palette object
  const harmonyPalettes = harmonyColors[type].map((color) => {
    const { tints, shades } = generateTintsShades(
      color,
      paletteModel.intensity,
    );

    return {
      paletteId: `${paletteId}-${type}-${color}`,
      baseColor: color,
      name: assignColorName(color),
      tints,
      shades,
      type,
      harmonies: {
        complementary: [],
        analogous: [],
        triadic: [],
      },
      harmoniesPalettes: {},
      favorited: false,
    };
  });

  // Store them inside the palette that triggered the harmony
  if (!basePalette.harmoniesPalettes) basePalette.harmoniesPalettes = {};
  basePalette.harmoniesPalettes[type] = harmonyPalettes;

  return harmonyPalettes;
};

// Add Harmony to palette
export const addHarmonyToPalette = function (id, type) {
  const palette = paletteModel.palettes.find((p) => p.paletteId === id);
  if (!palette) return;

  const harmonies = generateHarmony(palette.baseColor, type);
  palette.harmonies[type] = harmonies[type];
  return palette;
};

// Find palette by id
export const findPaletteById = function (paletteModel, paletteId) {
  // Look in generated palettes
  let palette = paletteModel.palettes.find((p) => p.paletteId === paletteId);
  if (palette) return palette;

  // Look in favorites
  palette = paletteModel.favorites.find((p) => p.paletteId === paletteId);
  if (palette) return palette;

  // Look inside harmonies of each palette
  for (const basePalette of paletteModel.palettes) {
    if (basePalette.harmoniesPalettes) {
      const allHarmonies = Object.values(basePalette.harmoniesPalettes).flat();
      const found = allHarmonies.find((p) => p.paletteId === paletteId);
      if (found) return found;
    }
  }
  // If nothing found
  return null;
};

// Save the entire paletteModel to localStorage
export const persistPaletteModel = function () {
  try {
    localStorage.setItem(
      "paletteModel",
      JSON.stringify({ version: 1, data: paletteModel }),
    );
    console.log("Palette model persisted sucessfully");
  } catch (err) {
    console.error("Failed to persist paletteModel", err);
  }
};

// Load the paletteModel from localStorage
export const loadPaletteModel = function () {
  const data = localStorage.getItem("paletteModel");
  if (!data) return null;

  try {
    const parsed = JSON.parse(data);

    // Check version before returning
    if (parsed.version === 1 && parsed.data) {
      console.log("Pallete model loaded successfully");
      return parsed.data;
    }

    // Future-proof: handle other versions gracefully
    console.warn("Unknown paletteModel version:", parsed.version);
    return parsed.data || null;
  } catch (err) {
    console.error("Failed to parse paletteModel from localStorage", err);
    return null;
  }
};

// localStorage.clear();
