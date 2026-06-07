import Groq from "groq-sdk";

const g = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  // Test 1: Without json_object mode (fast model)
  console.log("Test 1: llama-3.1-8b-instant (no JSON mode)...");
  try {
    const r1 = await g.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "Reply with valid JSON." },
        { role: "user", content: 'Return JSON: {"test": true}' },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });
    const content = r1.choices[0]?.message?.content;
    console.log("  Response:", content);
    console.log("  Tokens:", r1.usage?.total_tokens);
    console.log("  Time: ~instant");
  } catch (e) {
    console.error("  FAILED:", e.message);
  }

  // Test 2: With json_object mode (supported model)
  console.log("\nTest 2: llama-3.3-70b-versatile (with JSON mode)...");
  try {
    const r2 = await g.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a JSON generator." },
        { role: "user", content: 'Return: {"test": true}' },
      ],
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });
    const content = r2.choices[0]?.message?.content;
    console.log("  Response:", content);
    console.log("  Tokens:", r2.usage?.total_tokens);
  } catch (e) {
    console.error("  FAILED:", e.message);
  }
}

main();