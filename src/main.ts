import './style.css';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GameOfLife } from "./GameOfLife";
import { WebcamProcessor } from "./webcamProcessor.ts";

// -------------------------
// Three.js Setup and Rendering
// -------------------------

// Constants
const GRID_WIDTH = 256;
const GRID_HEIGHT = 256;
const CELL_SIZE = 1; // Adjust for cell scaling
let STEP_INTERVAL = 1000; // Initially X1: 1 step per second

// FPS Calculation Variables
let frameCount = 0;
let fps = 0;
let lastFpsUpdate = performance.now();

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

// Initialize WebCam
const webcamProcessor = new WebcamProcessor();

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
controls.enablePan = false; // Disable panning
controls.enableZoom = false; // Disable zooming

// Create InstancedMesh for cells
const cellGeometry = new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE);
const cellMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide,
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
const webcamButton = document.getElementById('webcamButton') as HTMLButtonElement;

const penModeButton = document.getElementById('penModeButton') as HTMLButtonElement;
const eraserModeButton = document.getElementById('eraserModeButton') as HTMLButtonElement;
const cameraModeButton = document.getElementById('cameraModeButton') as HTMLButtonElement;

const undoButton = document.getElementById('undoButton') as HTMLButtonElement;
const redoButton = document.getElementById('redoButton') as HTMLButtonElement;

// Simulation state
let isRunning = false;

// Initial Grid State
let initialGrid: Uint8Array | null = null;

// Current Mode State: 'drawing' or 'camera'
let currentMode: 'drawing' | 'camera' = 'drawing'; // Default mode

// Drawing Mode State: 'draw' or 'erase'
type DrawingMode = 'draw' | 'erase';
let drawingMode: DrawingMode = 'draw'; // Default to 'draw'

// FPS Counter Elements
const fpsContainer = document.getElementById('fpsCounter') as HTMLDivElement;

// Undo/Redo Structures
interface CellChange {
    x: number;
    y: number;
    oldValue: number;
    newValue: number;
}
type Stroke = CellChange[];
const undoStack: Stroke[] = [];
const redoStack: Stroke[] = [];

// The current stroke being drawn
let currentStroke: Stroke | null = null;

// -------------------------
// Speed Control Setup
// -------------------------

// Define Speed Settings
interface SpeedSetting {
    label: string;
    stepsPerSecond: number;
}

const speedSettings: SpeedSetting[] = [
    { label: 'X1', stepsPerSecond: 1 },
    { label: 'X2', stepsPerSecond: 2 },
    { label: 'X5', stepsPerSecond: 5 },
    { label: 'X10', stepsPerSecond: 10 },
    { label: 'X100', stepsPerSecond: 100 },
];

let currentSpeedIndex = 0; // Start with X1

// Reference to the Speed Button
const speedButton = document.getElementById('speedButton') as HTMLButtonElement;

// Initialize Speed Button Label
speedButton.innerText = `${speedSettings[currentSpeedIndex].label}`;

// Function to Update STEP_INTERVAL Based on Current Speed
function updateStepInterval() {
    STEP_INTERVAL = 1000 / speedSettings[currentSpeedIndex].stepsPerSecond;
}

// Function to Cycle to the Next Speed
function cycleSpeed() {
    currentSpeedIndex = (currentSpeedIndex + 1) % speedSettings.length;
    const currentSpeed = speedSettings[currentSpeedIndex];
    speedButton.innerText = `${currentSpeed.label}`;
    updateStepInterval();
}

// Add Event Listener to Speed Button
speedButton.addEventListener('click', () => {
    cycleSpeed();
});

// Initialize STEP_INTERVAL based on initial speed
updateStepInterval();

