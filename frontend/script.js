// DOM Elements
const passwordDisplay = document.getElementById('passwordDisplay');
const clearPasswordBtn = document.getElementById('clearPassword');
const deleteLastBtn = document.getElementById('deleteLast');
const signInForm = document.getElementById('signInForm');
const skipSignInLink = document.getElementById('skipSignIn');
const emojiGrid = document.getElementById('emojiGrid');
const shuffledEmojis = document.getElementById('shuffledEmojis');
const nextStepBtn = document.getElementById('nextStep');
const backStepBtn = document.getElementById('backStep');
const step1Container = document.getElementById('step1');
const step2Container = document.getElementById('step2');
const numberInput = document.getElementById('numberInput');
const step1Indicator = document.getElementById('step1Indicator');
const step2Indicator = document.getElementById('step2Indicator');
const stepConnector = document.getElementById('stepConnector');

// Input method elements
const keyboardMethodBtn = document.getElementById('keyboardMethod');
const cameraMethodBtn = document.getElementById('cameraMethod');
const keyboardInputMethod = document.getElementById('keyboardInputMethod');
const handDetectionMethod = document.getElementById('handDetectionMethod');
const virtualKeyboard = document.getElementById('virtualKeyboard');

// Hand detection elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const detectedNumberElement = document.getElementById('detectedNumber');
const confidenceElement = document.getElementById('confidence');
const confidenceBarElement = document.getElementById('confidence-bar');
const startDetectionBtn = document.getElementById('startDetectionBtn');
const stopDetectionBtn = document.getElementById('stopDetectionBtn');
const addNumberBtn = document.getElementById('addNumberBtn');
const detectionStatusElement = document.getElementById('detectionStatus');
const showHandSignsBtn = document.getElementById('showHandSignsBtn');

// Detected numbers display elements
const detectedNumbersDisplay = document.getElementById('detectedNumbersDisplay');
const clearDetectedBtn = document.getElementById('clearDetectedBtn');
const clearLastDetectedBtn = document.getElementById('clearLastDetectedBtn');

// Threshold timer elements
const timerText = document.getElementById('timerText');
const timerBar = document.getElementById('timerBar');

// Available emojis - 10 unique popular emojis
const availableEmojis = [
    '😀', '😎', '🥰', '😂', '🤣', 
    '😍', '🤩', '😜', '🤔', '👍'
];

// Password state
let emojiPassword = '';
let shuffledEmojiMap = {}; // Maps emoji to number in shuffled list
let shuffledEmojisArray = []; // Stores the shuffled array of emojis

// Hand detection variables
let hands;
let camera;
let isDetecting = false;
let detectionHistory = [];
let lastDetectedNumber = null;
let confidence = 0;
let frameCount = 0;
let lastFrameTime = 0;
const fps = 15; // Target FPS for detection
const frameInterval = 1000 / fps;

// Detected numbers array
let detectedNumbers = [];

// Threshold timer variables
let thresholdTimer = null;
let thresholdStartTime = null;
const thresholdDuration = 3000; // 3 seconds in milliseconds
let currentThresholdNumber = null;

// Hand landmarks mapping
const fingerJoints = {
    thumb: [0, 1, 2, 3, 4],
    indexFinger: [0, 5, 6, 7, 8],
    middleFinger: [0, 9, 10, 11, 12],
    ringFinger: [0, 13, 14, 15, 16],
    pinky: [0, 17, 18, 19, 20]
};

// Number patterns for detection (thumb, index, middle, ring, pinky)
const numberPatterns = {
    0: [0, 0, 0, 0, 0],  // Fist
    1: [0, 1, 0, 0, 0],  // Index finger
    2: [0, 1, 1, 0, 0],  // Index and middle
    3: [0, 1, 1, 1, 0],  // Index, middle, ring
    4: [0, 1, 1, 1, 1],  // All except thumb
    5: [1, 1, 1, 1, 1],  // All fingers
    6: [1, 0, 0, 0, 0],  // Thumbs up (only thumb extended)
    7: [1, 1, 0, 0, 0],  // Thumb and index finger
    8: [1, 1, 1, 0, 0],  // Thumb, index, and middle finger
    9: [1, 0, 0, 0, 1]   // Thumb and pinky
};

