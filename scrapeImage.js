const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function scrapeAndDownloadImage(imageUrl, id, dir) {
  /* console.log(`Image URL found: ${imageUrl}`);
  console.log(`Id: ${id}`);
  console.log(`dir: ${dir}`);
 */
  const imagePath = path.resolve(__dirname, 'world', 'pics', dir);
  const imageName = `${id}.jpg`;
  const imageFullPath = path.join(imagePath, imageName);

  // Check if the image already exists
  if (fs.existsSync(imageFullPath)) {
    console.log(`Image already exists: ${imageFullPath}`);
    return imageFullPath;
  }

  // Create directory if it doesn't exist
  if (!fs.existsSync(imagePath)) {
    fs.mkdirSync(imagePath, { recursive: true });
  }

  // Download the image
  try {
    const response = await axios({
      url: imageUrl,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(imageFullPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    console.log(`Image downloaded and saved as ${imageFullPath}`);
    return imageFullPath;
  } catch (error) {
    console.error(`Failed to download image from ${imageUrl}:`, error.message);
    throw error;
  }
}

module.exports = scrapeAndDownloadImage;
