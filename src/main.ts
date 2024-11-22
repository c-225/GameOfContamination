// src/main.ts
import './style.css';

import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import { GameOfLife } from "./GameOfLife";

// -------------------------
// Three.js Setup and Rendering
// -------------------------

// Constants
const GRID_WIDTH = 512;
const GRID_HEIGHT = 512;
const CELL_SIZE = 1; // Adjust for cell scaling
const STEP_INTERVAL = 50; // Milliseconds between steps

// Initialize Game of Life with empty grid
const gameOfLife = new GameOfLife(GRID_WIDTH, GRID_HEIGHT);
gameOfLife.reset(); // Start with an empty grid

// Initialize Three.js Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a); // Dark background

// Initialize Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Initialize Camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
// Position the camera so that the entire grid is visible
camera.position.set(0, 0, 15);

// Make the camera look at the center of the grid
camera.lookAt(0, 0, 0);

// Add OrbitControls for camera interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth camera movements
controls.dampingFactor = 0.05;
controls.enableRotate = false; // Disable rotation initially

// Create InstancedMesh for cells
const cellGeometry = new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE);
const cellMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 1,
});

const gridHelper = new THREE.GridHelper(
    GRID_WIDTH * CELL_SIZE,
    GRID_WIDTH,
    0x444444,
    0x444444
);
scene.add(gridHelper);

// Center the grid helper at (0,0)
gridHelper.position.set(0, 0, 0);
gridHelper.rotation.x = -Math.PI / 2; // Rotate to lie on XZ plane

const maxCells = GRID_WIDTH * GRID_HEIGHT;
const instancedMesh = new THREE.InstancedMesh(cellGeometry, cellMaterial, maxCells);

// Temporary Object3D for setting instance matrices
const dummy = new THREE.Object3D();

// Initialize InstancedMesh positions
let instanceCount = 0;
for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
        // Center the grid around (0,0)
        dummy.position.set(
            x * CELL_SIZE - (GRID_WIDTH * CELL_SIZE) / 2 + CELL_SIZE / 2,
            y * CELL_SIZE - (GRID_HEIGHT * CELL_SIZE) / 2 + CELL_SIZE / 2,
            0
        );
        dummy.scale.set(0.01, 0.01, 1); // Initially hide all cells
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(instanceCount++, dummy.matrix);
    }
}

// Set initial visibility based on Game of Life state
updateMesh(gameOfLife);

// Add InstancedMesh to the scene
scene.add(instancedMesh);

// -------------------------
// Raycaster Indicator Setup
// -------------------------

// Create a square indicator
const indicatorGeometry = new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE);
const indicatorMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    opacity: 0.5,
    transparent: true,
    side: THREE.DoubleSide,
});
const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
indicator.visible = false; // Initially hidden
scene.add(indicator);

// -------------------------
// UI Controls Setup
// -------------------------

const startButton = document.getElementById('startButton') as HTMLButtonElement;
const pauseButton = document.getElementById('pauseButton') as HTMLButtonElement;
const stopButton = document.getElementById('stopButton') as HTMLButtonElement;
const resetButton = document.getElementById('resetButton') as HTMLButtonElement;
const randomizeButton = document.getElementById('randomizeButton') as HTMLButtonElement;

// Simulation state
let isRunning = false;

// Initial Grid State
let initialGrid: Uint8Array | null = null;

// FPS Counter Elements
const fpsContainer = document.createElement('div');
fpsContainer.id = 'fpsCounter';
fpsContainer.className = 'fixed top-5 right-5 bg-black bg-opacity-50 text-white text-sm p-2 rounded z-50';
fpsContainer.innerText = 'FPS: 0';
document.body.appendChild(fpsContainer);

// FPS Calculation Variables
let frameCount = 0;
let fps = 0;
let lastFpsUpdate = performance.now();

// Helper Functions to Manage Button States
function updateButtonStates() {
    startButton.disabled = isRunning;
    pauseButton.disabled = !isRunning;
    stopButton.disabled = !isRunning;
    resetButton.disabled = isRunning; // Disable reset when running
    randomizeButton.disabled = isRunning; // Disable randomize when running
}

function saveInitialState() {
	initialGrid = gameOfLife.getGridCopy();
}

function restoreInitialState() {
    if (initialGrid) {
        gameOfLife.setGrid(initialGrid);
        updateMesh(gameOfLife);
    }
}

// Event Listeners for Buttons
startButton.addEventListener('click', () => {
    if (!isRunning) {
        isRunning = true;
        saveInitialState();
        updateButtonStates();
        disableCellPlacement(); // Disable cell placement
    }
});

pauseButton.addEventListener('click', () => {
    if (isRunning) {
        isRunning = false;
        updateButtonStates();
        enableCellPlacement(); // Enable cell placement
    }
});

stopButton.addEventListener('click', () => {
    if (isRunning) {
        isRunning = false;
    }
    updateButtonStates();
    controls.enableRotate = false; // Disable camera rotation
    restoreInitialState(); // Restore the initial grid state
    enableCellPlacement(); // Ensure cell placement is enabled
});

resetButton.addEventListener('click', () => {
    gameOfLife.reset();
    updateMesh(gameOfLife);
    // Reset initialGrid since the grid has been modified
    initialGrid = null;
});

randomizeButton.addEventListener('click', () => {
    gameOfLife.initialize(0.2); // Adjust density as needed
    updateMesh(gameOfLife);
    // Reset initialGrid since the grid has been modified
    initialGrid = null;
});