// Backend API URL - Replace with your deployed backend URL
const API_URL = 'https://your-backend-url.onrender.com/api';

// Initialize emoji grid
function initializeEmojiGrid() {
    emojiGrid.innerHTML = '';
    availableEmojis.forEach(emoji => {
        const emojiItem = document.createElement('div');
        emojiItem.className = 'emoji-item';
        emojiItem.textContent = emoji;
        emojiItem.addEventListener('click', () => addEmojiToPassword(emoji));
        emojiGrid.appendChild(emojiItem);
    });
}

// Initialize virtual keyboard
function initializeVirtualKeyboard() {
    virtualKeyboard.innerHTML = '';
    
    // Create number keys 0-9
    for (let i = 0; i <= 9; i++) {
        const key = document.createElement('div');
        key.className = 'key';
        key.textContent = i;
        key.addEventListener('click', () => addNumberToInput(i));
        virtualKeyboard.appendChild(key);
    }
    
    // Add space key
    const spaceKey = document.createElement('div');
    spaceKey.className = 'key';
    spaceKey.textContent = 'Space';
    spaceKey.style.gridColumn = 'span 2';
    spaceKey.addEventListener('click', () => addSpaceToInput());
    virtualKeyboard.appendChild(spaceKey);
    
    // Add backspace key
    const backspaceKey = document.createElement('div');
    backspaceKey.className = 'key';
    backspaceKey.textContent = '⌫';
    backspaceKey.style.gridColumn = 'span 2';
    backspaceKey.addEventListener('click', () => deleteLastFromInput());
    virtualKeyboard.appendChild(backspaceKey);
    
    // Add clear key
    const clearKey = document.createElement('div');
    clearKey.className = 'key';
    clearKey.textContent = 'Clear';
    clearKey.style.gridColumn = 'span 1';
    clearKey.addEventListener('click', () => clearInput());
    virtualKeyboard.appendChild(clearKey);
}

// Add number to input
function addNumberToInput(number) {
    const currentValue = numberInput.value.trim();
    if (currentValue) {
        numberInput.value = currentValue + ' ' + number;
    } else {
        numberInput.value = number.toString();
    }
}

// Add space to input
function addSpaceToInput() {
    const currentValue = numberInput.value.trim();
    if (currentValue && !currentValue.endsWith(' ')) {
        numberInput.value = currentValue + ' ';
    }
}

// Delete last character from input
function deleteLastFromInput() {
    const currentValue = numberInput.value.trim();
    if (currentValue) {
        // Find the last space and remove everything after it
        const lastSpaceIndex = currentValue.lastIndexOf(' ');
        if (lastSpaceIndex !== -1) {
            numberInput.value = currentValue.substring(0, lastSpaceIndex);
        } else {
            numberInput.value = '';
        }
    }
}

// Clear input
function clearInput() {
    numberInput.value = '';
}

// Add emoji to password
function addEmojiToPassword(emoji) {
    emojiPassword += emoji;
    updatePasswordDisplay();
    
    // Add success animation
    passwordDisplay.classList.add('success-animation');
    setTimeout(() => {
        passwordDisplay.classList.remove('success-animation');
    }, 500);
}

// Update password display
function updatePasswordDisplay() {
    if (emojiPassword) {
        passwordDisplay.textContent = emojiPassword;
    } else {
        passwordDisplay.textContent = '🔒';
    }
}

// Clear password
function clearPassword() {
    emojiPassword = '';
    updatePasswordDisplay();
}

