import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

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
    const zai = await ZAI.create();

    const systemPrompt = `You are an expert code analyzer and debugging assistant. Analyze the given ${lang} code thoroughly for errors, bugs, potential issues, and code quality improvements.

Your task is to detect and categorize issues into:
1. **Critical Errors** - Syntax errors, runtime errors, logic errors that would break the code
2. **Warnings** - Code that may cause issues, deprecated patterns, potential bugs
3. **Suggestions** - Best practices, performance improvements, style improvements

For EACH issue found, provide:
- The exact line number (1-indexed)
- The column/position if applicable
- Severity level: "error", "warning", or "info"
- A clear, concise error message
- The specific code snippet that has the issue
- A suggested fix or correction

IMPORTANT RULES:
- Be thorough - check for ALL types of errors including: syntax, runtime, logic, type mismatches, undefined variables, missing imports, incorrect function signatures, improper loops, edge cases, null/None handling, incorrect operators, etc.
- Check variable scope issues, unused imports, shadowing
- Check for common ${lang} pitfalls
- If the code looks clean, still mention at least 2-3 style/performance suggestions
- Format the line numbers accurately by counting from the FIRST line of the code
- DO NOT miss any errors - be extremely thorough

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{
  "summary": {
    "totalIssues": number,
    "errors": number,
    "warnings": number,
    "suggestions": number,
    "overallStatus": "has_errors" | "has_warnings" | "clean"
  },
  "issues": [
    {
      "line": number,
      "column": number,
      "severity": "error" | "warning" | "info",
      "message": "Clear description of the issue",
      "code": "The problematic code snippet",
      "suggestion": "How to fix it"
    }
  ]
}`;

    const userPrompt = `Analyze this ${lang} code for errors, warnings, and suggestions:\n\n\`\`\`${lang}\n${code}\n\`\`\``;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
    });

    let responseContent = completion.choices[0]?.message?.content || "";

    // Clean up the response - remove markdown code fences if present
    responseContent = responseContent.trim();
    if (responseContent.startsWith("```json")) {
      responseContent = responseContent.slice(7);
    }
    if (responseContent.startsWith("```")) {
      responseContent = responseContent.slice(3);
    }
    if (responseContent.endsWith("```")) {
      responseContent = responseContent.slice(0, -3);
    }
    responseContent = responseContent.trim();

    let analysis;
    try {
      analysis = JSON.parse(responseContent);
    } catch {
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create a basic structure from the text response
        analysis = {
          summary: {
            totalIssues: 0,
            errors: 0,
            warnings: 0,
            suggestions: 0,
            overallStatus: "clean",
          },
          issues: [],
          rawResponse: responseContent,
        };
      }
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to analyze code",
      },
      { status: 500 }
    );
  }
}
