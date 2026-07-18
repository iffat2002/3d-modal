export default class ImageAsciiRenderer {
  constructor(container, options) {
    this.container = container;

    this.src = options.src;
    this.width = options.width || 300;

    // Lower = higher quality
    this.quality = options.quality || 5;

    this.threshold = options.threshold || 20;

    this.fps = options.fps || 20;

    this.invert = options.invert || false;

    this.characters =
      options.characters ||
      "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ";

    this.frame = 0;

    this.lastFrame = 0;

    this.running = true;

    this.brightnessMap = [];

    // Hidden canvas
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d", {
      willReadFrequently: true,
    });

    // ASCII output
    this.pre = document.createElement("pre");

    Object.assign(this.pre.style, {
      margin: 0,
      padding: 0,
      color: "#fff",
      background: "#000",
      fontFamily: "monospace",
      fontSize: `${this.quality * 2}px`,
      lineHeight: `${this.quality * 2}px`,
      letterSpacing: "0",
      whiteSpace: "pre",
      userSelect: "none",
      overflow: "hidden",
      display: "inline-block",
    });

    this.container.appendChild(this.pre);

    this.image = new Image();

    this.image.crossOrigin = "anonymous";

    this.image.onload = () => {
      this.prepareImage();
    };

    this.image.src = this.src;

    this.animate = this.animate.bind(this);
  }

  prepareImage() {
    const ratio =
      this.image.height / this.image.width;

    this.canvas.width = this.width;

    this.canvas.height = Math.floor(
      this.width * ratio
    );

    this.ctx.clearRect(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );

    this.ctx.drawImage(
      this.image,
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );

    this.imageData = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );

    // Next part
    this.buildBrightnessMap();

    requestAnimationFrame(this.animate);
  }

  animate(time) {
    if (!this.running) return;

    requestAnimationFrame(this.animate);

    if (time - this.lastFrame < 1000 / this.fps)
      return;

    this.lastFrame = time;

    this.frame++;

    const ascii = this.renderAscii();

    this.pre.textContent = ascii;
  }
  getBrightness(r, g, b) {
  // Perceived luminance
  return (
    0.2126 * r +
    0.7152 * g +
    0.0722 * b
  );
}

buildBrightnessMap() {
  this.brightnessMap = [];

  const { data, width, height } =
    this.imageData;

  const cellWidth = this.quality;
  const cellHeight = this.quality * 2;

  for (
    let y = 0;
    y < height;
    y += cellHeight
  ) {
    const row = [];

    for (
      let x = 0;
      x < width;
      x += cellWidth
    ) {
      let total = 0;
      let count = 0;

      // Average every pixel inside the block
      for (
        let yy = 0;
        yy < cellHeight;
        yy++
      ) {
        for (
          let xx = 0;
          xx < cellWidth;
          xx++
        ) {
          const px = x + xx;
          const py = y + yy;

          if (
            px >= width ||
            py >= height
          ) {
            continue;
          }

          const index =
            (py * width + px) * 4;

          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];

          total += this.getBrightness(
            r,
            g,
            b
          );

          count++;
        }
      }

      let brightness =
        count > 0 ? total / count : 0;

      // Contrast boost
      brightness =
        (brightness - 128) * 1.2 + 128;

      // Clamp
      brightness = Math.max(
        0,
        Math.min(255, brightness)
      );

      row.push(brightness);
    }

    this.brightnessMap.push(row);
  }
}


getCharacter(brightness, x, y) {
  // Background stays empty
  if (brightness < this.threshold) {
    return " ";
  }

  let normalized = brightness / 255;

  if (this.invert) {
    normalized = 1 - normalized;
  }

  let index = Math.floor(
    normalized * (this.characters.length - 1)
  );

  // -------- Shimmer animation --------
  // Every cell gets its own phase
  const wave =
    Math.sin(
      this.frame * 0.15 +
      x * 0.4 +
      y * 0.35
    );

  if (wave > 0.6) {
    index++;
  } else if (wave < -0.6) {
    index--;
  }

  index = Math.max(
    0,
    Math.min(
      this.characters.length - 1,
      index
    )
  );

  return this.characters[index];
}

renderAscii() {
  let ascii = "";

  for (
    let y = 0;
    y < this.brightnessMap.length;
    y++
  ) {
    const row = this.brightnessMap[y];

    for (
      let x = 0;
      x < row.length;
      x++
    ) {
      ascii += this.getCharacter(
        row[x],
        x,
        y
      );
    }

    ascii += "\n";
  }

  return ascii;
}

destroy() {
  this.running = false;

  if (
    this.pre &&
    this.pre.parentNode
  ) {
    this.pre.parentNode.removeChild(
      this.pre
    );
  }

  this.image = null;
  this.imageData = null;
  this.brightnessMap = [];
}
}