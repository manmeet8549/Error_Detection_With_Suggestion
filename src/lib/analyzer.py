
import ast
import json
import sys
import traceback

def analyze_python_code(code):
    issues = []
    errors_count = 0
    warnings_count = 0
    suggestions_count = 0

    lines = code.split('\n')

    # 1. Check for Syntax Errors
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        line_content = lines[e.lineno-1] if e.lineno <= len(lines) else ""
        return {
            "summary": {
                "totalIssues": 1,
                "errors": 1,
                "warnings": 0,
                "suggestions": 0,
                "overallStatus": "has_errors"
            },
            "issues": [{
                "line": e.lineno,
                "column": e.offset if e.offset is not None else 0,
                "severity": "error",
                "message": f"Syntax Error: {e.msg}",
                "code": line_content.strip(),
                "suggestion": "Fix the syntax error. Check for missing colons, brackets, or indentation."
            }]
        }
    except Exception as e:
        return {
            "summary": {"totalIssues": 1, "errors": 1, "warnings": 0, "suggestions": 0, "overallStatus": "has_errors"},
            "issues": [{"line": 1, "column": 0, "severity": "error", "message": f"Analysis Error: {str(e)}", "code": "", "suggestion": ""}]
        }

    # 2. Semantic Analysis using AST
    defined_names = set(['print', 'len', 'range', 'int', 'float', 'str', 'list', 'dict', 'sum', 'max', 'min', 'abs', 'type', 'input', 'open', 'enumerate', 'zip', 'map', 'filter', 'sorted', 'any', 'all', 'isinstance', 'issubclass', 'help', 'dir', 'vars', 'id', 'super', 'next', 'iter', 'reversed', 'pow', 'round', 'divmod', 'format', 'bool', 'repr', 'ord', 'chr', 'bytearray', 'bytes', 'memoryview', 'set', 'frozenset', 'slice', 'complex', 'ascii'])
    
    # First pass: Find all defined names (functions, classes, variables)
    class DefinitionVisitor(ast.NodeVisitor):
        def visit_Name(self, node):
            if isinstance(node.ctx, ast.Store):
                defined_names.add(node.id)
        def visit_FunctionDef(self, node):
            defined_names.add(node.name)
            self.generic_visit(node)
        def visit_ClassDef(self, node):
            defined_names.add(node.name)
            self.generic_visit(node)
        def visit_Import(self, node):
            for alias in node.names:
                defined_names.add(alias.asname or alias.name)
        def visit_ImportFrom(self, node):
            for alias in node.names:
                defined_names.add(alias.asname or alias.name)

    DefinitionVisitor().visit(tree)

    # Second pass: Find issues
    for node in ast.walk(tree):
        # Check for undefined names
        if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Load):
            if node.id not in defined_names:
                errors_count += 1
                issues.append({
                    "line": node.lineno,
                    "column": node.col_offset,
                    "severity": "error",
                    "message": f"Undefined name '{node.id}'",
                    "code": lines[node.lineno-1].strip() if node.lineno <= len(lines) else "",
                    "suggestion": f"Check if '{node.id}' is defined before use. Did you mean to use a different variable name?"
                })

        # Check for bare except
        if isinstance(node, ast.ExceptHandler) and node.type is None:
            warnings_count += 1
            issues.append({
                "line": node.lineno,
                "column": node.col_offset,
                "severity": "warning",
                "message": "Bare 'except' block found",
                "code": "except:",
                "suggestion": "Catch specific exceptions (e.g., 'except ValueError:') instead of using a bare 'except:' to avoid catching unexpected errors."
            })

        # Check for print (Suggestion)
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == 'print':
            suggestions_count += 1
            issues.append({
                "line": node.lineno,
                "column": node.col_offset,
                "severity": "info",
                "message": "Use of 'print' detected",
                "code": lines[node.lineno-1].strip() if node.lineno <= len(lines) else "",
                "suggestion": "For production code, consider using the 'logging' module instead of 'print' for better control over log levels and destinations."
            })

        # Check for string + non-string concatenation in print/expressions
        if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):
            # Check if one side is a string constant
            left_is_str = isinstance(node.left, ast.Constant) and isinstance(node.left.value, str) or \
                          isinstance(node.left, ast.JoinedStr)
            right_is_str = isinstance(node.right, ast.Constant) and isinstance(node.right.value, str) or \
                           isinstance(node.right, ast.JoinedStr)
            
            # This is a very rough check, but helps with the user's specific case
            if left_is_str or right_is_str:
                # If the other side is not a string but we can't be sure, we warn
                # For now, let's look for common cases like numbers
                other = node.right if left_is_str else node.left
                if isinstance(other, ast.Name): # Variable, might be other type
                    warnings_count += 1
                    issues.append({
                        "line": node.lineno,
                        "column": node.col_offset,
                        "severity": "warning",
                        "message": "Potential type mismatch in concatenation",
                        "code": lines[node.lineno-1].strip() if node.lineno <= len(lines) else "",
                        "suggestion": "Ensure both operands are strings. Use str() to convert non-string values or use f-strings."
                    })

    return {
        "summary": {
            "totalIssues": len(issues),
            "errors": errors_count,
            "warnings": warnings_count,
            "suggestions": suggestions_count,
            "overallStatus": "has_errors" if errors_count > 0 else "has_warnings" if warnings_count > 0 else "clean"
        },
        "issues": sorted(issues, key=lambda x: x['line'])
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # If passed as file path
        with open(sys.argv[1], 'r', encoding='utf-8') as f:
            code = f.read()
    else:
        # If passed via stdin
        code = sys.stdin.read()
    
    print(json.dumps(analyze_python_code(code)))
