
import ZAI from "z-ai-web-dev-sdk";

async function test() {
  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: "Say hello" },
        { role: "user", content: "Hi" },
      ],
    });
    console.log("Success:", completion.choices[0]?.message?.content);
  } catch (err) {
    console.error("AI Error:", err);
  }
}

test();
