// Configuration
const CONFIG = {
    speechRate: 1,
    speechVolume: 1,
    speechPitch: 1,
    defaultUserName: 'Rohit',
    greetings: {
        morning: { start: 0, end: 12, message: 'Good Morning!' },
        afternoon: { start: 12, end: 17, message: 'Good Afternoon!' },
        evening: { start: 17, end: 24, message: 'Good Evening!' }
    }
};

// DOM Elements
const elements = {
    btn: document.querySelector('.talk'),
    content: document.querySelector('.content'),
    statusIndicator: document.querySelector('.status-indicator'),
    responseText: document.getElementById('responseText'),
    responseContainer: document.getElementById('responseContainer')
};

// State Management
const state = {
    userName: CONFIG.defaultUserName,
    isListening: false,
    isSpeaking: false
};

// Utilities
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

// Speech Synthesis with queue management
class SpeechManager {
    constructor() {
        this.queue = [];
        this.isSpeaking = false;
    }

    speak(text) {
        return new Promise((resolve, reject) => {
            if (!text || typeof text !== 'string') {
                reject(new Error('Invalid text input'));
                return;
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = CONFIG.speechRate;
            utterance.volume = CONFIG.speechVolume;
            utterance.pitch = CONFIG.speechPitch;

            utterance.onstart = () => {
                state.isSpeaking = true;
                updateUI('speaking');
            };

            utterance.onend = () => {
                state.isSpeaking = false;
                updateUI('idle');
                resolve();
            };

            utterance.onerror = (error) => {
                state.isSpeaking = false;
                updateUI('error');
                console.error('Speech synthesis error:', error);
                reject(error);
            };

            window.speechSynthesis.speak(utterance);
        });
    }

    cancel() {
        window.speechSynthesis.cancel();
        state.isSpeaking = false;
    }
}

const speechManager = new SpeechManager();

// UI Update Functions
function updateUI(status) {
    const statusMessages = {
        idle: 'Click to speak',
        listening: 'Listening...',
        speaking: 'Speaking...',
        processing: 'Processing...',
        error: 'Error occurred'
    };

    elements.content.textContent = statusMessages[status] || statusMessages.idle;
    
    if (elements.statusIndicator) {
        elements.statusIndicator.className = `status-indicator ${status}`;
    }

    // Update button visual state
    elements.btn.classList.toggle('active', status === 'listening');
}

function displayResponse(userCommand, assistantResponse, link = null) {
    if (elements.responseText) {
        let html = `<p class="response-text user-command">"${userCommand}"</p>`;
        html += `<p class="response-text assistant-response">${assistantResponse}</p>`;
        
        if (link) {
            html += `<a href="${link}" target="_blank" class="response-link">
                        Open Link <i class="fas fa-external-link-alt"></i>
                     </a>`;
        }
        
        elements.responseText.innerHTML = html;
        
        // Animate container
        if (elements.responseContainer) {
            elements.responseContainer.style.animation = 'none';
            setTimeout(() => {
                elements.responseContainer.style.animation = 'slideIn 0.5s ease-out';
            }, 10);
        }
    }
}

// Greeting based on time
function getGreeting() {
    const hour = new Date().getHours();
    
    for (const [key, { start, end, message }] of Object.entries(CONFIG.greetings)) {
        if (hour >= start && hour < end) {
            return message;
        }
    }
    
    return CONFIG.greetings.evening.message;
}

async function wishMe() {
    const greeting = getGreeting();
    await speechManager.speak(`${greeting} I'm JARVIS, your virtual assistant. How may I help you?`);
}

// Initialize on page load
window.addEventListener('load', async () => {
    try {
        updateUI('idle');
        await wishMe();
    } catch (error) {
        console.error('Initialization error:', error);
        updateUI('error');
    }
});

// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    console.error('Speech Recognition API not supported');
    elements.content.textContent = 'Speech recognition not supported in this browser';
} else {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        state.isListening = true;
        updateUI('listening');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[event.resultIndex][0].transcript;
        const confidence = event.results[event.resultIndex][0].confidence;
        
        console.log(`Recognized: "${transcript}" (confidence: ${confidence.toFixed(2)})`);
        
        elements.content.textContent = transcript;
        updateUI('processing');
        
        processCommand(transcript.toLowerCase(), transcript);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        state.isListening = false;
        
        const errorMessages = {
            'no-speech': 'No speech detected. Please try again.',
            'audio-capture': 'No microphone detected.',
            'not-allowed': 'Microphone permission denied.',
            'network': 'Network error occurred.'
        };
        
        elements.content.textContent = errorMessages[event.error] || 'An error occurred. Please try again.';
        updateUI('error');
        
        setTimeout(() => updateUI('idle'), 3000);
    };

    recognition.onend = () => {
        state.isListening = false;
        if (!state.isSpeaking) {
            setTimeout(() => updateUI('idle'), 1000);
        }
    };

    // Button click handler with debounce
    const handleClick = debounce(() => {
        if (state.isListening) return;
        
        try {
            recognition.start();
        } catch (error) {
            console.error('Failed to start recognition:', error);
            updateUI('error');
        }
    }, 300);

    elements.btn.addEventListener('click', handleClick);
}

