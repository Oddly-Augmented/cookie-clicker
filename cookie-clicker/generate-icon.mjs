import { Jimp } from 'jimp';

async function generatePerfectIcon() {
  // Load the transparent cookie
  const cookie = await Jimp.read('public/farcaster-cookie.png');
  
  // Resize cookie to fit nicely inside the icon (e.g. 80% size)
  // Let's create a 512x512 background
  const size = 512;
  const bg = new Jimp({ width: size, height: size, color: '#080418ff' });
  
  cookie.resize({ w: size * 0.8, h: size * 0.8 });
  
  // Composite the cookie onto the center of the dark background
  bg.composite(cookie, (size - cookie.bitmap.width) / 2, (size - cookie.bitmap.height) / 2);
  
  await bg.write('public/icon.png');
  await bg.write('public/splash.png');
  console.log('Successfully generated flawless icon and splash images!');
}

generatePerfectIcon();
