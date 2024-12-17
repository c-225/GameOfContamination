export class WebcamProcessor {
  private readonly video: HTMLVideoElement;
  private readonly canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  constructor() {
    // Create video and canvas elements
    this.video = document.createElement("video");
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    // Hide the video and canvas elements (optional)
    this.video.style.display = "none";
    this.canvas.style.display = "none";

    document.body.appendChild(this.video);
    document.body.appendChild(this.canvas);
  }

  async startWebcam(): Promise<void> {
    try {
      this.video.srcObject = await navigator.mediaDevices.getUserMedia({video: true});
      await this.video.play();
    } catch (error) {
      console.error("Error accessing webcam:", error);
      throw new Error("Unable to access webcam.");
    }
  }

  async captureAndProcessImage(): Promise<number[][]> {
    // Set canvas size to 64x64
    this.canvas.width = 64;
    this.canvas.height = 64;

    // Draw the video frame on the canvas
    this.context.drawImage(this.video, 0, 0, 64, 64);

    // Get the image data
    const imageData = this.context.getImageData(0, 0, 64, 64);
    const data = imageData.data;

    // Process the image to create a binary matrix
    const binaryMatrix: number[][] = [];
    const threshold = 128; // Threshold for binary conversion

    for (let y = 0; y < 64; y++) {
      const row: number[] = [];
      for (let x = 0; x < 64; x++) {
        const index = (y * 64 + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];

        // Convert RGB to grayscale
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Convert grayscale to binary (0 or 1)
        row.push(gray < threshold ? 0 : 1);
      }
      binaryMatrix.push(row);
    }

    return binaryMatrix;
  }

  stopWebcam(): void {
    const stream = this.video.srcObject as MediaStream;
    stream?.getTracks().forEach((track) => track.stop());
    this.video.remove();
    this.canvas.remove();
  }
}
