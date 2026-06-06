const express = require("express");
require("dotenv").config();

const web = express();

web.set("view engine", "ejs");
web.set("trust proxy", true);

web.use(express.static("public"));
web.use(express.json());

console.log(process.env.GROQ_API_KEY);

web.get("/", (req, res) => {

    const ip =
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.socket.remoteAddress;

    console.log("Visitor IP:", ip);

    res.render("Birds", { ip });
});

web.post("/api/chat", async (req, res) => {
    try {

        const { messages } = req.body;

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: messages,
                    temperature: 0.8,
                    max_tokens: 600
                })
            }
        );
        
        

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: {
                message: err.message
            }
        });
    }
});

web.listen(8328, () => {
    console.log("Server Started On Port 8328");
});