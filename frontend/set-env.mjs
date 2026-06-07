import { execSync } from "child_process";
import fs from "fs";

// Read the API key from .env.local
const envContent = fs.readFileSync(".env.local", "utf8");
const match = envContent.match(/GROQ_API_KEY=(\S+)/);
const apiKey = match ? match[1] : null;

if (!apiKey) {
  console.error("Could not find GROQ_API_KEY in .env.local");
  process.exit(1);
}

// Use Vercel CLI to add the environment variable
console.log(`Setting GROQ_API_KEY for production...`);
execSync(`echo ${apiKey} | vercel env add GROQ_API_KEY production --sensitive`, {
  stdio: "inherit",
  shell: true,
});

console.log("Done!");