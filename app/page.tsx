"use client";
import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import JSZip from "jszip";

// Define the structure of our extracted file objects
interface ExtractedFile {
  name: string;
  content: Blob;
  url: string;
}
// Define our main component
const ShowCbz: React.FC = () => {
  // State variables to store our data and UI state
  const [extractedFiles, setExtractedFiles] = useState<ExtractedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Function to handle file selection
  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        setError("No file selected");
        return;
      }

      try {
        // Read the file as an ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const zip = new JSZip();
        // Load the zip file contents
        const contents = await zip.loadAsync(arrayBuffer);

        const files: ExtractedFile[] = [];
        // Iterate through the zip contents
        for (const [filename, zipEntry] of Object.entries(contents.files)) {
          // Check if it's an image file
          if (!zipEntry.dir && filename.match(/\.(jpe?g|png|gif|webp)$/i)) {
            // Extract the file content as a Blob
            const content = await zipEntry.async("blob");
            // Create a URL for the Blob
            const url = URL.createObjectURL(content);
            files.push({ name: filename, content, url });
          }
        }

        // Sort files by name
        files.sort((a, b) => a.name.localeCompare(b.name));

        // Update state with extracted files
        setExtractedFiles(files);
        setError(null);
      } catch (err) {
        console.error("Error extracting CBZ:", err);
        setError("Failed to extract CBZ file");
      }
    },
    [],
  );

  // Cleanup function to revoke object URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      extractedFiles.forEach((file) => URL.revokeObjectURL(file.url));
    };
  }, [extractedFiles]);

  // Function to toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Render our component
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header section */}
      <div style={{ padding: "1rem", textAlign: "center" }}>
        <h1>Manga Reader</h1>
        <input type="file" accept=".cbz" onChange={handleFileChange} />
        <button onClick={toggleFullscreen} style={{ marginLeft: "1rem" }}>
          {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        </button>
      </div>
      {/* Error display */}
      {error && (
        <div style={{ color: "red", padding: "1rem", textAlign: "center" }}>
          Error: {error}
        </div>
      )}
      {/* Main content area */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Map through extracted files and display each image */}
        {extractedFiles.map((file, index) => (
          <div
            key={index}
            style={{ marginBottom: "1rem", width: "95%", maxWidth: "1000px" }}
          >
            <Image
              src={file.url}
              alt={file.name}
              width={1000}
              height={1500}
              style={{ width: "100%", height: "auto", objectFit: "contain" }}
            />
            <div style={{ marginTop: "0.5rem", textAlign: "center" }}>
              Page {index + 1} of {extractedFiles.length}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShowCbz;
