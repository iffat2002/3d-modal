"use client";

import { useEffect } from "react";

const GLYPHS = "01O%?-";

function getNoise(value) {
  const result = Math.sin(value * 12.9898) * 43758.5453;
  return result - Math.floor(result);
}

function mutateText(text, tick, nodeIndex) {
  let nextText = "";

  for (let index = 0; index < text.length; index++) {
    const character = text[index];

    // Keep spaces and line breaks unchanged
    if (
      character === " " ||
      character === "\n" ||
      getNoise(index + nodeIndex * 97 + tick * 13) > 0.08
    ) {
      nextText += character;
      continue;
    }

    const glyphIndex = Math.floor(
      getNoise(index * 3 + nodeIndex + tick) * GLYPHS.length
    );

    nextText += GLYPHS[glyphIndex];
  }

  return nextText;
}

export default function ReferenceAsciiAnimation() {
  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    if (mediaQuery.matches) return;

    const container = document.getElementById("tiresult");

    if (!container) return;

    const textNodes = Array.from(container.querySelectorAll("b"))
      .map((element) => element.firstChild)
      .filter(
        (node) =>
          node &&
          node.nodeType === Node.TEXT_NODE &&
          node.nodeValue.trim()
      );

    const originalTexts = textNodes.map(
      (node) => node.nodeValue || ""
    );

    let tick = 0;

    const interval = setInterval(() => {
      tick++;

      textNodes.forEach((node, index) => {
        node.nodeValue = mutateText(
          originalTexts[index],
          tick,
          index
        );
      });
    }, 120);

    return () => {
      clearInterval(interval);

      textNodes.forEach((node, index) => {
        node.nodeValue = originalTexts[index];
      });
    };
  }, []);

  return null;
}