// Delete last emoji from password
function deleteLastEmoji() {
    if (emojiPassword.length > 0) {
        // Remove the last emoji (might be 1 or 2 characters)
        if (emojiPassword.length >= 2 && emojiPassword.charCodeAt(emojiPassword.length - 2) >= 0xD800 && emojiPassword.charCodeAt(emojiPassword.length - 2) <= 0xDBFF) {
            // It's a surrogate pair (2 characters)
            emojiPassword = emojiPassword.substring(0, emojiPassword.length - 2);
        } else {
            // It's a single character
            emojiPassword = emojiPassword.substring(0, emojiPassword.length - 1);
        }
        updatePasswordDisplay();
    }
}

// Shuffle emojis and create mapping
function shuffleEmojis() {
    // Create a copy of available emojis and shuffle it
    const shuffled = [...availableEmojis].sort(() => Math.random() - 0.5);
    shuffledEmojisArray = shuffled; // Store the shuffled array
    
    // Create mapping from emoji to number (0-based index)
    shuffledEmojiMap = {};
    shuffled.forEach((emoji, index) => {
        shuffledEmojiMap[emoji] = index;
    });
    
    // Display shuffled emojis with numbers
    shuffledEmojis.innerHTML = '';
    shuffled.forEach(emoji => {
        const shuffledItem = document.createElement('div');
        shuffledItem.className = 'shuffled-item';
        
        const numberDiv = document.createElement('div');
        numberDiv.className = 'shuffled-number';
        numberDiv.textContent = shuffledEmojiMap[emoji];
        
        const emojiDiv = document.createElement('div');
        emojiDiv.className = 'shuffled-emoji';
        emojiDiv.textContent = emoji;
        
        shuffledItem.appendChild(numberDiv);
        shuffledItem.appendChild(emojiDiv);
        shuffledEmojis.appendChild(shuffledItem);
    });
}

// Move to step 2
function goToStep2() {
    if (!emojiPassword) {
        alert('Please select at least one emoji for your password');
        return;
    }
    
    // Shuffle emojis and create mapping
    shuffleEmojis();
    
    // Update UI
    step1Container.style.display = 'none';
    step2Container.style.display = 'block';
    
    // Update step indicators
    step1Indicator.classList.remove('active');
    step1Indicator.classList.add('completed');
    step2Indicator.classList.add('active');
    stepConnector.classList.add('completed');
    
    // Clear previous input
    numberInput.value = '';
    numberInput.focus();
    
    // Clear detected numbers
    detectedNumbers = [];
    updateDetectedNumbersDisplay();
    
    // Initialize virtual keyboard
    initializeVirtualKeyboard();
    
    // Initialize hand detection
    initializeHandDetection();
}

// Go back to step 1
function goToStep1() {
    // Stop hand detection if active
    if (isDetecting) {
        stopHandDetection();
    }
    
    // Update UI
    step1Container.style.display = 'block';
    step2Container.style.display = 'none';
    
    // Update step indicators
    step1Indicator.classList.add('active');
    step1Indicator.classList.remove('completed');
    step2Indicator.classList.remove('active');
    stepConnector.classList.remove('completed');
}

// Switch to keyboard input method
function switchToKeyboardMethod() {
    keyboardMethodBtn.classList.add('active');
    cameraMethodBtn.classList.remove('active');
    keyboardInputMethod.style.display = 'block';
    handDetectionMethod.classList.remove('active');
    
    // Stop hand detection if active
    if (isDetecting) {
        stopHandDetection();
    }
}

// Switch to camera input method
function switchToCameraMethod() {
    cameraMethodBtn.classList.add('active');
    keyboardMethodBtn.classList.remove('active');
    keyboardInputMethod.style.display = 'none';
    handDetectionMethod.classList.add('active');
}