// -------------------------
// Helper Functions to Manage Button States
// -------------------------
function updateButtonStates() {
    startButton.disabled = isRunning;
    pauseButton.disabled = !isRunning;
    stopButton.disabled = !isRunning;
    resetButton.disabled = isRunning; // Disable reset when running
    randomizeButton.disabled = isRunning; // Disable randomize when running
    webcamButton.disabled = isRunning; // Disable webcam when running
    penModeButton.disabled = isRunning;
    eraserModeButton.disabled = isRunning;
    cameraModeButton.disabled = isRunning;

    // Disable undo/redo while running
    undoButton.disabled = isRunning || undoStack.length === 0;
    redoButton.disabled = isRunning || redoStack.length === 0;
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

// Mode management functions
function switchToCameraMode() {
    currentMode = 'camera';
    controls.enabled = true; // Enable OrbitControls
    enableCameraControls();
    disableCellPlacement();

    cameraModeButton.classList.remove('opacity-50');
    penModeButton.classList.add('opacity-50');
    eraserModeButton.classList.add('opacity-50');
}

function switchToDrawingMode(drawMode: DrawingMode) {
    currentMode = 'drawing';
    controls.enabled = false; // Disable OrbitControls
    disableCameraControls();
    enableCellPlacement();
    drawingMode = drawMode;
    if (drawingMode === 'draw') {
        penModeButton.classList.remove('opacity-50');
        eraserModeButton.classList.add('opacity-50');
    } else {
        eraserModeButton.classList.remove('opacity-50');
        penModeButton.classList.add('opacity-50');
    }
    cameraModeButton.classList.add('opacity-50');
}

// Event Listeners for Buttons
startButton.addEventListener('click', () => {
    if (!isRunning) {
        isRunning = true;
        saveInitialState();
        updateButtonStates();
        switchToCameraMode(); // Automatically switch to Camera Mode
    }
});

pauseButton.addEventListener('click', () => {
    if (isRunning) {
        isRunning = false;
        updateButtonStates();
        switchToDrawingMode('draw'); // Automatically switch to Drawing Mode (pen by default)
    }
});

stopButton.addEventListener('click', () => {
    if (isRunning) {
        isRunning = false;
    }
    updateButtonStates();
    restoreInitialState(); // Restore the initial grid state
    switchToDrawingMode('draw'); // Automatically switch to Drawing Mode (pen)
});

resetButton.addEventListener('click', () => {
    gameOfLife.reset();
    updateMesh(gameOfLife);
    // Reset initialGrid since the grid has been modified
    initialGrid = null;
    undoStack.length = 0;
    redoStack.length = 0;
    updateButtonStates();
});

randomizeButton.addEventListener('click', () => {
    gameOfLife.initialize(0.2); // Adjust density as needed
    updateMesh(gameOfLife);
    // Reset initialGrid since the grid has been modified
    initialGrid = null;
    undoStack.length = 0;
    redoStack.length = 0;
    updateButtonStates();
});

webcamButton.addEventListener('click', async () => {
    await webcamProcessor.startWebcam();
    // 64x64 grid
    const grid = await webcamProcessor.captureAndProcessImage();

    // Create a new UInt8Array with the grid data
    const newGrid = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
    // set at center
    const xStart = Math.floor(GRID_WIDTH / 2) - 32;
    const yStart = Math.floor(GRID_HEIGHT / 2) - 32;
    for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
            newGrid[(y + yStart) * GRID_WIDTH + x + xStart] = grid[63 - y][x];
        }
    }

    gameOfLife.setGrid(newGrid);
    updateMesh(gameOfLife);

    webcamProcessor.stopWebcam();
    undoStack.length = 0;
    redoStack.length = 0;
    updateButtonStates();
});

// Mode Buttons Event Listeners
penModeButton.addEventListener('click', () => {
    if (!isRunning) {
        switchToDrawingMode('draw');
    }
});

eraserModeButton.addEventListener('click', () => {
    if (!isRunning) {
        switchToDrawingMode('erase');
    }
});

cameraModeButton.addEventListener('click', () => {
    if (!isRunning) {
        switchToCameraMode();
    }
});

// *** NEW: Undo and Redo event listeners ***
undoButton.addEventListener('click', undo);
redoButton.addEventListener('click', redo);

