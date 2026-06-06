const chatPopup = document.getElementById("chatPopup");
const chatbox = document.getElementById("chatbox");
const userInput = document.getElementById("userInput");
const camera = document.getElementById("camera");
const fileInput = document.getElementById("avatar");
const mainTitle = document.getElementById("mainTitle");

let model = null;
let labels = {};
let isModelLoaded = false;
let cameraInterval = null;

let messages = [
    {
        role: "system",
        content: `
You are a friendly, intelligent AI assistant.
Speak naturally like a human.
Remember the conversation.
Answer any topic the user asks.
If the user asks for images, photos, pictures, or links, answer normally.
The website will automatically provide image links when needed.
        `
    }
];

async function initAI() {
    try {
        mainTitle.innerText = "Loading AI Model...";

        model = await tf.loadLayersModel("/model/model.json");

        const response = await fetch("/species.json");
        labels = await response.json();

        isModelLoaded = true;
        mainTitle.innerText = "Birds AI Detection";

        console.log("TensorFlow.js model and class indices loaded successfully.");
    } catch (error) {
        console.error("AI Initialization failed:", error);
        mainTitle.innerText = "AI Load Error (Check Paths)";
    }
}

function processAndPredict(imageSource) {
    if (!isModelLoaded || !model) return;

    tf.tidy(() => {
        const tensor = tf.browser.fromPixels(imageSource)
            .resizeNearestNeighbor([224, 224])
            .toFloat()
            .div(tf.scalar(255.0))
            .expandDims();

        const predictions = model.predict(tensor);
        const probabilities = predictions.dataSync();
        const highestIndex = predictions.argMax(1).dataSync()[0];
        const confidenceScore = probabilities[highestIndex];

        const speciesName = labels[highestIndex] || `Class ${highestIndex}`;

        if (confidenceScore > 0.45) {
            mainTitle.innerText =
                `Detected: ${speciesName.replaceAll("_", " ")}`;
        } else {
            mainTitle.innerText = "Scanning for birds...";
        }
    });
}

if (fileInput) {
    fileInput.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = function (e) {
            const img = new Image();
            img.src = e.target.result;

            img.onload = function () {
                processAndPredict(img);
            };
        };

        reader.readAsDataURL(file);
    });
}

function toggleChat() {
    chatPopup.style.display =
        chatPopup.style.display === "flex" ? "none" : "flex";
}

async function startCamera() {
    try {
        const cameraElement = document.getElementById("camera");

        if (!cameraElement) {
            alert("Camera video element not found");
            return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Camera is not supported in this browser");
            return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        cameraElement.srcObject = stream;
        cameraElement.muted = true;
        cameraElement.playsInline = true;

        await cameraElement.play();

        console.log("Camera started successfully");

        if (cameraInterval) {
            clearInterval(cameraInterval);
        }

        cameraInterval = setInterval(() => {
            if (
                cameraElement.readyState >= 2 &&
                !cameraElement.paused &&
                !cameraElement.ended
            ) {
                processAndPredict(cameraElement);
            }
        }, 1000);

    } catch (err) {
        console.error("Camera error:", err);

        alert(
            "Camera error: " +
            err.name +
            "\n" +
            err.message
        );
    }
}

function wantsImages(text) {
    text = text.toLowerCase();

    return (
        text.includes("image") ||
        text.includes("picture") ||
        text.includes("photo") ||
        text.includes("pic")
    );
}

function extractSearchQuery(text) {
    text = text.toLowerCase();

    const removeWords = [
        "show me", "give me", "send me", "find me",
        "pictures of", "picture of", "photos of", "photo of",
        "images of", "image of", "pics of", "pic of",
        "pictures", "picture", "photos", "photo",
        "images", "image", "pics", "pic",
        "links", "link", "please", "for"
    ];

    let query = text;

    removeWords.forEach(word => {
        query = query.replaceAll(word, "");
    });

    query = query.trim();

    return query || text;
}

async function showImageLinks(originalText) {
    const query = extractSearchQuery(originalText);

    const googleImages =
        `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;

    const wikiSearch =
        `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`;

    chatbox.innerHTML += `
        <div class="link">
            <b>Image links for "${query}":</b><br>
            <a href="${googleImages}" target="_blank">Open Google Images</a><br>
            <a href="${wikiSearch}" target="_blank">Search Wikipedia</a>
        </div>
    `;

    await showWikipediaImage(query);
}

async function showWikipediaImage(query) {
    try {
        const searchUrl =
            `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;

        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (!searchData.query.search.length) return;

        const title = searchData.query.search[0].title;

        const summaryUrl =
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

        const summaryRes = await fetch(summaryUrl);
        const summaryData = await summaryRes.json();

        const img = summaryData.thumbnail?.source;
        const page = summaryData.content_urls?.desktop?.page;

        if (img) {
            chatbox.innerHTML += `
                <div class="link">
                    <b>Wikipedia image:</b><br>
                    <img src="${img}">
                    ${page ? `<br><a href="${page}" target="_blank">Open Wikipedia Page</a>` : ""}
                </div>
            `;
        }

    } catch (err) {
        console.error("Image fetch error:", err);
    }
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    chatbox.innerHTML += `
        <div class="message user">
            <b>You:</b> ${message}
        </div>
    `;

    userInput.value = "";
    chatbox.scrollTop = chatbox.scrollHeight;

    if (wantsImages(message)) {
        await showImageLinks(message);
    }

    messages.push({
        role: "user",
        content: message
    });

    const typingId = "typing-" + Date.now();

    chatbox.innerHTML += `
        <div id="${typingId}" class="typing">
            Bot is typing...
        </div>
    `;

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: messages
            })
        });

        const data = await response.json();

        document.getElementById(typingId)?.remove();

        if (!response.ok) {
            chatbox.innerHTML += `
                <div class="message bot" style="color:red;">
                    <b>Error:</b> ${data.error?.message || response.status}
                </div>
            `;
            return;
        }

        const reply = data.choices[0].message.content;

        messages.push({
            role: "assistant",
            content: reply
        });

        chatbox.innerHTML += `
            <div class="message bot">
                <b>Bot:</b> ${reply}
            </div>
        `;

        chatbox.scrollTop = chatbox.scrollHeight;

    } catch (err) {
        document.getElementById(typingId)?.remove();

        chatbox.innerHTML += `
            <div class="message bot" style="color:red;">
                <b>Error:</b> ${err.message}
            </div>
        `;
    }
}

document.getElementById("chatBall").addEventListener("click", toggleChat);
document.getElementById("closeBtn").addEventListener("click", toggleChat);
document.getElementById("sendBtn").addEventListener("click", sendMessage);
document.getElementById("startCameraBtn").addEventListener("click", startCamera);

userInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});

window.addEventListener("DOMContentLoaded", initAI);