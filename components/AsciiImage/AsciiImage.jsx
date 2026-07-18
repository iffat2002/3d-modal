"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./AsciiImage.module.scss";

const CHARACTER_PRESETS = {
  detailed: "01",
  classic: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
  blocks: "MWN0o-. ",
  binary: "10 ",
  minimal: "#. ",
};

const DEFAULT_IMAGE = "/saim.svg";
const BAYER_MATRIX = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getLuminance(red, green, blue) {
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function getNoiseIndex(x, y, length) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;

  return Math.abs(Math.floor(value)) % length;
}

function getLuminanceAt(luminanceMap, width, height, x, y) {
  const safeX = clamp(x, 0, width - 1);
  const safeY = clamp(y, 0, height - 1);

  return luminanceMap[safeY * width + safeX];
}

function getPercentile(values, percentile) {
  if (!values.length) return 0;

  const sortedValues = [...values].sort((a, b) => a - b);
  const index = clamp(Math.round((sortedValues.length - 1) * percentile), 0, sortedValues.length - 1);

  return sortedValues[index];
}

function getBayerThreshold(x, y) {
  return (BAYER_MATRIX[y % 8][x % 8] + 0.5) / 64;
}

function getToneShade(tone) {
  if (tone > 0.86) return 246;
  if (tone > 0.68) return 214;
  if (tone > 0.5) return 156;
  if (tone > 0.32) return 86;
  return 36;
}

function createNormalizedLuminanceMap(data, width, height) {
  const raw = new Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3] / 255;
      const red = data[index] * alpha + 255 * (1 - alpha);
      const green = data[index + 1] * alpha + 255 * (1 - alpha);
      const blue = data[index + 2] * alpha + 255 * (1 - alpha);

      raw[y * width + x] = getLuminance(red, green, blue);
    }
  }

  const low = getPercentile(raw, 0.02);
  const high = Math.max(low + 1, getPercentile(raw, 0.985));
  const normalized = new Array(raw.length);

  for (let index = 0; index < raw.length; index += 1) {
    const leveled = clamp((raw[index] - low) / (high - low), 0, 1);
    const contrasted = clamp((leveled - 0.5) * 1.16 + 0.5, 0, 1);
    const gammaAdjusted = Math.pow(contrasted, 0.88);

    normalized[index] = gammaAdjusted;
  }

  return normalized;
}

function blurLuminanceMap(luminanceMap, width, height) {
  const blurred = new Array(luminanceMap.length);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const center = getLuminanceAt(luminanceMap, width, height, x, y) * 4;
      const cardinal = (
        getLuminanceAt(luminanceMap, width, height, x - 1, y) +
        getLuminanceAt(luminanceMap, width, height, x + 1, y) +
        getLuminanceAt(luminanceMap, width, height, x, y - 1) +
        getLuminanceAt(luminanceMap, width, height, x, y + 1)
      ) * 2;
      const diagonal =
        getLuminanceAt(luminanceMap, width, height, x - 1, y - 1) +
        getLuminanceAt(luminanceMap, width, height, x + 1, y - 1) +
        getLuminanceAt(luminanceMap, width, height, x - 1, y + 1) +
        getLuminanceAt(luminanceMap, width, height, x + 1, y + 1);

      blurred[y * width + x] = (center + cardinal + diagonal) / 16;
    }
  }

  return blurred;
}

function sampleCell(luminanceMap, width, height, startX, startY, cellWidth, cellHeight) {
  const endX = Math.min(width, startX + cellWidth);
  const endY = Math.min(height, startY + cellHeight);
  let total = 0;
  let min = 1;
  let max = 0;
  let count = 0;

  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const luminance = luminanceMap[y * width + x];

      total += luminance;
      min = Math.min(min, luminance);
      max = Math.max(max, luminance);
      count += 1;
    }
  }

  if (!count) {
    return { average: 1, contrast: 0 };
  }

  return {
    average: total / count,
    contrast: max - min,
  };
}

function createAsciiRows(image, outputWidth, characters) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context || !image.naturalWidth || !image.naturalHeight) {
    return [];
  }

  const aspectRatio = image.naturalHeight / image.naturalWidth;
  const characterAspect = 0.48;
  const outputHeight = Math.max(1, Math.round(outputWidth * aspectRatio * characterAspect));
  const sampleScale = 3;
  const sampleWidth = outputWidth * sampleScale;
  const sampleHeight = outputHeight * sampleScale;

  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, sampleWidth, sampleHeight);

  const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight);
  const drawingCharacters = (characters.replace(/\s/g, "") || CHARACTER_PRESETS.detailed).replace(/\s/g, "");
  const luminanceMap = blurLuminanceMap(
    createNormalizedLuminanceMap(data, sampleWidth, sampleHeight),
    sampleWidth,
    sampleHeight
  );
  const rows = [];

  for (let y = 0; y < outputHeight; y += 1) {
    const row = [];

    for (let x = 0; x < outputWidth; x += 1) {
      const cell = sampleCell(
        luminanceMap,
        sampleWidth,
        sampleHeight,
        x * sampleScale,
        y * sampleScale,
        sampleScale,
        sampleScale
      );
      const foreground = clamp((1 - cell.average - 0.035) / 0.9, 0, 1);
      const detail = clamp(cell.contrast * 1.9, 0, 1);
      const highlightCompressed = foreground > 0.76
        ? 0.76 + (foreground - 0.76) * 0.34
        : foreground;
      const tone = clamp(Math.pow(highlightCompressed, 1.18) * 0.88 + detail * 0.2, 0, 1);
      const threshold = getBayerThreshold(x, y);
      const visible = tone > 0.075 && tone + 0.08 > threshold;
      const characterIndex = getNoiseIndex(x, y, drawingCharacters.length);

      row.push({
        character: visible ? drawingCharacters[characterIndex] : " ",
        shade: visible ? getToneShade(tone) : 0,
        opacity: visible ? 1 : 0,
      });
    }

    rows.push(row);
  }

  return rows;
}

