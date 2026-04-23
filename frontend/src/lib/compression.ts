/**
 * Compresses an image file by 50% to 80% without significant loss of clarity.
 * Uses HTML5 Canvas for client-side processing.
 */
export async function compressImage(file: File, quality: number = 0.6): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Adjust dimensions if needed, but keeping original for "clarity"
                canvas.width = img.width;
                canvas.height = img.height;
                
                ctx?.drawImage(img, 0, 0);
                
                canvas.toBlob(
                    (blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error('Canvas compression failed'));
                    },
                    'image/jpeg',
                    quality // Compress to the requested quality (0.5 to 0.8)
                );
            };
        };
        reader.onerror = (error) => reject(error);
    });
}

/**
 * Mock compression for video/audio (normally handled server-side or via WASM)
 * In this demo, we simulate a delay for "compression"
 */
export async function simulateMediaCompression(file: File): Promise<File> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(file); // Return as-is for mock, simulates processing
        }, 1500);
    });
}
