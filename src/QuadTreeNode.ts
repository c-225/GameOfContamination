export class QuadtreeNode {
    x: number;
    y: number;
    size: number;
    alive: boolean;
    children: QuadtreeNode[] | null;

    constructor(x: number, y: number, size: number, alive: boolean = false) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.alive = alive;
        this.children = null;
    }

    // Subdivide the node into four children
    subdivide() {
        const half = this.size / 2;
        this.children = [
            new QuadtreeNode(this.x, this.y, half),
            new QuadtreeNode(this.x + half, this.y, half),
            new QuadtreeNode(this.x, this.y + half, half),
            new QuadtreeNode(this.x + half, this.y + half, half)
        ];
    }

    // Check if the node is a leaf
    isLeaf(): boolean {
        return this.children === null;
    }

    // Toggle the state of a cell
    toggleCell(px: number, py: number) {
        if (this.size === 1) {
            this.alive = !this.alive;
            return;
        }

        if (this.isLeaf()) {
            this.subdivide();
        }

        const half = this.size / 2;
        let index = 0;
        if (px >= this.x + half) index += 1;
        if (py >= this.y + half) index += 2;

        this.children![index].toggleCell(px, py);
    }

    // Count alive neighbors (simplified for demonstration)
    countAliveNeighbors(x: number, y: number): number {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (this.isCellAlive(nx, ny)) {
                    count++;
                }
            }
        }
        return count;
    }

    // Check if a specific cell is alive
    isCellAlive(px: number, py: number): boolean {
        if (px < this.x || px >= this.x + this.size || py < this.y || py >= this.y + this.size) {
            return false;
        }

        if (this.size === 1) {
            return this.alive;
        }

        if (this.isLeaf()) {
            return this.alive;
        }

        const half = this.size / 2;
        let index = 0;
        if (px >= this.x + half) index += 1;
        if (py >= this.y + half) index += 2;

        return this.children![index].isCellAlive(px, py);
    }

    // Advance the quadtree by one generation (simplified)
    advance() {
        if (this.isLeaf()) {
            const neighbors = this.countAliveNeighbors(this.x, this.y);
            if (this.alive) {
                this.alive = neighbors === 2 || neighbors === 3;
            } else {
                this.alive = neighbors === 3;
            }
            return;
        }

        this.children!.forEach(child => child.advance());
    }

    // Convert quadtree to grid (for visualization or other purposes)
    toGrid(grid: Uint8Array, width: number) {
        if (this.isLeaf()) {
            if (this.alive) {
                const index = this.y * width + this.x;
                grid[index] = 1;
            }
            return;
        }

        this.children!.forEach(child => child.toGrid(grid, width));
    }
}
