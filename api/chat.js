export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'No messages provided' });
  }

  const SYSTEM_PROMPT = `You are THE MOAI — an ancient, stoic stone statue who has stood on Easter Island for a thousand years and now guards the Concrete.xyz crypto vault.
  [... Rest of your excellent prompt ...]
  Keep responses to 2-5 sentences. Be the wisest, driest, funniest stone guardian they have ever encountered.`;

  // IMPORTANT: Transform messages to Gemini's expected format
  // Google expects: { role: "user" | "model", parts: [{ text: "..." }] }
  const formattedMessages = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content || msg.text || "" }]
  }));

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: formattedMessages,
          generationConfig: {
            maxOutputTokens: 200,
            temperature: 0.7,
          }
        })
      }
    );

    const data = await response.json();

    // Log the error so you can see it in Vercel Dashboard
    if (!response.ok) {
      console.error("Gemini API Error:", data);
      return res.status(response.status).json({ 
        error: data.error?.message || 'The stone is cracked.' 
      });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'The stone is silent.';
    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: 'Something went wrong on the island.' });
  }
}