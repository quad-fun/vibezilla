// Game variables
let map;
let monster;
let score = 0;
let highScore = 0;
let gameActive = false;
let destroyedBuildings = new Set();
let debrisPool = [];
let rubblePool = [];
let buildings = [];
let lastTime = 0;
let monsterSpeed = {x: 0, y: 0};
let keyState = {
    up: false,
    down: false,
    left: false,
    right: false
};
let joystickActive = false;
let joystickPosition = {x: 0, y: 0};
let isMobile = false;

// For building destruction detection
const destructionRadius = 30;
const maxDebris = 30;
const maxRubble = 50;

// Sound effects (preloaded)
const sounds = {
    roar: new Audio('./assets/sounds/roar.wav'),
    destroy: new Audio('./assets/sounds/destroy.wav')
};

// Safe play function that won't crash if sound file is missing
function playSound(soundName) {
    try {
        const sound = sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            const playPromise = sound.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Audio play error:", error);
                });
            }
        }
    } catch (e) {
        console.log("Could not play sound:", soundName);
    }
}

// Check if the device is mobile
function checkMobile() {
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        document.getElementById('mobile-controls').style.display = 'block';
    }
}

// Initialize the game
function initGame() {
    checkMobile();
    loadHighScore();
    setupEventListeners();
    
    // Start screen is already visible from HTML
    document.getElementById('start-button').addEventListener('click', startGame);
    document.getElementById('restart-button').addEventListener('click', startGame);
}

// Load high score from localStorage
function loadHighScore() {
    const savedHighScore = localStorage.getItem('vibezillaHighScore');
    if (savedHighScore) {
        highScore = parseInt(savedHighScore);
        document.getElementById('high-score').textContent = `High Score: ${highScore}`;
        document.getElementById('final-high-score').textContent = highScore;
    }
}

// Save high score to localStorage
function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('vibezillaHighScore', highScore);
    }
}

// Setup event listeners for keyboard and touch controls
function setupEventListeners() {
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
        updateKeyState(e.key, true);
    });
    
    window.addEventListener('keyup', (e) => {
        updateKeyState(e.key, false);
    });
    
    // Mobile joystick controls
    if (isMobile) {
        const joystickBase = document.getElementById('joystick-base');
        const joystickStick = document.getElementById('joystick-stick');
        const joystickArea = document.getElementById('joystick-area');
        
        joystickArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            joystickActive = true;
            updateJoystickPosition(e);
        });
        
        joystickArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (joystickActive) {
                updateJoystickPosition(e);
            }
        });
        
        joystickArea.addEventListener('touchend', () => {
            joystickActive = false;
            joystickStick.style.transform = 'translate(0px, 0px)';
            joystickPosition = {x: 0, y: 0};
        });
        
        function updateJoystickPosition(e) {
            const touch = e.touches[0];
            const rect = joystickBase.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            let deltaX = touch.clientX - centerX;
            let deltaY = touch.clientY - centerY;
            
            // Limit joystick movement to the base radius
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const maxRadius = rect.width / 2;
            
            if (distance > maxRadius) {
                const ratio = maxRadius / distance;
                deltaX *= ratio;
                deltaY *= ratio;
            }
            
            // Update joystick position
            joystickStick.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            
            // Convert to normalized values (-1 to 1)
            joystickPosition.x = deltaX / maxRadius;
            joystickPosition.y = deltaY / maxRadius;
        }
    }
}

// Update key state based on key press/release
function updateKeyState(key, isPressed) {
    if (!gameActive) return;
    
    switch (key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            keyState.up = isPressed;
            break;
        case 's':
        case 'arrowdown':
            keyState.down = isPressed;
            break;
        case 'a':
        case 'arrowleft':
            keyState.left = isPressed;
            break;
        case 'd':
        case 'arrowright':
            keyState.right = isPressed;
            break;
    }
}

// Start the game
function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    
    // Reset game state
    score = 0;
    destroyedBuildings.clear();
    monsterSpeed = {x: 0, y: 0};
    updateScore();
    
    // Initialize the map
    initMap();
    
    // Create the monster
    createMonster();
    
    // Initialize object pools
    initObjectPools();
    
    // Start game loop
    gameActive = true;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    
    // Play monster roar
    playSound('roar');
}

