
import ast
import json
import sys

def analyze_code(code):
    issues = []
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return {
            "summary": {"totalIssues": 1, "errors": 1, "warnings": 0, "suggestions": 0, "overallStatus": "has_errors"},
            "issues": [{
                "line": e.lineno,
                "column": e.offset or 0,
                "severity": "error",
                "message": f"Syntax Error: {e.msg}",
                "code": e.text.strip() if e.text else "",
                "suggestion": "Check the syntax at this line."
            }]
        }

    # Basic analysis using AST
    errors = 0
    warnings = 0
    suggestions = 0

    # Rule-based checks
    for node in ast.walk(tree):
        # Example: Check for print statements (suggestion)
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == 'print':
            suggestions += 1
            issues.append({
                "line": node.lineno,
                "column": node.col_offset,
                "severity": "info",
                "message": "Use of 'print' found. Consider using a logging library for production code.",
                "code": "print(...)",
                "suggestion": "Use logging.info(...) instead."
            })
        
        # Example: Check for bare 'except'
        if isinstance(node, ast.ExceptHandler) and node.type is None:
            warnings += 1
            issues.append({
                "line": node.lineno,
                "column": node.col_offset,
                "severity": "warning",
                "message": "Bare 'except' block. It's better to catch specific exceptions.",
                "code": "except:",
                "suggestion": "Specify an exception type, e.g., 'except Exception:'"
            })

    return {
        "summary": {
            "totalIssues": len(issues),
            "errors": errors,
            "warnings": warnings,
            "suggestions": suggestions,
            "overallStatus": "has_errors" if errors > 0 else "has_warnings" if warnings > 0 else "clean"
        },
        "issues": issues
    }

if __name__ == "__main__":
    code_to_analyze = sys.stdin.read()
    print(json.dumps(analyze_code(code_to_analyze)))
