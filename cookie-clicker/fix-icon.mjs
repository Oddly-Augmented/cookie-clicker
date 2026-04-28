import { Jimp, rgbaToInt, intToRGBA } from 'jimp';

async function fixCorners(path) {
  console.log('Processing', path);
  const image = await Jimp.read(path);
  const w = image.bitmap.width;
  const h = image.bitmap.height;

  // We want to replace white-ish pixels connected to the corners with #080418
  // Or just transparent!
  const targetColor = rgbaToInt(8, 4, 24, 255); // #080418 = 8, 4, 24
  
  // Flood fill queue
  const queue = [];
  const visited = new Uint8Array(w * h);

  function push(x, y) {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    if (visited[y * w + x]) return;
    
    const color = intToRGBA(image.getPixelColor(x, y));
    // If it's whitish (r > 240, g > 240, b > 240)
    if (color.r > 240 && color.g > 240 && color.b > 240) {
      queue.push({x, y});
      visited[y * w + x] = 1;
    }
  }

  // Start from 4 corners
  push(0, 0);
  push(w - 1, 0);
  push(0, h - 1);
  push(w - 1, h - 1);

  while (queue.length > 0) {
    const {x, y} = queue.shift();
    image.setPixelColor(targetColor, x, y);

    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  await image.write(path);
  console.log('Done', path);
}

async function run() {
  await fixCorners('public/icon.png');
  await fixCorners('public/splash.png');
}

run();