// Initialize button states on load
updateButtonStates();

// -------------------------
// Functions
// -------------------------

// Function to update the InstancedMesh based on Game of Life grid
function updateMesh(game: GameOfLife) {
    let count = 0;
    for (let y = 0; y < game.height; y++) {
        for (let x = 0; x < game.width; x++) {
            const isAlive = game.currentGrid[y * game.width + x] === 1;
            if (isAlive) {
                // Show the cell by setting scale to 1
                dummy.scale.set(1, 1, 1);
            } else {
                // Hide the cell by setting scale to 0
                dummy.scale.set(0, 0, 0);
            }
            // Position cells centered around (0,0)
            dummy.position.set(
                x * CELL_SIZE - (GRID_WIDTH * CELL_SIZE) / 2 + CELL_SIZE / 2,
                y * CELL_SIZE - (GRID_HEIGHT * CELL_SIZE) / 2 + CELL_SIZE / 2,
                0
            );
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(count++, dummy.matrix);
        }
    }
    instancedMesh.instanceMatrix.needsUpdate = true;
}

// Animation Loop Variables
let lastStepTime = 0;

// Start the animation loop immediately
animate(0);

// Animation Loop
function animate(time: number) {
    requestAnimationFrame(animate);

    // FPS Calculation
    frameCount++;
    const now = performance.now();
    const delta = now - lastFpsUpdate;
    if (delta >= 1000) { // Update every second
        fps = Math.round((frameCount / delta) * 1000);
        fpsContainer.innerText = `FPS: ${fps}`;
        frameCount = 0;
        lastFpsUpdate = now;
    }

    // Step the Game of Life at intervals if running
    if (isRunning && time - lastStepTime > STEP_INTERVAL) {
        gameOfLife.step();
        updateMesh(gameOfLife);
        lastStepTime = time;
    }

    controls.update(); // Update camera controls
    renderer.render(scene, camera);
}

// Handle Window Resize
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

// -------------------------
// Handle User Interaction: Drag Drawing
// -------------------------

let isDragging = false;
let lastHoveredCell: { x: number, y: number } | null = null;

// Event Listeners for Drag Drawing
renderer.domElement.addEventListener('mousedown', onMouseDown, false);
renderer.domElement.addEventListener('mouseup', onMouseUp, false);
renderer.domElement.addEventListener('mouseleave', onMouseUp, false);
renderer.domElement.addEventListener('mousemove', onMouseMoveDrag, false);

// Function to disable cell placement
function disableCellPlacement() {
    renderer.domElement.style.cursor = 'default';
}

// Function to enable cell placement
function enableCellPlacement() {
    renderer.domElement.style.cursor = 'crosshair';
}

// Initialize with cell placement enabled
enableCellPlacement();

function onMouseDown(event: MouseEvent) {
    // Only respond to left-click (button === 0)
    if (!isRunning && event.button === 0) {
        isDragging = true;
        handleCellToggle(event);
    }
}

function onMouseUp(_: MouseEvent) {
    isDragging = false;
    lastHoveredCell = null;
}

function onMouseMoveDrag(event: MouseEvent) {
    if (isRunning) {
        handleMouseMove(event);
        return;
    }

    if (isDragging && event.buttons === 1) { // Only if left mouse button is held
        handleCellToggle(event);
    } else {
        handleMouseMove(event);
    }
}

function handleCellToggle(event: MouseEvent) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    // Raycast to find intersected objects
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Define a plane for intersection (XY plane)
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectPoint);

    if (intersectPoint) {
        // Calculate cell coordinates based on intersect point
        const x = Math.floor((intersectPoint.x + (GRID_WIDTH * CELL_SIZE) / 2) / CELL_SIZE);
        const y = Math.floor((intersectPoint.y + (GRID_HEIGHT * CELL_SIZE) / 2) / CELL_SIZE);

        if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
            // Avoid toggling the same cell multiple times during a drag
            if (!lastHoveredCell || lastHoveredCell.x !== x || lastHoveredCell.y !== y) {
                gameOfLife.toggleCell(x, y);
                updateMesh(gameOfLife);
                lastHoveredCell = { x, y };
            }
        }
    }
}

function handleMouseMove(event: MouseEvent) {
    if (isRunning) {
        indicator.visible = false;
        return;
    }


    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    // Raycast to find intersected objects
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Define a plane for intersection (XY plane)
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectPoint);

    if (intersectPoint) {
        // Calculate cell coordinates based on intersect point
        const x = Math.floor((intersectPoint.x + (GRID_WIDTH * CELL_SIZE) / 2) / CELL_SIZE);
        const y = Math.floor((intersectPoint.y + (GRID_HEIGHT * CELL_SIZE) / 2) / CELL_SIZE);

        if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
            // Position the indicator square at the center of the hovered cell
            indicator.position.set(
                x * CELL_SIZE - (GRID_WIDTH * CELL_SIZE) / 2 + CELL_SIZE / 2,
                y * CELL_SIZE - (GRID_HEIGHT * CELL_SIZE) / 2 + CELL_SIZE / 2,
                0.01 // Slightly above the grid
            );
            indicator.visible = true;
        } else {
            indicator.visible = false;
        }
    } else {
        indicator.visible = false;
    }
}

// Prevent default context menu on right-click
renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());
