// scripts/extractManga.ts
import StreamZip from "node-stream-zip";
import path from "path";
import fs from "fs";

const extractCbz = async (cbzFilePath: string, outputDir: string) => {
  const zip = new StreamZip.async({ file: cbzFilePath });

  const entries = await zip.entries();
  for (const entry of Object.values(entries)) {
    const entryName = entry.name;
    if (!entry.isDirectory && /\.(png|jpg|jpeg|gif)$/.test(entryName)) {
      const outputFilePath = path.join(outputDir, entryName);
      const outputDirPath = path.dirname(outputFilePath);

      // Ensure the directory exists
      if (!fs.existsSync(outputDirPath)) {
        fs.mkdirSync(outputDirPath, { recursive: true });
      }

      // Extract the image
      const data = await zip.stream(entryName);
      const writeStream = fs.createWriteStream(outputFilePath);
      data.pipe(writeStream);
    }
  }

  await zip.close();
};

// Example usage:
const cbzFilePath = path.join(process.cwd(), "../manga", "test.cbz");
const outputDir = path.join(process.cwd(), "public", "manga_images");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

extractCbz(cbzFilePath, outputDir)
  .then(() => console.log("Manga images extracted!"))
  .catch((err) => console.error("Error extracting manga:", err));
