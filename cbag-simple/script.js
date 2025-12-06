// Configuration
const WEBHOOK_URL = "https://cbam-agent.onrender.com/webhook";
const MAX_FREE_USES = 2;

// State Keys
const STORAGE_KEY_USES = 'cbag_uses_v2';
const STORAGE_KEY_USER = 'cbag_user_v2';

// State Variables
let user = JSON.parse(localStorage.getItem(STORAGE_KEY_USER)) || null;
let usesCount = parseInt(localStorage.getItem(STORAGE_KEY_USES)) || 0;

// UI Elements
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const usesDisplay = document.getElementById('uses-count');
const authModal = document.getElementById('auth-modal');
const locationBanner = document.getElementById('location-banner');
const locationText = document.getElementById('location-text');

// Initialize
async function init() {
    updateUI();
    detectLocation();

    if (!user && usesCount >= MAX_FREE_USES) {
        // Don't show modal immediately on load, just disable input
        chatInput.disabled = true;
        chatInput.placeholder = "Trial limit reached.";
    }
}

// Location Detection
async function detectLocation() {
    console.log("Starting location detection...");
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        console.log("Location data received:", data);

        if (data.country_name) {
            let greeting = "CBAg welcomes you from";
            const code = data.country_code;
            if (code === 'DE') greeting = "CBAg heißt Sie willkommen aus";
            if (code === 'FR') greeting = "CBAg vous souhaite la bienvenue depuis";
            if (code === 'ES') greeting = "CBAg te da la bienvenida desde";
            if (code === 'IT') greeting = "CBAg ti dà il benvenuto da";

            console.log("Updating welcome message to:", `${greeting} ${data.country_name}`);

            // Update the welcome message in the chat
            const welcomeText = document.getElementById('welcome-text');
            if (welcomeText) {
                welcomeText.innerHTML = `<strong>${greeting} ${data.country_name}</strong>. I can calculate emissions, find HS codes, and draft compliance reports.`;
                welcomeText.classList.add('text-emerald-400'); // Highlight the change
            } else {
                console.error("Element with id 'welcome-text' not found!");
            }

            // Also update the banner
            const locationText = document.getElementById('location-text');
            const locationBanner = document.getElementById('location-banner');
            if (locationText && locationBanner) {
                locationText.innerText = `${greeting} ${data.country_name}`;
                locationBanner.classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error("Location detection failed:", error);
    }
}

// UI Updates
function updateUI() {
    const remaining = Math.max(0, MAX_FREE_USES - usesCount);
    if (usesDisplay) usesDisplay.innerText = remaining;

    if (user) {
        if (usesDisplay) usesDisplay.parentElement.parentElement.classList.add('hidden');
    }
}

// Chat Logic
async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    if (!user && usesCount >= MAX_FREE_USES) {
        showAuthModal();
        return;
    }

    appendMessage(text, 'user');
    chatInput.value = '';
    chatInput.disabled = true;

    if (!user) {
        usesCount++;
        localStorage.setItem(STORAGE_KEY_USES, usesCount);
        updateUI();
    }

    const loadingId = appendLoading();

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: text,
                sessionId: user ? `client-${user.email}` : `prospect-${Date.now()}`
            })
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        removeMessage(loadingId);

        console.log("Agent Response:", data); // Debug log

        let rawText = "Sorry, I couldn't understand the response.";

        // Handle different response formats
        if (data.output) {
            if (typeof data.output === 'string') {
                rawText = data.output;
            } else if (Array.isArray(data.output)) {
                // Extract text from array of objects (e.g. [{type: 'text', text: '...'}])
                rawText = data.output
                    .filter(item => item.type === 'text' || item.text)
                    .map(item => item.text || '')
                    .join('\n\n');
            }
        }

        // Use Marked.js to parse markdown
        const formattedOutput = marked.parse(rawText);
        appendMessage(formattedOutput, 'agent');

        if (!user && usesCount >= MAX_FREE_USES) {
            setTimeout(() => {
                appendMessage("Trial limit reached. Please register to continue.", 'system');
                showAuthModal();
            }, 2000);
        }

    } catch (error) {
        console.error(error);
        removeMessage(loadingId);
        appendMessage("Connection error. Please try again.", 'agent');
    } finally {
        if (!user && usesCount >= MAX_FREE_USES) {
            chatInput.disabled = true;
            chatInput.placeholder = "Trial limit reached.";
        } else {
            chatInput.disabled = false;
            chatInput.focus();
        }
    }
}

function appendMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;

    const bubble = document.createElement('div');

    if (sender === 'user') {
        bubble.className = 'bg-cyan-600 text-white p-4 rounded-2xl rounded-br-none max-w-[85%] shadow-md';
        bubble.innerText = text; // User input is plain text
    } else if (sender === 'system') {
        bubble.className = 'bg-yellow-900/50 text-yellow-200 p-3 rounded-xl text-sm border border-yellow-800/50';
        bubble.innerText = text;
    } else {
        // Agent output is HTML (from Markdown)
        bubble.className = 'glass-card text-slate-200 p-5 rounded-2xl rounded-bl-none max-w-[85%] shadow-sm border border-slate-700/50 prose prose-invert';
        bubble.innerHTML = text;
    }

    div.appendChild(bubble);
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return div;
}

function appendLoading() {
    const id = 'loading-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'flex justify-start';
    div.innerHTML = `
        <div class="glass-card p-4 rounded-2xl rounded-bl-none flex items-center gap-2 text-slate-400 border border-slate-700/50">
            <i data-lucide="loader-2" class="animate-spin w-4 h-4 text-cyan-500"></i> CBAg is thinking...
        </div>
    `;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    lucide.createIcons();
    return id;
}

function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function showAuthModal() {
    authModal.classList.remove('hidden');
    authModal.classList.add('flex');
}

function fillInput(text) {
    chatInput.value = text;
    sendMessage();
}

document.addEventListener('DOMContentLoaded', init);
