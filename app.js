const btn = document.querySelector('.talk');
const content = document.querySelector('.content');

// Variable to store user's name
let userName = 'Rohit';

// Speak function to make the assistant talk
function speak(text) {
    const text_speak = new SpeechSynthesisUtterance(text);
    text_speak.rate = 1;
    text_speak.volume = 1;
    text_speak.pitch = 1;
    window.speechSynthesis.speak(text_speak);
}

// Wish the user based on the time of day
function wishMe() {
    var day = new Date();
    var hour = day.getHours();
    if (hour >= 0 && hour < 12) {
        speak("Good Morning Sir..");
    } else if (hour >= 12 && hour < 17) {
        speak("Good Afternoon Sir...");
    } else {
        speak("Good Evening Sir...");
    }
}

window.addEventListener('load', () => {
    speak(" Hello JARVIS");
    wishMe();
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.onresult = (event) => {
    const currentIndex = event.resultIndex;
    const transcript = event.results[currentIndex][0].transcript;
    content.textContent = transcript;
    takeCommand(transcript.toLowerCase());
};

btn.addEventListener('click', () => {
    content.textContent = "Listening...";
    recognition.start();
});

// Function to process the voice commands
function takeCommand(message) {
    if (message.includes('hey') || message.includes('hello')) {
        speak("Hello Sir, How May I Help You?");
    } else if (message.includes('who are you') || message.includes('what are you') || message.includes('who you are')) {
        speak("I am JARVIS, your virtual assistant. I am version 1.0. I can help you open websites, tell the time, search the web, and more. Just ask!");
    } else if (message.includes('what is my name')) {
        if (userName) {
            speak("Your name is " + userName);
        } else {
            speak("I don't know your name yet. What is your name?");
            recognition.start();  // Start listening again for user's name
            recognition.onresult = (event) => {
                const name = event.results[0][0].transcript;
                userName = name;
                content.textContent = `Your name is ${name}`;
                speak(`Nice to meet you, ${name}`);
            };
        }
    } else if (message.includes("open google")) {
        window.open("https://google.com");
        speak("Opening Google...");
    } else if (message.includes("open youtube")) {
        window.open("https://youtube.com");
        speak("Opening Youtube...");
    } else if (message.includes("open facebook")) {
        window.open("https://facebook.com");
        speak("Opening Facebook...");
    } else if (message.includes('what is') || message.includes('who is') || message.includes('what are')) {
        window.open(`https://www.google.com/search?q=${message.replace(" ", "+")}`, "_blank");
        const finalText = "This is what I found on the internet regarding " + message;
        speak(finalText);
    } else if (message.includes('wikipedia')) {
        window.open(`https://en.wikipedia.org/wiki/${message.replace("wikipedia", "").trim()}`, "_blank");
        const finalText = "This is what I found on Wikipedia regarding " + message;
        speak(finalText);
    } else if (message.includes('time')) {
        const time = new Date().toLocaleString(undefined, { hour: "numeric", minute: "numeric" });
        const finalText = "The current time is " + time;
        speak(finalText);
    } else if (message.includes('date')) {
        const date = new Date().toLocaleString(undefined, { month: "short", day: "numeric" });
        const finalText = "Today's date is " + date;
        speak(finalText);
    } else if (message.includes('calculator')) {
        window.open('Calculator:///');
        const finalText = "Opening Calculator";
        speak(finalText);
    } else {
        window.open(`https://www.google.com/search?q=${message.replace(" ", "+")}`, "_blank");
        const finalText = "I found some information for " + message + " on Google";
        speak(finalText);
    }
}