function undo() {
    if (undoStack.length === 0) return;
    const stroke = undoStack.pop()!;
    // Revert each change
    for (const change of stroke) {
        gameOfLife.setCell(change.x, change.y, change.oldValue);
    }
    redoStack.push(stroke);
    updateMesh(gameOfLife);
    updateButtonStates();
}

function redo() {
    if (redoStack.length === 0) return;
    const stroke = redoStack.pop()!;
    // Reapply each change
    for (const change of stroke) {
        gameOfLife.setCell(change.x, change.y, change.newValue);
    }
    undoStack.push(stroke);
    updateMesh(gameOfLife);
    updateButtonStates();
}

// Initialize button states on load
updateButtonStates();

// Start in drawing mode (pen)
switchToDrawingMode('draw');

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

// Maintain a map to track active pointers
const activePointers: Map<number, { x: number, y: number }> = new Map();

// Variable to track drawing state per pointer
const drawingPointers: Set<number> = new Set();

// Pointer Event Listeners
renderer.domElement.addEventListener('pointerdown', onPointerDown, false);
renderer.domElement.addEventListener('pointerup', onPointerUp, false);
renderer.domElement.addEventListener('pointercancel', onPointerUp, false);
renderer.domElement.addEventListener('pointermove', onPointerMove, false);

// Prevent default touch actions
renderer.domElement.style.touchAction = 'none';

// Disable/Enable cell placement
function disableCellPlacement() {
    renderer.domElement.style.cursor = 'default';
}
function enableCellPlacement() {
    renderer.domElement.style.cursor = 'crosshair';
}

// Enable/disable camera controls
function enableCameraControls() {
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enableZoom = true;
}

function disableCameraControls() {
    controls.enableRotate = false;
    controls.enablePan = false;
    controls.enableZoom = false;
}

// Unified Pointer Down Handler
function onPointerDown(event: PointerEvent) {
    if (event.button !== 0) return; // Only handle primary button

    if (isRunning) return; // Disable drawing when simulation is running

    if (currentMode === 'drawing') {
        drawingPointers.add(event.pointerId);
        // Start a new stroke
        currentStroke = [];
        handleDrawing(event);
    }
}

function onPointerUp(event: PointerEvent) {
    drawingPointers.delete(event.pointerId);
    activePointers.delete(event.pointerId);
    lastHoveredCell = null;
    // Finalize stroke
    if (currentStroke && currentStroke.length > 0) {
        undoStack.push(currentStroke);
        // Clear redo stack because we made a new change
        redoStack.length = 0;
        currentStroke = null;
        updateButtonStates();
    }
}

function onPointerMove(event: PointerEvent) {
    if (currentMode === 'camera') {
        handleMouseMove(event);
        return;
    }

    if (currentMode === 'drawing') {
        if (event.buttons !== 1) return; // Only handle left-click drag
        if (drawingPointers.has(event.pointerId)) {
            handleDrawing(event);
        }
    }

    handleMouseMove(event);
}

// Bresenham line function for interpolation
function bresenhamLine(x0: number, y0: number, x1: number, y1: number): {x:number,y:number}[] {
    const points = [];
    const dx = Math.abs(x1 - x0);
    const sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0);
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    while(true) {
        points.push({x, y});
        if (x === x1 && y === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) {
            err += dy;
            x += sx;
        }
        if (e2 <= dx) {
            err += dx;
            y += sy;
        }
    }
    return points;
}

// Set a single cell and record the change
function setSingleCell(x: number, y: number, value: number) {
    const oldValue = gameOfLife.getCell(x, y);
    if (oldValue !== value) {
        gameOfLife.setCell(x, y, value);
        updateMesh(gameOfLife);
        if (currentStroke) {
            currentStroke.push({ x, y, oldValue, newValue: value });
        }
    }
}

let lastHoveredCell: { x: number, y: number } | null = null;

