"use client";
import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import JSZip from "jszip";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";

interface ExtractedFile {
  name: string;
  content: Blob;
  url: string;
}

interface CbzFile {
  file: File;
  name: string;
}

const ShowCbz: React.FC = () => {
  const [extractedFiles, setExtractedFiles] = useState<ExtractedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cbzFiles, setCbzFiles] = useState<CbzFile[]>([]);
  const [currentCbzIndex, setCurrentCbzIndex] = useState<number>(-1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const processNewCbz = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = new JSZip();
      const contents = await zip.loadAsync(arrayBuffer);

      const files: ExtractedFile[] = [];
      for (const [filename, zipEntry] of Object.entries(contents.files)) {
        if (!zipEntry.dir && filename.match(/\.(jpe?g|png|gif|webp)$/i)) {
          const content = await zipEntry.async("blob");
          const url = URL.createObjectURL(content);
          files.push({ name: filename, content, url });
        }
      }

      files.sort((a, b) => a.name.localeCompare(b.name));
      setExtractedFiles(files);
      setError(null);
    } catch (err) {
      console.error("Error extracting CBZ:", err);
      setError("Failed to extract CBZ file");
    }
  };

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        setError("No file selected");
        return;
      }

      setCbzFiles([{ file, name: file.name }]);
      setCurrentCbzIndex(0);
      await processNewCbz(file);
    },
    []
  );

  const handleFolderSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) {
        setError("No folder selected");
        return;
      }

      const cbzFiles: CbzFile[] = Array.from(files)
        .filter(file => file.name.toLowerCase().endsWith('.cbz'))
        .map(file => ({ file, name: file.name }));

      if (cbzFiles.length === 0) {
        setError("No CBZ files found in the selected folder");
        return;
      }

      cbzFiles.sort((a, b) => {
        const extractNumber = (name: string) => {
          const match = name.match(/(\d+)/);
          return match ? parseInt(match[0], 10) : 0;
        };
        return extractNumber(a.name) - extractNumber(b.name);
      });
      setCbzFiles(cbzFiles);
      setCurrentCbzIndex(0);
      await processNewCbz(cbzFiles[0].file);
    },
    []
  );

  const handleFileSelect = async (index: number) => {
    if (index !== currentCbzIndex) {
      extractedFiles.forEach(file => URL.revokeObjectURL(file.url));
      setExtractedFiles([]);
      setCurrentCbzIndex(index);
      await processNewCbz(cbzFiles[index].file);
      window.scrollTo(0, 0);
    }
  };

  const handleNextCbz = async () => {
    if (currentCbzIndex < cbzFiles.length - 1) {
      await handleFileSelect(currentCbzIndex + 1);
    }
  };

  useEffect(() => {
    return () => {
      extractedFiles.forEach((file) => URL.revokeObjectURL(file.url));
    };
  }, [extractedFiles]);

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

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
<div className={`relative ${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out`}>
  <div className={`fixed top-0 left-0 h-full bg-gray-800 border-r border-gray-700 transition-all duration-300 ease-in-out overflow-hidden ${isSidebarOpen ? 'w-64' : 'w-0'}`}>
    <div className="p-4">
      {/* Scrollable container for files */}
      <br/>
      <br/>
      <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
        {cbzFiles.map((file, index) => (
          <button
            key={index}
            onClick={() => handleFileSelect(index)}
            className={`w-full text-left px-3 py-2 rounded text-sm truncate transition-colors ${
              index === currentCbzIndex 
                ? 'bg-blue-900 text-blue-100' 
                : 'text-gray-300 hover:bg-gray-700'
            }`}
            title={file.name}
          >
            {file.name}
          </button>
        ))}
      </div>
    </div>
  </div>
</div>

      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-10 p-2 bg-gray-800 text-gray-100 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
      >
        {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
      </button>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header section */}
        <div className="p-4 text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-100">Manga Reader</h1>
          <div className="space-y-4">
            <div className="space-x-4">
              <input
                type="file"
                accept=".cbz"
                onChange={handleFileChange}
                className="inline-block text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-gray-800 file:text-gray-100 hover:file:bg-gray-700"
              />
              <button
                onClick={toggleFullscreen}
                className="px-4 py-2 bg-blue-600 text-gray-100 rounded hover:bg-blue-700 transition-colors"
              >
                {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              </button>
            </div>
            <div className="flex justify-center items-center space-x-2">
              <input
                type="file"
                webkitdirectory="true"
                directory=""
                onChange={handleFolderSelect}
                className="inline-block text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-gray-800 file:text-gray-100 hover:file:bg-gray-700"
              />
              <span className="text-sm text-gray-400">
                Or select a folder with CBZ files
              </span>
            </div>
          </div>
          {currentCbzIndex >= 0 && (
            <div className="mt-4 text-sm text-gray-400">
              Reading: {cbzFiles[currentCbzIndex]?.name} ({currentCbzIndex + 1} of {cbzFiles.length})
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="text-red-400 p-4 text-center">
            Error: {error}
          </div>
        )}

        {/* Images content area */}
        <div className="p-4">
          <div className="max-w-4xl mx-auto">
            {extractedFiles.map((file, index) => (
              <div key={index} className="mb-8 flex flex-col items-center">
                <div className="relative w-full">
                  <Image
                    src={file.url}
                    alt={file.name}
                    width={1000}
                    height={1500}
                    className="w-full h-auto object-contain mx-auto"
                    priority
                  />
                </div>
                <div className="mt-2 text-center text-gray-400">
                  Page {index + 1} of {extractedFiles.length}
                </div>
              </div>
            ))}

            {/* Navigation section */}
            {currentCbzIndex < cbzFiles.length - 1 && extractedFiles.length > 0 && (
              <div className="mt-8 mb-16 p-4 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
                <div className="flex flex-col items-center space-y-4">
                  <span className="text-gray-300">
                    Finished {cbzFiles[currentCbzIndex]?.name}
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-400">
                      Next: {cbzFiles[currentCbzIndex + 1]?.name}
                    </span>
                    <button
                      onClick={handleNextCbz}
                      className="px-6 py-2 bg-blue-600 text-gray-100 rounded hover:bg-blue-700 transition-colors"
                    >
                      Next CBZ →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowCbz; 