// Initialize Google Maps
function initMap() {
    // Center map on a city (example: New York City)
    const mapCenter = {lat: 40.7128, lng: -74.0060};
    
    // Map options for a game-like appearance
    const mapOptions = {
        center: mapCenter,
        zoom: 18,
        mapTypeId: 'satellite',
        disableDefaultUI: true,
        gestureHandling: 'none',
        keyboardShortcuts: false,
        styles: [
            // Dark theme
            {elementType: 'geometry', stylers: [{color: '#242f3e'}]},
            {elementType: 'labels.text.stroke', stylers: [{color: '#242f3e'}]},
            {elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
            {
                featureType: 'administrative.locality',
                elementType: 'labels.text.fill',
                stylers: [{color: '#d59563'}]
            },
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{visibility: 'off'}]
            },
            {
                featureType: 'poi.park',
                elementType: 'geometry',
                stylers: [{color: '#263c3f'}]
            },
            {
                featureType: 'road',
                elementType: 'geometry',
                stylers: [{color: '#38414e'}]
            },
            {
                featureType: 'road',
                elementType: 'geometry.stroke',
                stylers: [{color: '#212a37'}]
            },
            {
                featureType: 'road',
                elementType: 'labels.text.fill',
                stylers: [{color: '#9ca5b3'}]
            },
            {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{color: '#17263c'}]
            }
        ]
    };
    
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    
    // Add buildings data (simplified for the game)
    // In a real implementation, you would use the Google Maps data for buildings
    // For this demo, we'll create random building positions within the map view
    createBuildingData();
}

// Create random building data for the game
function createBuildingData() {
    buildings = [];
    const bounds = map.getBounds();
    
    if (!bounds) {
        // If bounds aren't ready yet, try again shortly
        setTimeout(createBuildingData, 100);
        return;
    }
    
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    // Create a grid of buildings
    for (let lat = sw.lat(); lat < ne.lat(); lat += 0.0002) {
        for (let lng = sw.lng(); lng < ne.lng(); lng += 0.0002) {
            // Add some randomness to position
            const jitter = 0.00005;
            const buildingLat = lat + (Math.random() * jitter);
            const buildingLng = lng + (Math.random() * jitter);
            
            // Random building size (affects points)
            const size = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
            
            buildings.push({
                position: new google.maps.LatLng(buildingLat, buildingLng),
                size: size
            });
        }
    }
}

// Create the monster character
function createMonster() {
    const monsterDiv = document.createElement('div');
    monsterDiv.id = 'monster';
    document.getElementById('game-container').appendChild(monsterDiv);
    
    monster = {
        element: monsterDiv,
        position: map.getCenter(),
        size: 60 // px
    };
    
    updateMonsterPosition();
}

// Initialize object pools for performance
function initObjectPools() {
    // Create debris objects
    for (let i = 0; i < maxDebris; i++) {
        const debris = document.createElement('div');
        debris.className = 'debris';
        debris.style.display = 'none';
        document.getElementById('game-container').appendChild(debris);
        debrisPool.push({
            element: debris,
            active: false,
            position: null,
            velocity: {x: 0, y: 0},
            lifetime: 0
        });
    }
    
    // Create rubble objects
    for (let i = 0; i < maxRubble; i++) {
        const rubble = document.createElement('div');
        rubble.className = 'destroyed-building';
        rubble.style.display = 'none';
        document.getElementById('game-container').appendChild(rubble);
        rubblePool.push({
            element: rubble,
            active: false,
            position: null
        });
    }
}

// Main game loop
function gameLoop(timestamp) {
    if (!gameActive) return;
    
    const deltaTime = (timestamp - lastTime) / 1000; // in seconds
    lastTime = timestamp;
    
    updateMonsterMovement(deltaTime);
    checkBuildingCollisions();
    updateDebris(deltaTime);
    
    requestAnimationFrame(gameLoop);
}