// Initialize hand detection
function initializeHandDetection() {
    // Check if MediaPipe Hands is available
    if (typeof Hands === 'undefined') {
        detectionStatusElement.innerHTML = "MediaPipe Hands library not loaded. Please refresh the page.";
        detectionStatusElement.className = "detection-status error";
        return;
    }
    
    try {
        hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });
        
        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        hands.onResults(onHandDetectionResults);
        
        detectionStatusElement.innerHTML = "Hand detection model loaded successfully!";
        detectionStatusElement.className = "detection-status ready";
        startDetectionBtn.disabled = false;
    } catch (error) {
        detectionStatusElement.innerHTML = "Error loading hand detection model. Please refresh the page.";
        detectionStatusElement.className = "detection-status error";
        console.error("Error initializing hands:", error);
    }
}

// Start threshold timer
function startThresholdTimer(number) {
    // Clear any existing timer
    if (thresholdTimer) {
        clearInterval(thresholdTimer);
    }
    
    currentThresholdNumber = number;
    thresholdStartTime = Date.now();
    
    // Update timer display
    thresholdTimer = setInterval(updateThresholdTimer, 100);
}

// Stop threshold timer
function stopThresholdTimer() {
    if (thresholdTimer) {
        clearInterval(thresholdTimer);
        thresholdTimer = null;
    }
    
    currentThresholdNumber = null;
    timerText.textContent = '3.0s';
    timerBar.style.width = '0%';
}

// Update threshold timer display
function updateThresholdTimer() {
    if (!currentThresholdNumber) return;
    
    const elapsed = Date.now() - thresholdStartTime;
    const remaining = Math.max(0, thresholdDuration - elapsed);
    const seconds = (remaining / 1000).toFixed(1);
    
    timerText.textContent = `${seconds}s`;
    timerBar.style.width = `${((thresholdDuration - remaining) / thresholdDuration) * 100}%`;
    
    // If threshold reached, add the number
    if (remaining <= 0) {
        stopThresholdTimer();
        autoAddDetectedNumber(currentThresholdNumber);
    }
}

// Auto-add detected number when threshold is reached
function autoAddDetectedNumber(number) {
    // Add to detected numbers display
    detectedNumbers.push(number);
    updateDetectedNumbersDisplay();
    
    // Add to input field
    const currentValue = numberInput.value.trim();
    if (currentValue) {
        numberInput.value = currentValue + ' ' + number;
    } else {
        numberInput.value = number.toString();
    }
    
    // Show visual feedback
    detectedNumberElement.style.transform = 'scale(1.3)';
    detectedNumberElement.style.color = '#2ECC71';
    setTimeout(() => {
        detectedNumberElement.style.transform = 'scale(1)';
        detectedNumberElement.style.color = '#4fc3f7';
    }, 500);
    
    // Reset detection for next number
    lastDetectedNumber = null;
    detectedNumberElement.textContent = '-';
    addNumberBtn.disabled = true;
}

