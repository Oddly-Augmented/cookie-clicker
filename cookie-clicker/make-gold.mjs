import * as jimpPkg from 'jimp';
const Jimp = jimpPkg.default || jimpPkg;

async function run() {
  try {
    const image = await Jimp.read('public/farcaster-cookie.png');
    
    // Custom golden pixel filter
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      const alpha = this.bitmap.data[idx + 3];

      if (alpha === 0) return; // skip transparent

      // Calculate relative luminance (0 to 1)
      const L = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
      
      let outR, outG, outB;
      // Gold gradient map:
      // Dark (L=0): rgb(60, 40, 0)
      // Mid (L=0.5): rgb(218, 165, 32)
      // High (L=1): rgb(255, 245, 180)
      if (L < 0.5) {
        let t = L / 0.5; // 0 to 1
        outR = 60 + (218 - 60) * t;
        outG = 40 + (165 - 40) * t;
        outB = 0 + (32 - 0) * t;
      } else {
        let t = (L - 0.5) / 0.5; // 0 to 1
        outR = 218 + (255 - 218) * t;
        outG = 165 + (245 - 165) * t;
        outB = 32 + (180 - 32) * t;
      }

      this.bitmap.data[idx + 0] = Math.min(255, outR);
      this.bitmap.data[idx + 1] = Math.min(255, outG);
      this.bitmap.data[idx + 2] = Math.min(255, outB);
    });

    await image.writeAsync('public/golden-cookie.png');
    console.log('Golden cookie created!');
  } catch (err) {
    console.error(err);
  }
}
run();
