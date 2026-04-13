import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { spawn } from "child_process";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { code, language } = await req.json();

    if (!code || !code.trim()) {
      return NextResponse.json(
        { error: "No code provided" },
        { status: 400 }
      );
    }

    const lang = language || "python";
    const systemPrompt = `You are an expert code analyzer and debugging assistant. Analyze the given ${lang} code thoroughly for errors, bugs, potential issues, and code quality improvements.
    
    Respond ONLY with valid JSON (no markdown).`;

    const userPrompt = `Analyze this ${lang} code:\n\n\`\`\`${lang}\n${code}\n\`\`\``;

    let responseContent = "";
    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
      });
      responseContent = completion.choices[0]?.message?.content || "";
      
      // Clean up and parse AI response
      responseContent = responseContent.trim();
      if (responseContent.startsWith("```json")) responseContent = responseContent.slice(7);
      if (responseContent.startsWith("```")) responseContent = responseContent.slice(3);
      if (responseContent.endsWith("```")) responseContent = responseContent.slice(0, -3);
      responseContent = responseContent.trim();
      
      const analysis = JSON.parse(responseContent);
      return NextResponse.json({ success: true, analysis });

    } catch (aiError: any) {
      console.error("AI SDK Error, falling back to local analyzer:", aiError.message);
      
      // Fallback to local Python analyzer if code is python
      if (lang.toLowerCase() === "python") {
        return new Promise((resolve) => {
          const analyzerPath = path.join(process.cwd(), "src", "lib", "analyzer.py");
          const process_py = spawn("python", [analyzerPath]);

          let output = "";
          let errorOutput = "";

          process_py.stdout.on("data", (data) => {
            output += data.toString();
          });

          process_py.stderr.on("data", (data) => {
            errorOutput += data.toString();
          });

          process_py.on("close", (code) => {
            if (code === 0) {
              try {
                const analysis = JSON.parse(output);
                resolve(NextResponse.json({ success: true, analysis }));
              } catch (e) {
                console.error("Failed to parse analyzer output:", e);
                resolve(NextResponse.json({ success: false, error: "Analysis engine failure" }, { status: 500 }));
              }
            } else {
              console.error("Python analyzer exited with code:", code, errorOutput);
              resolve(NextResponse.json({ success: false, error: "Analysis engine error" }, { status: 500 }));
            }
          });

          process_py.stdin.write(code);
          process_py.stdin.end();
        });
      }

      return NextResponse.json({ 
        success: false, 
        error: "AI SDK not configured and no local analyzer for " + lang
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
