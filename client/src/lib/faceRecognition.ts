import * as faceapi from '@vladmandic/face-api';

let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

/**
 * Load face-api.js models from CDN
 * Models are loaded once and cached
 */
export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;
  
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
      
      console.log('[Face-API] Starting model load from:', MODEL_URL);
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      
      modelsLoaded = true;
      console.log('[Face-API] All models loaded successfully');
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('[Face-API] Error loading models:', error);
      loadingPromise = null;
      throw new Error('Failed to load face recognition models');
    }
  })();

  return loadingPromise;
}

/**
 * Detect face and extract descriptor from image
 * @param imageElement - HTML Image or Canvas element
 * @returns Face descriptor (128-dimensional array) or null if no face detected
 */
export async function extractFaceDescriptor(imageElement: HTMLImageElement | HTMLCanvasElement): Promise<Float32Array | null> {
  await loadModels();

  try {
    console.log('[Face-API] Attempting face detection...');
    
    // Use TinyFaceDetector with very aggressive options
    const detectionOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 416,
      scoreThreshold: 0.3,
    });

    // Try to detect ALL faces
    const detections = await faceapi
      .detectAllFaces(imageElement, detectionOptions)
      .withFaceLandmarks()
      .withFaceDescriptors();

    console.log(`[Face-API] Detection result: ${detections?.length || 0} face(s) found`);

    if (!detections || detections.length === 0) {
      console.log('[Face-API] No faces found, retrying with lower threshold...');
      const fallbackOptions = new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.1,
      });
      
      const fallbackDetections = await faceapi
        .detectAllFaces(imageElement, fallbackOptions)
        .withFaceLandmarks()
        .withFaceDescriptors();
      
      console.log(`[Face-API] Fallback result: ${fallbackDetections?.length || 0} face(s) found`);
      
      if (!fallbackDetections || fallbackDetections.length === 0) {
        throw new Error('Aucun visage détecté dans l\'image');
      }
      
      return fallbackDetections[0].descriptor;
    }

    return detections[0].descriptor;
  } catch (error) {
    console.error('[Face-API] Error extracting descriptor:', error);
    throw error;
  }
}

/**
 * Extract face descriptor from base64 image data
 * @param imageData - Base64 encoded image
 * @returns Face descriptor or null
 */
export async function extractDescriptorFromBase64(imageData: string): Promise<Float32Array | null> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = async () => {
      try {
        console.log(`[Face-API] Image loaded: ${img.width}x${img.height}px`);
        const descriptor = await extractFaceDescriptor(img);
        console.log('[Face-API] Descriptor extracted successfully');
        resolve(descriptor);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      console.error('[Face-API] Image load failed');
      reject(new Error('Erreur lors du chargement de l\'image'));
    };
    
    img.onabort = () => {
      console.error('[Face-API] Image load aborted');
      reject(new Error('Chargement de l\'image annul\u00e9'));
    };
    
    console.log('[Face-API] Starting image load from base64...');
    img.src = imageData;
  });
}

/**
 * Calculate Euclidean distance between two face descriptors
 * @param descriptor1 - First face descriptor
 * @param descriptor2 - Second face descriptor
 * @returns Distance (lower = more similar, typically < 0.6 indicates same person)
 */
export function calculateDistance(descriptor1: Float32Array, descriptor2: Float32Array): number {
  if (descriptor1.length !== descriptor2.length) {
    throw new Error('Descriptors must have the same length');
  }

  return faceapi.euclideanDistance(descriptor1, descriptor2);
}

/**
 * Check if two face descriptors match
 * @param descriptor1 - First face descriptor
 * @param descriptor2 - Second face descriptor
 * @param threshold - Distance threshold (default 0.6)
 * @returns true if faces match
 */
export function compareFaces(
  descriptor1: Float32Array,
  descriptor2: Float32Array,
  threshold: number = 0.6
): boolean {
  const distance = calculateDistance(descriptor1, descriptor2);
  console.log(`[Face-API] Face comparison distance: ${distance.toFixed(3)} (threshold: ${threshold})`);
  return distance < threshold;
}

/**
 * Convert Float32Array descriptor to regular array for storage
 */
export function descriptorToArray(descriptor: Float32Array): number[] {
  return Array.from(descriptor);
}

/**
 * Convert regular array back to Float32Array descriptor
 */
export function arrayToDescriptor(array: number[]): Float32Array {
  return new Float32Array(array);
}