function handleDrawing(event: PointerEvent) {
    const { clientX, clientY } = event;

    // Calculate pointer position in normalized device coordinates (-1 to +1)
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
    );

    // Raycast to find intersection with the grid plane
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Define a plane for intersection (XY plane)
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectPoint);

    if (intersectPoint) {
        // Calculate cell coordinates
        const xCoord = Math.floor((intersectPoint.x + (GRID_WIDTH * CELL_SIZE) / 2) / CELL_SIZE);
        const yCoord = Math.floor((intersectPoint.y + (GRID_HEIGHT * CELL_SIZE) / 2) / CELL_SIZE);

        if (xCoord >= 0 && xCoord < GRID_WIDTH && yCoord >= 0 && yCoord < GRID_HEIGHT) {
            // Determine the value based on the current drawing mode
            const value = drawingMode === 'draw' ? 1 : 0;

            // If we have a lastHoveredCell, interpolate line
            if (lastHoveredCell && (lastHoveredCell.x !== xCoord || lastHoveredCell.y !== yCoord)) {
                const linePoints = bresenhamLine(lastHoveredCell.x, lastHoveredCell.y, xCoord, yCoord);
                for (const p of linePoints) {
                    setSingleCell(p.x, p.y, value);
                }
                lastHoveredCell = { x: xCoord, y: yCoord };
            } else if (!lastHoveredCell) {
                // First cell in stroke
                setSingleCell(xCoord, yCoord, value);
                lastHoveredCell = { x: xCoord, y: yCoord };
            }
        }
    }
}

function handleMouseMove(event: PointerEvent) {
    if (isRunning || currentMode === 'camera') {
        indicator.visible = false;
        return;
    }

    const { clientX, clientY } = event;

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
    );

    // Raycast to find intersection with the grid plane
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Define a plane for intersection (XY plane)
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectPoint);

    if (intersectPoint) {
        // Calculate cell coordinates
        const xCoord = Math.floor((intersectPoint.x + (GRID_WIDTH * CELL_SIZE) / 2) / CELL_SIZE);
        const yCoord = Math.floor((intersectPoint.y + (GRID_HEIGHT * CELL_SIZE) / 2) / CELL_SIZE);

        if (xCoord >= 0 && xCoord < GRID_WIDTH && yCoord >= 0 && yCoord < GRID_HEIGHT) {
            // Position the indicator square
            indicator.position.set(
                xCoord * CELL_SIZE - (GRID_WIDTH * CELL_SIZE) / 2 + CELL_SIZE / 2,
                yCoord * CELL_SIZE - (GRID_HEIGHT * CELL_SIZE) / 2 + CELL_SIZE / 2,
                0.01
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

// Initialize the animation loop
animate(0);

// Keyboard Shortcut for Drawing Mode Toggle (Press 'E' or 'e' to switch between Draw and Erase)
window.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'e' || event.key === 'E') {
        if (currentMode === 'drawing') {
            drawingMode = drawingMode === 'draw' ? 'erase' : 'draw';
            if (drawingMode === 'draw') {
                penModeButton.classList.remove('opacity-50');
                eraserModeButton.classList.add('opacity-50');
            } else {
                eraserModeButton.classList.remove('opacity-50');
                penModeButton.classList.add('opacity-50');
            }
        }
    }
});

// Help Modal Elements
const helpModal = document.getElementById('helpModal') as HTMLDivElement;
const helpButton = document.getElementById('helpButton') as HTMLButtonElement;
const closeHelpModal = document.getElementById('closeHelpModal') as HTMLButtonElement;

// Function to Show the Help Modal
function showHelpModal() {
  helpModal.classList.remove('hidden');
}

// Function to Hide the Help Modal
function hideHelpModal() {
  helpModal.classList.add('hidden');
}

// Show the Help Modal on Page Load
window.addEventListener('DOMContentLoaded', () => {
  showHelpModal();
});

// Event Listener for Help Button
helpButton.addEventListener('click', () => {
  showHelpModal();
});

// Event Listener for Close Button within the Modal
closeHelpModal.addEventListener('click', () => {
  hideHelpModal();
});

// Optional: Close the modal when clicking outside the modal content
helpModal.addEventListener('click', (event) => {
  if (event.target === helpModal) {
    hideHelpModal();
  }
});