// Update monster movement based on controls
function updateMonsterMovement(deltaTime) {
    const acceleration = 200; // pixels per second^2
    const maxSpeed = 150; // pixels per second
    const friction = 0.9; // velocity reduction per second
    
    // Keyboard input
    if (keyState.up) monsterSpeed.y -= acceleration * deltaTime;
    if (keyState.down) monsterSpeed.y += acceleration * deltaTime;
    if (keyState.left) monsterSpeed.x -= acceleration * deltaTime;
    if (keyState.right) monsterSpeed.x += acceleration * deltaTime;
    
    // Joystick input (mobile)
    if (joystickActive) {
        monsterSpeed.x += joystickPosition.x * acceleration * deltaTime;
        monsterSpeed.y += joystickPosition.y * acceleration * deltaTime;
    }
    
    // Apply friction
    monsterSpeed.x *= Math.pow(friction, deltaTime);
    monsterSpeed.y *= Math.pow(friction, deltaTime);
    
    // Limit max speed
    const currentSpeed = Math.sqrt(monsterSpeed.x * monsterSpeed.x + monsterSpeed.y * monsterSpeed.y);
    if (currentSpeed > maxSpeed) {
        const ratio = maxSpeed / currentSpeed;
        monsterSpeed.x *= ratio;
        monsterSpeed.y *= ratio;
    }
    
    // Make sure projection is available
    if (!map || !map.getProjection()) {
        return; // Exit if map or projection not ready
    }
    
    // Update position
    const scale = 1 / Math.pow(2, map.getZoom()) * 256;
    const worldPoint = map.getProjection().fromLatLngToPoint(monster.position);
    
    worldPoint.x += monsterSpeed.x * deltaTime * scale;
    worldPoint.y += monsterSpeed.y * deltaTime * scale;
    
    monster.position = map.getProjection().fromPointToLatLng(worldPoint);
    
    // Keep monster within map bounds
    const bounds = map.getBounds();
    if (!bounds) return; // Exit if bounds not ready
    
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    if (monster.position.lat() > ne.lat()) {
        monster.position = new google.maps.LatLng(ne.lat(), monster.position.lng());
        monsterSpeed.y = 0;
    }
    if (monster.position.lat() < sw.lat()) {
        monster.position = new google.maps.LatLng(sw.lat(), monster.position.lng());
        monsterSpeed.y = 0;
    }
    if (monster.position.lng() > ne.lng()) {
        monster.position = new google.maps.LatLng(monster.position.lat(), ne.lng());
        monsterSpeed.x = 0;
    }
    if (monster.position.lng() < sw.lng()) {
        monster.position = new google.maps.LatLng(monster.position.lat(), sw.lng());
        monsterSpeed.x = 0;
    }
    
    // Update monster visual position
    updateMonsterPosition();
}

// Update the monster's position on screen
function updateMonsterPosition() {
    // Check if map and projection are initialized
    if (!map || !map.getProjection()) {
        // If not ready, try again in a moment
        setTimeout(updateMonsterPosition, 100);
        return;
    }
    
    try {
        const projection = map.getProjection();
        const point = projection.fromLatLngToPoint(monster.position);
        const scale = 1 << map.getZoom();
        
        const pixelPoint = new google.maps.Point(
            point.x * scale,
            point.y * scale
        );
        
        const mapDiv = map.getDiv();
        const mapRect = mapDiv.getBoundingClientRect();
        
        const x = pixelPoint.x - mapRect.left - monster.size / 2;
        const y = pixelPoint.y - mapRect.top - monster.size / 2;
        
        monster.element.style.left = `${x}px`;
        monster.element.style.top = `${y}px`;
        
        // Add a slight rotation based on movement direction
        const angle = Math.atan2(monsterSpeed.y, monsterSpeed.x) * 180 / Math.PI;
        if (Math.abs(monsterSpeed.x) > 5 || Math.abs(monsterSpeed.y) > 5) {
            monster.element.style.transform = `rotate(${angle}deg)`;
        }
    } catch (error) {
        console.log("Error updating monster position:", error);
    }
}

