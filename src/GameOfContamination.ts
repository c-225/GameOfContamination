export class GameOfContamination {
    width: number;
    height: number;
    currentGrid: Uint8Array;
    nextGrid: Uint8Array;
    neighborCounts: Uint8Array;
    contaminated: number;
    over:boolean = false;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.currentGrid = new Uint8Array(width * height);
        this.nextGrid = new Uint8Array(width * height);
        this.neighborCounts = new Uint8Array(width * height);
        this.contaminated = 0;
    }

    // Resets the grid and neighbor counts to an empty state
    reset() {
        this.currentGrid.fill(0);
        this.nextGrid.fill(0);
        this.neighborCounts.fill(0);
        this.contaminated = 0;
        this.over = false;
    }

    // Initializes the grid with a given density of live cells and updates neighbor counts
    initialize(density: number = 0.2) {
        this.reset();
        for (let i = 0; i < this.currentGrid.length; i++) {
            if (Math.random() < density) {
                this.currentGrid[i] = 1;
                this.contaminated++;
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
        const isContaminated = this.currentGrid[index] === 1;
        if (isContaminated !== !!value) {
            this.currentGrid[index] = value;
            const delta = value === 1 ? 1 : -1;
            this.updateNeighborCounts(x, y, delta);
        }
    }

    // Advances the grid by one generation using cached neighbor counts
    step() {
        this.nextGrid.fill(0);
        for (let i = 0; i < this.currentGrid.length; i++) {
            let neighborContaminated = []
            if (this.currentGrid[i] === 0) {
                if (i % this.width != this.width-1 && this.currentGrid[i+1]==1) { neighborContaminated.push(i+1); }
                if (i % this.width != 0 && this.currentGrid[i-1]==1) { neighborContaminated.push(i-1); }
                if (Math.floor(i/this.height) != 0 && this.currentGrid[i-this.height]==1) { neighborContaminated.push(i-this.width); }
                if (Math.floor(i/this.height) != this.height && this.currentGrid[i+this.height]==1) { neighborContaminated.push(i + this.width); }
            }
            if (this.currentGrid[i] === 1) {
                this.nextGrid[i] = 1;
            }
            if ( neighborContaminated.length >= 2) {
                this.nextGrid[i] = 1;
                this.contaminated++;
            }
        }
        if (this.currentGrid.toString() === this.nextGrid.toString()) {
            this.over = true;
        }
        this.currentGrid = new Uint8Array(this.nextGrid);
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
                if (dx === dy) continue;
                this.neighborCounts[ny * this.width + nx]++;
            }
        }
    }

    // Updates neighbor counts based on the delta (1 for contaminated, -1 for dead)
    private updateNeighborCounts(x: number, y: number, delta: number) {
        for (let dy = -1; dy <= 1; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= this.height) continue;
            for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx;
                if (nx < 0 || nx >= this.width) continue;
                if (dx === dy) continue;
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