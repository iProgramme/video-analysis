import { VideoFrame } from '../types';

/**
 * Extracts frames from a video file at regular intervals.
 * @param videoFile The video file to process
 * @param maxFrames Maximum number of frames to extract.
 * @param onProgress Callback for progress updates (0-100)
 */
export const extractFramesFromVideo = async (
  videoFile: File,
  maxFrames: number = 60, // Increased default from 20 to 60
  onProgress?: (progress: number) => void
): Promise<VideoFrame[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    const frames: VideoFrame[] = [];
    const url = URL.createObjectURL(videoFile);
    
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    // Wait for metadata to load to know duration and dimensions
    video.onloadedmetadata = async () => {
      const duration = video.duration;
      
      // Dynamic logic: Try to get 1 frame every 2 seconds, but clamp between 20 and maxFrames.
      // This ensures short videos get enough frames, and long videos utilize the max capacity.
      let targetFrameCount = Math.floor(duration / 2); 
      if (targetFrameCount < 20) targetFrameCount = 20;
      if (targetFrameCount > maxFrames) targetFrameCount = maxFrames;

      const interval = duration / targetFrameCount;
      
      canvas.width = 480; // Limit resolution for API payload efficiency
      const scale = 480 / video.videoWidth;
      canvas.height = video.videoHeight * scale;

      let currentTime = 0;
      let processedCount = 0;

      const seekResolve = () => {
        return new Promise<void>((res) => {
          const onSeeked = () => {
            video.removeEventListener('seeked', onSeeked);
            res();
          };
          video.addEventListener('seeked', onSeeked);
          video.currentTime = currentTime;
        });
      };

      try {
        while (currentTime < duration && processedCount < targetFrameCount) {
          await seekResolve();
          
          // Draw frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // Low quality JPEG to save space
          
          frames.push({
            timestamp: currentTime,
            dataUrl: dataUrl.split(',')[1] // Remove prefix for API
          });

          processedCount++;
          currentTime += interval;
          
          if (onProgress) {
            onProgress(Math.round((processedCount / targetFrameCount) * 100));
          }
        }
        
        URL.revokeObjectURL(url);
        resolve(frames);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    video.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error("Error loading video"));
    };
  });
};