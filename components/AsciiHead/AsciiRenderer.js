export default class AsciiRenderer {
  constructor(container) {
    this.container = container;

    // Dense character set (dark → light)
this.characters =
  "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ";

this.cellWidth = 4;
this.cellHeight = 8;

this.threshold = 20;

    this.cellSize = 6;

    this.pre = document.createElement("pre");

    Object.assign(this.pre.style, {
      position: "absolute",
      inset: "0",
      margin: "0",
      padding: "0",
      overflow: "hidden",
      background: "#000",
      color: "#fff",
      fontFamily: "monospace",
 fontSize: "8px",
lineHeight: "8px",
      letterSpacing: "0",
      pointerEvents: "none",
      userSelect: "none",
      whiteSpace: "pre",
      zIndex: "2",
    });

    container.appendChild(this.pre);
  }

  getBrightness(r, g, b) {
    return (
      0.2126 * r +
      0.7152 * g +
      0.0722 * b
    );
  }

// getCharacter(brightness) {
//     this.threshold = 25;
//   // Background stays empty
// if (brightness < this.threshold) {
//     return " ";
// }

getCharacter(brightness) {
  if (brightness < this.threshold) {
    return " ";
  }

  const normalized = brightness / 255;

  const index = Math.floor(
    (1 - normalized) *
      (this.characters.length - 1)
  );

  return this.characters[index];
}

 convert(pixelBuffer, width, height) {
  let ascii = "";

  for (
    let y = 0;
    y < height;
    y += this.cellHeight
  ) {
    for (
      let x = 0;
      x < width;
      x += this.cellWidth
    ) {
      let total = 0;
      let count = 0;

      // Average brightness inside this block
      for (
        let yy = 0;
        yy < this.cellHeight;
        yy++
      ) {
        for (
          let xx = 0;
          xx < this.cellWidth;
          xx++
        ) {
          const px = x + xx;
          const py = y + yy;

          if (
            px >= width ||
            py >= height
          )
            continue;

          const index =
            (py * width + px) * 4;

          const r = pixelBuffer[index];
          const g = pixelBuffer[index + 1];
          const b = pixelBuffer[index + 2];

          total += this.getBrightness(
            r,
            g,
            b
          );

          count++;
        }
      }

      const brightness =
        total / count;

      ascii += this.getCharacter(
        brightness
      );
    }

    ascii += "\n";
  }

  return ascii;
}

  render(text) {
    this.pre.textContent = text;
  }
}