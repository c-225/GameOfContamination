export class GameOfLife {
    width: number;
    height: number;
    currentGrid: Uint8Array;
    nextGrid: Uint8Array;
    neighborCounts: Uint8Array;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.currentGrid = new Uint8Array(width * height);
        this.nextGrid = new Uint8Array(width * height);
        this.neighborCounts = new Uint8Array(width * height);
    }

    // Resets the grid and neighbor counts to an empty state
    reset() {
        this.currentGrid.fill(0);
        this.nextGrid.fill(0);
        this.neighborCounts.fill(0);
    }

    // Initializes the grid with a given density of live cells and updates neighbor counts
    initialize(density: number = 0.2) {
        this.reset();
        for (let i = 0; i < this.currentGrid.length; i++) {
            if (Math.random() < density) {
                this.currentGrid[i] = 1;
                this.incrementNeighbors(i);
            }
        }
    }

    getCell(x: number, y: number): number {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 0;
        return this.currentGrid[y * this.width + x];
    }

    setCell(x: number, y: number, value: number) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
        const index = y * this.width + x;
        const isAlive = this.currentGrid[index] === 1;
        if (isAlive !== !!value) {
            this.currentGrid[index] = value;
            const delta = value === 1 ? 1 : -1;
            this.updateNeighborCounts(x, y, delta);
        }
    }

    // Advances the grid by one generation using cached neighbor counts
    step() {
        for (let i = 0; i < this.currentGrid.length; i++) {
            const alive = this.currentGrid[i] === 1;
            const neighbors = this.neighborCounts[i];

            if (alive) {
                if (neighbors === 2 || neighbors === 3) {
                    this.nextGrid[i] = 1; // Cell remains alive
                } else {
                    this.nextGrid[i] = 0; // Cell dies
                }
            } else {
                if (neighbors === 3) {
                    this.nextGrid[i] = 1; // Cell becomes alive
                } else {
                    this.nextGrid[i] = 0; // Cell remains dead
                }
            }
        }

        // Update neighbor counts based on changes from currentGrid to nextGrid
        for (let i = 0; i < this.currentGrid.length; i++) {
            if (this.currentGrid[i] !== this.nextGrid[i]) {
                const x = i % this.width;
                const y = Math.floor(i / this.width);
                const delta = this.nextGrid[i] === 1 ? 1 : -1;
                this.updateNeighborCounts(x, y, delta);
            }
        }

        // Swap currentGrid and nextGrid
        [this.currentGrid, this.nextGrid] = [this.nextGrid, this.currentGrid];
        this.nextGrid.fill(0); // Reset nextGrid for the next step
    }

    // Increments neighbor counts for all neighbors of a cell at index
    private incrementNeighbors(index: number) {
        const x = index % this.width;
        const y = Math.floor(index / this.width);
        for (let dy = -1; dy <= 1; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= this.height) continue;
            for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx;
                if (nx < 0 || nx >= this.width) continue;
                if (dx === 0 && dy === 0) continue;
                this.neighborCounts[ny * this.width + nx]++;
            }
        }
    }

    // Updates neighbor counts based on the delta (1 for alive, -1 for dead)
    private updateNeighborCounts(x: number, y: number, delta: number) {
        for (let dy = -1; dy <= 1; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= this.height) continue;
            for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx;
                if (nx < 0 || nx >= this.width) continue;
                if (dx === 0 && dy === 0) continue;
                this.neighborCounts[ny * this.width + nx] += delta;
            }
        }
    }

    // Creates a copy of the current grid
    getGridCopy(): Uint8Array {
        return new Uint8Array(this.currentGrid);
    }

    // Sets the grid to a specific state and rebuilds neighbor counts
    setGrid(newGrid: Uint8Array) {
        if (newGrid.length !== this.currentGrid.length) {
            throw new Error("New grid has an incorrect size.");
        }
        this.currentGrid = new Uint8Array(newGrid);
        this.nextGrid.fill(0); // Reset nextGrid
        this.rebuildNeighborCounts();
    }

    // Rebuilds the neighbor counts from the current grid
    private rebuildNeighborCounts() {
        this.neighborCounts.fill(0);
        for (let i = 0; i < this.currentGrid.length; i++) {
            if (this.currentGrid[i] === 1) {
                this.incrementNeighbors(i);
            }
        }
    }
}