// Check for collisions with buildings
function checkBuildingCollisions() {
    const monsterPixelPosition = getScreenPosition(monster.position);
    
    buildings.forEach((building, index) => {
        // Skip already destroyed buildings
        if (destroyedBuildings.has(index)) return;
        
        const buildingPixelPosition = getScreenPosition(building.position);
        
        // Calculate distance
        const dx = monsterPixelPosition.x - buildingPixelPosition.x;
        const dy = monsterPixelPosition.y - buildingPixelPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if monster is close enough to destroy building
        if (distance < destructionRadius) {
            destroyBuilding(building, index, buildingPixelPosition);
        }
    });
}

// Get pixel position from LatLng
function getScreenPosition(latLng) {
    const projection = map.getProjection();
    if (!projection) return {x: 0, y: 0};
    
    const point = projection.fromLatLngToPoint(latLng);
    const scale = 1 << map.getZoom();
    
    const pixelPoint = new google.maps.Point(
        point.x * scale,
        point.y * scale
    );
    
    const mapDiv = map.getDiv();
    const mapRect = mapDiv.getBoundingClientRect();
    
    return {
        x: pixelPoint.x - mapRect.left,
        y: pixelPoint.y - mapRect.top
    };
}

// Destroy a building and create effects
function destroyBuilding(building, index, position) {
    // Mark as destroyed
    destroyedBuildings.add(index);
    
    // Add points based on building size
    const points = building.size * 100;
    score += points;
    updateScore();
    
    // Play destruction sound
    playSound('destroy');
    
    // Create rubble
    createRubble(position);
    
    // Create debris particles
    for (let i = 0; i < 5 + building.size * 2; i++) {
        createDebris(position);
    }
    
    // Check if game should end (all buildings destroyed)
    if (destroyedBuildings.size >= buildings.length * 0.8) {
        endGame();
    }
}

// Create rubble at the given position
function createRubble(position) {
    // Find an inactive rubble from the pool
    const rubble = rubblePool.find(r => !r.active);
    if (!rubble) return;
    
    // Activate and position the rubble
    rubble.active = true;
    rubble.position = position;
    rubble.element.style.display = 'block';
    rubble.element.style.left = `${position.x - 15}px`;
    rubble.element.style.top = `${position.y - 15}px`;
}

// Create debris particle at the given position
function createDebris(position) {
    // Find an inactive debris from the pool
    const debris = debrisPool.find(d => !d.active);
    if (!debris) return;
    
    // Activate and position the debris
    debris.active = true;
    debris.position = {x: position.x, y: position.y};
    debris.velocity = {
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100 - 50 // Add upward bias
    };
    debris.lifetime = 1 + Math.random(); // 1-2 seconds
    
    debris.element.style.display = 'block';
    debris.element.style.left = `${position.x - 10}px`;
    debris.element.style.top = `${position.y - 10}px`;
}

// Update debris positions and lifetimes
function updateDebris(deltaTime) {
    debrisPool.forEach(debris => {
        if (!debris.active) return;
        
        // Update lifetime
        debris.lifetime -= deltaTime;
        if (debris.lifetime <= 0) {
            // Deactivate
            debris.active = false;
            debris.element.style.display = 'none';
            return;
        }
        
        // Update position
        debris.position.x += debris.velocity.x * deltaTime;
        debris.position.y += debris.velocity.y * deltaTime;
        
        // Apply gravity
        debris.velocity.y += 200 * deltaTime;
        
        // Update visual position
        debris.element.style.left = `${debris.position.x - 10}px`;
        debris.element.style.top = `${debris.position.y - 10}px`;
        
        // Fade out
        debris.element.style.opacity = debris.lifetime;
    });
}

// Update the score display
function updateScore() {
    document.getElementById('score').textContent = `Score: ${score}`;
}

// End the game
function endGame() {
    gameActive = false;
    
    // Update high score
    saveHighScore();
    
    // Show game over screen
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-high-score').textContent = highScore;
    document.getElementById('game-over-screen').classList.remove('hidden');
}

// Window load event to start initialization
window.onload = function() {
    // If Google Maps API is already loaded, initialize game
    if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
        initGame();
    }
    // Otherwise, the callback in the script tag will handle initialization
};