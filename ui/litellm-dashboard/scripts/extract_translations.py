import os
import re
import json
import sys
import argparse

def parse_t_calls(content):
    """
    Parses t(...) calls from content, handling nested parentheses and expressions.
    Returns a list of extracted arguments (as strings).
    """
    calls = []
    # Find all start indices of 't(' to avoid regex limitation on nested parens
    
    iterator = re.finditer(r'\bt\s*\(', content)
    
    for match in iterator:
        start_idx = match.end()
        current_idx = start_idx
        balance = 1 # We are inside one parenthesis
        arg_start = start_idx
        
        while current_idx < len(content):
            char = content[current_idx]
            
            if char == '(':
                balance += 1
            elif char == ')':
                balance -= 1
            
            if balance == 0:
                # Found the closing parenthesis
                arg_content = content[arg_start:current_idx].strip()
                
                # Logic to extract first argument (handles comma split safely)
                first_arg = ""
                level = 0
                qs_char = None
                
                for i, c in enumerate(arg_content):
                    if qs_char:
                        if c == qs_char and (i == 0 or arg_content[i-1] != '\\'):
                            qs_char = None
                    else:
                        if c in ['"', "'", "`"]:
                            qs_char = c
                        elif c in ['(', '[', '{']:
                            level += 1
                        elif c in [')', ']', '}']:
                            level -= 1
                        elif c == ',' and level == 0:
                            first_arg = arg_content[:i].strip()
                            break
                
                if not first_arg:
                    first_arg = arg_content
                
                if first_arg:
                     calls.append(first_arg)
                break
            
            current_idx += 1
            
    return calls

def extract_from_file(full_path):
    try:
        with open(full_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            content = "".join(lines)
            
        t_calls = parse_t_calls(content)
        
        T_pattern = re.compile(r'<T>(.*?)</T>', re.DOTALL)
        T_matches = [m.strip() for m in T_pattern.findall(content)]
        
        # Extract imports with line numbers
        imports = []
        import_pattern = re.compile(r'import\s+.*?from\s+["\']@/i18n["\'];?')
        
        # Scan line by line for imports and hooks to get line numbers
        hooks = []
        # Hook pattern: const t = useTranslate(); or const { t } = useTranslate(); ?
        # Usually: const t = useTranslate();
        hook_pattern = re.compile(r'const\s+t\s*=\s*useTranslate\s*\(\s*\);?')
        
        for i, line in enumerate(lines):
            # Check for import
            if import_pattern.search(line):
                imports.append({
                    "line": i + 1, # 1-indexed
                    "content": line.strip()
                })
            
            # Check for hook
            if hook_pattern.search(line):
                hooks.append({
                    "line": i + 1,
                    "content": line.strip()
                })
        
        # If imports/hooks span multiple lines, simple line scan might fail or truncate.
        # But 'import ... from "@/i18n"' is usually one line or we assume so for now.
        # If strictly needed, we can use re.finditer on full content and map byte offset to line number.
        # Given "import { ... } from ..." might correspond to multiple lines.
        # Let's improve robustness: finditer on content, then identifying line number.
        
        # Re-do imports/hooks with offset mapping
        imports = []
        hooks = []
        
        # Build line offset map
        line_offsets = [0]
        for i, line in enumerate(lines):
            line_offsets.append(line_offsets[-1] + len(line))
            
        def get_line_number(index):
            # Binary search or just linear since not huge
            for i, offset in enumerate(line_offsets):
                if offset > index:
                    return i
            return len(lines)

        for match in import_pattern.finditer(content):
            lineno = get_line_number(match.start())
            imports.append({
                "line": lineno,
                "content": match.group(0).strip()
            })
            
        for match in hook_pattern.finditer(content):
            lineno = get_line_number(match.start())
            hooks.append({
                "line": lineno,
                "content": match.group(0).strip()
            })

        if t_calls or T_matches or imports or hooks:
            return {
                "t_calls": sorted(list(set(t_calls))),
                "T_components": sorted(list(set(T_matches))),
                "imports": imports, # List of dicts, no sort needed usually, preserve order found?
                "hooks": hooks
            }
        return None
    except Exception as e:
        print(f"Error reading {full_path}: {e}")
        return None

def scan_directory(target_dir, base_src_dir):
    results = {}
    for root, dirs, files in os.walk(target_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.js', '.jsx')):
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, base_src_dir)
                
                data = extract_from_file(full_path)
                if data:
                    results[rel_path] = data
    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Extract i18n strings from source files.')
    parser.add_argument('path', nargs='?', help='Path to a specific file or directory to scan. Defaults to src directory.', default=None)
    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    src_default = os.path.join(project_root, 'src')
    output_file = os.path.join(project_root, 'i18n_backup.json')
    
    target_path = args.path if args.path else src_default
    
    if not os.path.isabs(target_path):
        target_path = os.path.abspath(target_path)

    if not os.path.exists(target_path):
        print(f"Error: Target path {target_path} not found.")
        sys.exit(1)

    # Determine mode
    is_full_scan = (target_path == src_default) and (args.path is None)
    
    existing_data = {}
    if not is_full_scan and os.path.exists(output_file):
        try:
            with open(output_file, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
            print(f"Loaded existing backup ({len(existing_data)} entries). Updating...")
        except Exception:
            print("Could not load existing backup. Starting fresh.")
            existing_data = {}

    print(f"Scanning: {target_path}")
    
    if os.path.isfile(target_path):
        # Scan single file
        rel_path = os.path.relpath(target_path, src_default)
        if rel_path.startswith('..'): 
             print(f"Warning: File {target_path} is outside {src_default}. Output key may be unexpected.")
             
        data = extract_from_file(target_path)
        
        final_data = existing_data
        if data:
            final_data[rel_path] = data
            print(f"Updated entry for {rel_path}")
        else:
            if rel_path in final_data:
                del final_data[rel_path]
                print(f"Removed entry for {rel_path}")
            
    else:
        # Scan directory
        new_results = scan_directory(target_path, src_default)
        
        if is_full_scan:
            final_data = new_results
        else:
            final_data = existing_data
            final_data.update(new_results)
            print(f"Merged {len(new_results)} entries from directory scan.")

    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(final_data, f, indent=2, ensure_ascii=False)
        
        print(f"Extraction complete.")
        print(f"Backup saved to: {output_file}")
        
    except Exception as e:
        print(f"Error writing output file: {e}")
        sys.exit(1)
