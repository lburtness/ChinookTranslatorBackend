require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3000;

// ✅ Enable CORS for frontend requests
app.use(cors()); // Allows all origins temporarily for debugging

// ✅ OR restrict CORS to only your frontend domain
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://olympusmultimedia.com"); // ✅ Allow frontend domain
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    // ✅ Handle CORS Preflight Requests (OPTIONS)
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

app.use(express.json());

// ✅ Serve static files (including `chinookwords.json`)
app.use(express.static(path.join(__dirname)));

// ✅ Ensure API Key is Available
if (!process.env.OPENAI_API_KEY) {
    console.error("❌ ERROR: Missing OpenAI API Key in .env file!");
    process.exit(1);
}

// ✅ Route to Serve Dictionary File (`chinookwords.json`)
app.get("/chinookwords.json", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://olympusmultimedia.com"); // ✅ Allows CORS for this request
    res.sendFile(path.join(__dirname, "chinookwords.json"));
});

// ✅ Route to Handle AI Translations
app.post("/translate", async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://olympusmultimedia.com"); // ✅ Allows CORS for AI requests

    const { inputWord } = req.body;

    if (!inputWord) {
        return res.status(400).json({ error: "❌ Missing input word." });
    }

    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4",
                messages: [{ role: "user", content: `Translate "${inputWord}" to Chinook Jargon. If no direct translation exists, provide a related word or explanation.` }],
                max_tokens: 100
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        res.json({ translation: response.data.choices[0].message.content });
    } catch (error) {
        console.error("❌ OpenAI API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "⚠️ Error fetching AI translation." });
    }
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`📂 Serving static files from ${__dirname}`);
});