// Command Processing
const commands = {
    greetings: {
        patterns: ['hey', 'hello', 'hi'],
        handler: (message, original) => {
            const response = 'Hello! How may I help you today?';
            displayResponse(original, response);
            return speechManager.speak(response);
        }
    },
    identity: {
        patterns: ['who are you', 'what are you', 'who you are'],
        handler: (message, original) => {
            const response = 'I am JARVIS, your virtual assistant version 2.0. I can help you open websites, tell the time, search the web, and much more. Just ask!';
            displayResponse(original, response);
            return speechManager.speak(response);
        }
    },
    userName: {
        patterns: ['what is my name', 'my name'],
        handler: (message, original) => {
            const response = `Your name is ${state.userName}`;
            displayResponse(original, response);
            return speechManager.speak(response);
        }
    },
    creator: {
        patterns: ['who is your creator', 'who created you', 'who made you', 'who built you', 'who is your god', 'who designed you', 'who developed you', 'who is your master', 'who is your owner'],
        handler: (message, original) => {
            const response = `I was created by Rohit Singh, a talented developer and innovator. You can check out his amazing work!`;
            const portfolioLink = 'https://portfolio-qiyh.vercel.app/';
            displayResponse(original, response, portfolioLink);
            return speechManager.speak(response);
        }
    },
    websites: {
        patterns: [
            { match: 'open google', url: 'https://google.com', name: 'Google' },
            { match: 'open youtube', url: 'https://youtube.com', name: 'YouTube' },
            { match: 'open facebook', url: 'https://facebook.com', name: 'Facebook' },
            { match: 'open github', url: 'https://github.com', name: 'GitHub' },
            { match: 'open twitter', url: 'https://twitter.com', name: 'Twitter' }
        ],
        handler: (pattern, original) => {
            const response = `Opening ${pattern.name}`;
            displayResponse(original, response, pattern.url);
            return speechManager.speak(response);
        }
    },
    search: {
        patterns: ['what is', 'who is', 'what are', 'search for'],
        handler: (message, original) => {
            const query = encodeURIComponent(message);
            const url = `https://www.google.com/search?q=${query}`;
            const response = `Here's what I found about "${message}"`;
            displayResponse(original, response, url);
            return speechManager.speak(response);
        }
    },
    wikipedia: {
        patterns: ['wikipedia'],
        handler: (message, original) => {
            const searchTerm = message.replace('wikipedia', '').trim();
            if (searchTerm) {
                const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(searchTerm)}`;
                const response = `Here's the Wikipedia article about "${searchTerm}"`;
                displayResponse(original, response, url);
                return speechManager.speak(response);
            }
            const response = 'What would you like me to search on Wikipedia?';
            displayResponse(original, response);
            return speechManager.speak(response);
        }
    },
    time: {
        patterns: ['time', 'what time'],
        handler: (message, original) => {
            const time = new Date().toLocaleString('en-US', { 
                hour: 'numeric', 
                minute: 'numeric',
                hour12: true 
            });
            const response = `The current time is ${time}`;
            displayResponse(original, response);
            return speechManager.speak(response);
        }
    },
    date: {
        patterns: ['date', 'today', 'what day'],
        handler: (message, original) => {
            const date = new Date().toLocaleString('en-US', { 
                weekday: 'long',
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
            });
            const response = `Today is ${date}`;
            displayResponse(original, response);
            return speechManager.speak(response);
        }
    }
};

async function processCommand(message, originalTranscript) {
    try {
        // Check greetings
        if (commands.greetings.patterns.some(pattern => message.includes(pattern))) {
            await commands.greetings.handler(message, originalTranscript);
            return;
        }

        // Check identity
        if (commands.identity.patterns.some(pattern => message.includes(pattern))) {
            await commands.identity.handler(message, originalTranscript);
            return;
        }

        // Check user name
        if (commands.userName.patterns.some(pattern => message.includes(pattern))) {
            await commands.userName.handler(message, originalTranscript);
            return;
        }

        // Check creator
        if (commands.creator.patterns.some(pattern => message.includes(pattern))) {
            await commands.creator.handler(message, originalTranscript);
            return;
        }

        // Check websites
        for (const pattern of commands.websites.patterns) {
            if (message.includes(pattern.match)) {
                await commands.websites.handler(pattern, originalTranscript);
                return;
            }
        }

        // Check Wikipedia
        if (commands.wikipedia.patterns.some(pattern => message.includes(pattern))) {
            await commands.wikipedia.handler(message, originalTranscript);
            return;
        }

        // Check time
        if (commands.time.patterns.some(pattern => message.includes(pattern))) {
            await commands.time.handler(message, originalTranscript);
            return;
        }

        // Check date
        if (commands.date.patterns.some(pattern => message.includes(pattern))) {
            await commands.date.handler(message, originalTranscript);
            return;
        }

        // Check general search
        if (commands.search.patterns.some(pattern => message.includes(pattern))) {
            await commands.search.handler(message, originalTranscript);
            return;
        }

        // Default fallback - Google search
        const query = encodeURIComponent(message);
        const url = `https://www.google.com/search?q=${query}`;
        const response = `I'll search for "${message}" on Google`;
        displayResponse(originalTranscript, response, url);
        await speechManager.speak(response);

    } catch (error) {
        console.error('Command processing error:', error);
        displayResponse(originalTranscript || message, 'Sorry, an error occurred. Please try again.');
        updateUI('error');
        setTimeout(() => updateUI('idle'), 2000);
    }
}