// Process hand detection results
function onHandDetectionResults(results) {
    // Skip processing if we're not detecting or if we're throttling frames
    if (!isDetecting) return;
    
    const now = Date.now();
    if (now - lastFrameTime < frameInterval) return;
    lastFrameTime = now;
    
    // Clear canvas
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw video frame
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        // Draw hand landmarks
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 2});
            drawLandmarks(ctx, landmarks, {color: '#FF0000', lineWidth: 1, radius: 3});
        }
        
        // Get the first detected hand
        const landmarks = results.multiHandLandmarks[0];
        
        // Detect the number
        const detectedNumber = detectNumber(landmarks);
        
        // Update detection history
        detectionHistory.push(detectedNumber);
        if (detectionHistory.length > 10) {
            detectionHistory.shift();
        }
        
        // Calculate confidence based on consistency
        const counts = {};
        detectionHistory.forEach(num => {
            counts[num] = (counts[num] || 0) + 1;
        });
        
        const mostCommon = Object.keys(counts).reduce((a, b) => 
            counts[a] > counts[b] ? a : b, Object.keys(counts)[0]);
        
        confidence = Math.min(100, Math.round((counts[mostCommon] / detectionHistory.length) * 100));
        
        // Only update the displayed number if confidence is high enough
        if (confidence > 70 && mostCommon !== lastDetectedNumber) {
            lastDetectedNumber = mostCommon;
            detectedNumberElement.textContent = mostCommon;
            detectedNumberElement.style.transform = 'scale(1.2)';
            setTimeout(() => {
                detectedNumberElement.style.transform = 'scale(1)';
            }, 300);
            
            // Enable add number button if we have a valid number
            if (mostCommon !== '?') {
                addNumberBtn.disabled = false;
                
                // Start threshold timer for auto-adding
                startThresholdTimer(mostCommon);
            }
        } else if (confidence > 70 && mostCommon === lastDetectedNumber) {
            // Continue with current threshold timer
            // The timer is already running, no action needed
        } else {
            // Number changed or confidence dropped, stop timer
            stopThresholdTimer();
        }
        
        // Update confidence display
        confidenceElement.textContent = confidence;
        confidenceBarElement.style.width = `${confidence}%`;
    } else {
        // No hand detected
        detectionHistory = [];
        confidence = 0;
        confidenceElement.textContent = '0';
        confidenceBarElement.style.width = '0%';
        addNumberBtn.disabled = true;
        
        // Stop threshold timer
        stopThresholdTimer();
        
        if (lastDetectedNumber !== null) {
            lastDetectedNumber = null;
            detectedNumberElement.textContent = '-';
        }
    }
    
    ctx.restore();
}

// Detect number based on hand landmarks
function detectNumber(landmarks) {
    // Get finger states (extended or not)
    const fingers = getFingerStates(landmarks);
    
    // Convert to pattern array
    const pattern = [
        fingers.thumb ? 1 : 0,
        fingers.indexFinger ? 1 : 0,
        fingers.middleFinger ? 1 : 0,
        fingers.ringFinger ? 1 : 0,
        fingers.pinky ? 1 : 0
    ];
    
    // Find the best matching number pattern
    let bestMatch = '?';
    let minDistance = Infinity;
    
    for (const [number, targetPattern] of Object.entries(numberPatterns)) {
        const distance = hammingDistance(pattern, targetPattern);
        if (distance < minDistance) {
            minDistance = distance;
            bestMatch = number;
        }
    }
    
    // Only return the match if it's close enough
    return minDistance <= 1 ? bestMatch : '?';
}

// Calculate Hamming distance between two arrays
function hammingDistance(a, b) {
    if (a.length !== b.length) return Infinity;
    return a.reduce((dist, val, i) => dist + (val !== b[i] ? 1 : 0), 0);
}

// Determine if fingers are extended
function getFingerStates(landmarks) {
    const states = {};
    
    // Thumb - special case (check x direction)
    const thumbTip = landmarks[4];
    const thumbIP = landmarks[3];
    const thumbMCP = landmarks[2];
    const thumbWrist = landmarks[0];
    
    // Check if thumb is extended (horizontal distance)
    states.thumb = Math.abs(thumbTip.x - thumbWrist.x) > Math.abs(thumbIP.x - thumbMCP.x);
    
    // Other fingers - check if tip is above middle joint
    for (const finger in fingerJoints) {
        if (finger === 'thumb') continue;
        
        const joints = fingerJoints[finger];
        const tip = landmarks[joints[4]];
        const middle = landmarks[joints[2]];
        
        states[finger] = tip.y < middle.y;  // Tip is above middle joint (y increases downward)
    }
    
    return states;
}

// Start hand detection
function startHandDetection() {
    if (isDetecting) return;
    
    isDetecting = true;
    startDetectionBtn.disabled = true;
    stopDetectionBtn.disabled = false;
    
    // Initialize camera
    camera = new Camera(video, {
        onFrame: async () => {
            if (isDetecting) {
                await hands.send({image: video});
            }
        },
        width: 320,
        height: 240
    });
    
    camera.start().catch(err => {
        console.error("Error starting camera:", err);
        detectionStatusElement.innerHTML = "Error accessing camera. Please check permissions.";
        detectionStatusElement.className = "detection-status error";
        stopHandDetection();
    });
}

