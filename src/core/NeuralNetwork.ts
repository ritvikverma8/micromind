// src/core/NeuralNetwork.ts
// Feedforward neural network for Deep Q-Learning
// Architecture: Input → Hidden1 (ReLU) → Hidden2 (ReLU) → Output (Linear)

export class NeuralNetwork {
  private w1: number[][];   // input   → hidden1
  private b1: number[];
  private w2: number[][];   // hidden1 → hidden2
  private b2: number[];
  private w3: number[][];   // hidden2 → output
  private b3: number[];

  private inputSize: number;
  private h1Size: number;
  private h2Size: number;
  private outputSize: number;

  // Cache for backpropagation
  private lastInput: number[] = [];
  private lastH1Raw: number[] = [];
  private lastH1Act: number[] = [];
  private lastH2Raw: number[] = [];
  private lastH2Act: number[] = [];

  constructor(inputSize: number, h1Size: number, h2Size: number, outputSize: number) {
    this.inputSize = inputSize;
    this.h1Size = h1Size;
    this.h2Size = h2Size;
    this.outputSize = outputSize;

    // He initialization for ReLU layers
    this.w1 = this.initWeights(inputSize, h1Size);
    this.b1 = new Array(h1Size).fill(0);
    this.w2 = this.initWeights(h1Size, h2Size);
    this.b2 = new Array(h2Size).fill(0);
    this.w3 = this.initWeights(h2Size, outputSize);
    this.b3 = new Array(outputSize).fill(0);
  }

  private initWeights(fanIn: number, fanOut: number): number[][] {
    const scale = Math.sqrt(2 / fanIn);
    return Array.from({ length: fanIn }, () =>
      Array.from({ length: fanOut }, () => (Math.random() * 2 - 1) * scale)
    );
  }

  /** Forward pass: returns output Q-values */
  forward(input: number[]): number[] {
    this.lastInput = input;

    // Hidden layer 1: ReLU(W1^T · x + b1)
    this.lastH1Raw = new Array(this.h1Size).fill(0);
    for (let h = 0; h < this.h1Size; h++) {
      let sum = this.b1[h];
      for (let i = 0; i < this.inputSize; i++) {
        sum += input[i] * this.w1[i][h];
      }
      this.lastH1Raw[h] = sum;
    }
    this.lastH1Act = this.lastH1Raw.map(v => Math.max(0, v));

    // Hidden layer 2: ReLU(W2^T · h1 + b2)
    this.lastH2Raw = new Array(this.h2Size).fill(0);
    for (let h2 = 0; h2 < this.h2Size; h2++) {
      let sum = this.b2[h2];
      for (let h1 = 0; h1 < this.h1Size; h1++) {
        sum += this.lastH1Act[h1] * this.w2[h1][h2];
      }
      this.lastH2Raw[h2] = sum;
    }
    this.lastH2Act = this.lastH2Raw.map(v => Math.max(0, v));

    // Output layer: Linear(W3^T · h2 + b3)
    const output = new Array(this.outputSize).fill(0);
    for (let o = 0; o < this.outputSize; o++) {
      let sum = this.b3[o];
      for (let h2 = 0; h2 < this.h2Size; h2++) {
        sum += this.lastH2Act[h2] * this.w3[h2][o];
      }
      output[o] = sum;
    }

    return [...output];
  }

  /** Train on a single sample: input → targetQ (MSE loss, backprop with gradient clipping) */
  train(input: number[], targetQ: number[], lr: number): void {
    const predicted = this.forward(input);

    // Output error: dL/dO = predicted - target  (MSE derivative)
    const outputError = predicted.map((p, i) => p - targetQ[i]);

    // Gradient clipping to prevent exploding gradients
    const clip = 1.0;
    const clamp = (v: number) => Math.max(-clip, Math.min(clip, v));

    for (let i = 0; i < outputError.length; i++) {
      outputError[i] = clamp(outputError[i]);
    }

    // --- W3 gradients (hidden2 → output) ---
    for (let h2 = 0; h2 < this.h2Size; h2++) {
      for (let o = 0; o < this.outputSize; o++) {
        this.w3[h2][o] -= lr * outputError[o] * this.lastH2Act[h2];
      }
    }
    for (let o = 0; o < this.outputSize; o++) {
      this.b3[o] -= lr * outputError[o];
    }

    // --- Backprop to hidden layer 2 ---
    const h2Error = new Array(this.h2Size).fill(0);
    for (let h2 = 0; h2 < this.h2Size; h2++) {
      let err = 0;
      for (let o = 0; o < this.outputSize; o++) {
        err += outputError[o] * this.w3[h2][o];
      }
      // ReLU derivative + gradient clip
      h2Error[h2] = this.lastH2Raw[h2] > 0 ? clamp(err) : 0;
    }

    // --- W2 gradients (hidden1 → hidden2) ---
    for (let h1 = 0; h1 < this.h1Size; h1++) {
      for (let h2 = 0; h2 < this.h2Size; h2++) {
        this.w2[h1][h2] -= lr * h2Error[h2] * this.lastH1Act[h1];
      }
    }
    for (let h2 = 0; h2 < this.h2Size; h2++) {
      this.b2[h2] -= lr * h2Error[h2];
    }

    // --- Backprop to hidden layer 1 ---
    const h1Error = new Array(this.h1Size).fill(0);
    for (let h1 = 0; h1 < this.h1Size; h1++) {
      let err = 0;
      for (let h2 = 0; h2 < this.h2Size; h2++) {
        err += h2Error[h2] * this.w2[h1][h2];
      }
      h1Error[h1] = this.lastH1Raw[h1] > 0 ? clamp(err) : 0;
    }

    // --- W1 gradients (input → hidden1) ---
    for (let i = 0; i < this.inputSize; i++) {
      for (let h1 = 0; h1 < this.h1Size; h1++) {
        this.w1[i][h1] -= lr * h1Error[h1] * this.lastInput[i];
      }
    }
    for (let h1 = 0; h1 < this.h1Size; h1++) {
      this.b1[h1] -= lr * h1Error[h1];
    }
  }

  /** Copy weights from another network (for target network sync) */
  copyFrom(source: NeuralNetwork): void {
    for (let i = 0; i < this.inputSize; i++)
      for (let h = 0; h < this.h1Size; h++)
        this.w1[i][h] = source.w1[i][h];
    this.b1 = [...source.b1];

    for (let h1 = 0; h1 < this.h1Size; h1++)
      for (let h2 = 0; h2 < this.h2Size; h2++)
        this.w2[h1][h2] = source.w2[h1][h2];
    this.b2 = [...source.b2];

    for (let h2 = 0; h2 < this.h2Size; h2++)
      for (let o = 0; o < this.outputSize; o++)
        this.w3[h2][o] = source.w3[h2][o];
    this.b3 = [...source.b3];
  }
}