export default function AsciiImage() {
  const objectUrlRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(DEFAULT_IMAGE);
  const [loadedImage, setLoadedImage] = useState(null);
  const [fileName, setFileName] = useState("saim.svg");
  const [width, setWidth] = useState(150);
  const [fontSize, setFontSize] = useState(9);
  const [preset, setPreset] = useState("detailed");
  const [customCharacters, setCustomCharacters] = useState(CHARACTER_PRESETS.detailed);
  const [useGrayscale, setUseGrayscale] = useState(true);
  const [rows, setRows] = useState([]);
  const [isReady, setIsReady] = useState(false);

  const characters = useMemo(() => {
    return preset === "custom" ? customCharacters : CHARACTER_PRESETS[preset];
  }, [customCharacters, preset]);

  useEffect(() => {
    const image = new Image();

    image.crossOrigin = "anonymous";
    image.onload = () => {
      setLoadedImage(image);
    };
    image.src = imageSrc;

    return () => {
      image.onload = null;
    };
  }, [imageSrc]);

  useEffect(() => {
    if (!loadedImage) return;

    setRows(createAsciiRows(loadedImage, width, characters));
    setIsReady(true);
  }, [characters, loadedImage, width]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  function handleUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setIsReady(false);
    setLoadedImage(null);
    setRows([]);
    setFileName(file.name);
    setImageSrc(objectUrl);
  }

  return (
    <section className={styles.shell}>
      <div className={styles.controls}>
        <div className={styles.header}>
          <p className={styles.kicker}>Image to ASCII</p>
          <h1>Convert an uploaded image into text characters</h1>
        </div>

        <label className={styles.uploadBox}>
          <input type="file" accept="image/*" onChange={handleUpload} />
          <span>Choose image</span>
          <strong>{fileName}</strong>
        </label>

        <label className={styles.field}>
          <span>Characters</span>
          <select
            value={preset}
            onChange={(event) => {
              const nextPreset = event.target.value;
              setPreset(nextPreset);

              if (nextPreset !== "custom") {
                setCustomCharacters(CHARACTER_PRESETS[nextPreset]);
              }
            }}
          >
            <option value="detailed">Detailed</option>
            <option value="classic">Classic</option>
            <option value="blocks">Blocks</option>
            <option value="binary">Binary</option>
            <option value="minimal">Minimal</option>
            <option value="custom">Custom</option>
          </select>
        </label>

        <label className={styles.field}>
          <span>Character set</span>
          <input
            type="text"
            value={customCharacters}
            onChange={(event) => {
              setPreset("custom");
              setCustomCharacters(event.target.value);
            }}
          />
        </label>

        <label className={styles.field}>
          <span>Width: {width} chars</span>
          <input
            type="range"
            min="40"
            max="220"
            value={width}
            onChange={(event) => setWidth(Number(event.target.value))}
          />
        </label>

        <label className={styles.field}>
          <span>Font size: {fontSize}px</span>
          <input
            type="range"
            min="5"
            max="16"
            value={fontSize}
            onChange={(event) => setFontSize(Number(event.target.value))}
          />
        </label>

        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={useGrayscale}
            onChange={(event) => setUseGrayscale(event.target.checked)}
          />
          <span>Use grayscale</span>
        </label>
      </div>

      <div className={styles.previewPanel}>
        <div className={styles.previewMeta}>
          <span>{isReady ? `${rows.length} rows` : "Converting"}</span>
          <span>{width} columns</span>
        </div>

        <pre
          className={styles.asciiOutput}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: `${fontSize}px`,
          }}
          aria-label="ASCII image preview"
        >
          {rows.map((row, rowIndex) => (
            <span className={styles.asciiRow} key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <span
                  key={cellIndex}
                  style={
                    useGrayscale
                      ? {
                          color: `rgb(${cell.shade}, ${cell.shade}, ${cell.shade})`,
                        }
                      : { opacity: cell.opacity }
                  }
               >
                  {cell.character}
                </span>
              ))}
              {"\n"}
            </span>
          ))}
        </pre>
      </div>
    </section>
  );
}