// Stop hand detection
function stopHandDetection() {
    if (!isDetecting) return;
    
    isDetecting = false;
    startDetectionBtn.disabled = false;
    stopDetectionBtn.disabled = true;
    
    if (camera) {
        camera.stop();
    }
    
    // Stop threshold timer
    stopThresholdTimer();
    
    // Clear detection history
    detectionHistory = [];
    confidence = 0;
    confidenceElement.textContent = '0';
    confidenceBarElement.style.width = '0%';
    
    if (lastDetectedNumber !== null) {
        lastDetectedNumber = null;
        detectedNumberElement.textContent = '-';
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Add detected number to input and display box
function addDetectedNumber() {
    if (lastDetectedNumber && lastDetectedNumber !== '?') {
        // Stop threshold timer
        stopThresholdTimer();
        
        // Add to detected numbers display
        detectedNumbers.push(lastDetectedNumber);
        updateDetectedNumbersDisplay();
        
        // Add to input field
        const currentValue = numberInput.value.trim();
        if (currentValue) {
            numberInput.value = currentValue + ' ' + lastDetectedNumber;
        } else {
            numberInput.value = lastDetectedNumber.toString();
        }
        
        // Show visual feedback
        detectedNumberElement.style.transform = 'scale(1.3)';
        detectedNumberElement.style.color = '#2ECC71';
        setTimeout(() => {
            detectedNumberElement.style.transform = 'scale(1)';
            detectedNumberElement.style.color = '#4fc3f7';
        }, 500);
        
        // Reset detection for next number
        lastDetectedNumber = null;
        detectedNumberElement.textContent = '-';
    }
}

// Update detected numbers display
function updateDetectedNumbersDisplay() {
    detectedNumbersDisplay.innerHTML = '';
    
    if (detectedNumbers.length === 0) {
        detectedNumbersDisplay.innerHTML = '<span style="color: #7F8C8D;">No numbers detected yet</span>';
        clearLastDetectedBtn.disabled = true;
    } else {
        detectedNumbers.forEach(number => {
            const numberItem = document.createElement('span');
            numberItem.className = 'detected-number-item';
            numberItem.textContent = number;
            detectedNumbersDisplay.appendChild(numberItem);
        });
        clearLastDetectedBtn.disabled = false;
    }
}

// Clear last detected number
function clearLastDetectedNumber() {
    if (detectedNumbers.length > 0) {
        // Remove last number from detected numbers array
        const lastNumber = detectedNumbers.pop();
        updateDetectedNumbersDisplay();
        
        // Remove last number from input field
        const inputValue = numberInput.value.trim();
        const numbers = inputValue.split(' ');
        numbers.pop(); // Remove last number
        numberInput.value = numbers.join(' ');
        
        // Show visual feedback
        detectedNumberElement.style.transform = 'scale(1.2)';
        detectedNumberElement.style.color = '#E74C3C';
        detectedNumberElement.textContent = 'Removed';
        setTimeout(() => {
            detectedNumberElement.style.transform = 'scale(1)';
            detectedNumberElement.style.color = '#4fc3f7';
            detectedNumberElement.textContent = '-';
        }, 500);
    }
}

// Clear all detected numbers
function clearDetectedNumbers() {
    detectedNumbers = [];
    updateDetectedNumbersDisplay();
    numberInput.value = '';
}

// Show hand signs reference
function showHandSignsReference() {
    alert('Hand Signs Reference:\n\n0: Closed fist\n1: Index finger extended\n2: Index and middle finger extended\n3: Index, middle, ring finger extended\n4: All fingers except thumb extended\n5: All fingers extended\n6: Thumbs up\n7: Thumb and index finger\n8: Thumb, index and middle finger\n9: Thumb and pinky');
}

// Set canvas dimensions to match video
function setupCanvas() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
}

// Validate and submit form
async function validateAndSubmit(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const numbersInput = numberInput.value.trim();
    
    if (!username) {
        alert('Please enter a username');
        return;
    }
    
    if (!emojiPassword) {
        alert('Please create a password');
        return;
    }
    
    if (!numbersInput) {
        alert('Please enter the numbers for your password');
        return;
    }
    
    // Parse numbers input
    const numbers = numbersInput.split(/\s+/).map(num => parseInt(num));
    
    // Check if any number is invalid
    if (numbers.some(isNaN)) {
        alert('Please enter valid numbers separated by spaces');
        return;
    }
    
    // Check if any number is out of bounds
    if (numbers.some(num => num < 0 || num >= shuffledEmojisArray.length)) {
        alert(`Please enter valid numbers (0 to ${shuffledEmojisArray.length - 1})`);
        return;
    }
    
    // Convert numbers back to emojis using the shuffled array
    const reconstructedPassword = numbers.map(num => shuffledEmojisArray[num]).join('');
    
    // Check if reconstructed password matches original
    if (reconstructedPassword === emojiPassword) {
        try {
            // Send data to backend
            const response = await fetch(`${API_URL}/auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    emojiPassword: emojiPassword
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert(`Sign In Successful! Welcome, ${username}!\nYour emoji password: ${emojiPassword}\n\n${data.message}`);
                
                // Store token in localStorage for future authenticated requests
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
                
                // In a real app, you would redirect to the main application
                // window.location.href = '/dashboard';
            } else {
                alert(`Authentication failed. ${data.message}`);
            }
        } catch (error) {
            console.error('Error saving data:', error);
            alert(`An error occurred while saving your data: ${error.message}`);
        }
    } else {
        alert('Authentication failed. The numbers you entered do not match your password.');
    }
}

// Event Listeners
clearPasswordBtn.addEventListener('click', clearPassword);
deleteLastBtn.addEventListener('click', deleteLastEmoji);
nextStepBtn.addEventListener('click', goToStep2);
backStepBtn.addEventListener('click', goToStep1);
keyboardMethodBtn.addEventListener('click', switchToKeyboardMethod);
cameraMethodBtn.addEventListener('click', switchToCameraMethod);
signInForm.addEventListener('submit', validateAndSubmit);

// Hand detection event listeners
startDetectionBtn.addEventListener('click', startHandDetection);
stopDetectionBtn.addEventListener('click', stopHandDetection);
addNumberBtn.addEventListener('click', addDetectedNumber);
showHandSignsBtn.addEventListener('click', showHandSignsReference);
clearDetectedBtn.addEventListener('click', clearDetectedNumbers);
clearLastDetectedBtn.addEventListener('click', clearLastDetectedNumber);
video.addEventListener('loadedmetadata', setupCanvas);

skipSignInLink.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Skipping sign in. Welcome to the demo!');
    // In a real app, you would redirect to the main application
});

// Initialize the app
window.addEventListener('load', () => {
    initializeEmojiGrid();
    
    // Pre-initialize MediaPipe Hands to ensure it's loaded
    if (typeof Hands !== 'undefined') {
        // Create a dummy instance to preload the model
        const dummyHands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });
        
        dummyHands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        // We don't need to set up results for the dummy instance
        // This just ensures the model is loaded and ready
    }
    
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
        // Verify token with backend
        fetch(`${API_URL}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // User is authenticated, redirect to dashboard
                // window.location.href = '/dashboard';
                alert(`Welcome back, ${data.user.username}!`);
            } else {
                // Token is invalid, remove it
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
            }
        })
        .catch(error => {
            console.error('Error verifying token:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
        });
    }
});