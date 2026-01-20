import os
import json
import re
import sys
import argparse

def restore_translations(src_dir, backup_file, target_file_input=None):
    try:
        with open(backup_file, 'r', encoding='utf-8') as f:
            backup_data = json.load(f)
    except Exception as e:
        print(f"Error loading backup: {e}")
        return

    restored_count = 0
    files_processed = 0

    filtered_items = []
    
    if target_file_input:
        # Try to find a match in backup keys
        found_key = None
        
        # 1. Check exact key match (if user passed 'app/login/LoginPage.tsx')
        if target_file_input in backup_data:
            found_key = target_file_input
        
        if not found_key:
            # 2. Check path resolution
            # Construct dictionary of full_path -> key
            match_candidates = []
            
            # Normalize input if it's a path
            abs_input = os.path.abspath(target_file_input)
            
            for key in backup_data.keys():
                full_path_key = os.path.join(src_dir, key)
                
                # Check absolute match
                if full_path_key == abs_input:
                    match_candidates = [key]
                    break
                
                # Check suffix match (robustness for repo-relative paths)
                # Be careful: 'Page.tsx' matches 'LoginPage.tsx'
                # We prefer longer matches. 
                # Simplest check: does full_path_key end with target_file_input?
                # Normalize separators
                fp_norm = full_path_key.replace(os.sep, '/')
                in_norm = target_file_input.replace(os.sep, '/')
                
                if fp_norm.endswith(in_norm):
                    match_candidates.append(key)

            if match_candidates:
                if len(match_candidates) == 1:
                    found_key = match_candidates[0]
                else:
                    # Ambiguous - pick shortest suffix match? Or warn?
                    print(f"Ambiguous file match for '{target_file_input}'. Candidates: {match_candidates}")
                    # Try to pick best? The one with longest suffix overlap? 
                    # If input is 'LoginPage.tsx', matches 'app/login/LoginPage.tsx' and '.../Another/LoginPage.tsx'
                    # We can't decide easily.
                    print("Skipping restoration due to ambiguity.")
                    return
        
        if found_key:
            print(f"Restoring target: {found_key}")
            filtered_items = [(found_key, backup_data[found_key])]
        else:
            print(f"Warning: Could not find file matching '{target_file_input}' in backup.")
            return
            
    else:
        filtered_items = backup_data.items()
        
    for rel_path, data in filtered_items:
        # ... logic continues ...
        full_path = os.path.join(src_dir, rel_path)
        
        if not os.path.exists(full_path):
            continue
            
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            content = "".join(lines)
            original_content = content
            
            modified_lines = False
            
            # --- 1. Restore Imports ---
            # data['imports'] matches list of {line, content}
            
            imports = data.get('imports', [])
            if imports and isinstance(imports[0], str):
                 imports = [{"line": 1, "content": s} for s in imports]

            if imports:
                has_import = re.search(r'from\s+["\']@/i18n["\']', content)
                if not has_import:
                    target_line = imports[0]['line'] - 1 
                    if target_line < 0: target_line = 0
                    if target_line > len(lines): target_line = len(lines)
                    
                    stmt = imports[0]['content']
                    lines.insert(target_line, stmt + "\n")
                    modified_lines = True
                    content = "".join(lines)

            # --- 2. Restore Hooks ---
            hooks = data.get('hooks', [])
            if hooks:
                has_hook = re.search(r'const\s+t\s*=\s*useTranslate', content)
                if not has_hook:
                    for h in hooks:
                        line_num = h['line'] - 1
                        stmt = h['content']
                        
                        if line_num < len(lines):
                            lines.insert(line_num, "  " + stmt + "\n") 
                        else:
                            lines.append(stmt + "\n")
                        modified_lines = True
                    
                    content = "".join(lines)

            # --- 3. Restore t(...) calls ---
            t_items = data.get('t_calls', []) or data.get('t_strings', [])
            T_items = set(data.get('T_components', [])) # Use set for fast lookup

            for s in t_items:
                if not s: continue
                escaped_s = re.escape(s)
                
                # Context 1: JSX Expression { s } -> { t(s) }
                # Check for optional t( prefix and ) suffix to avoid double wrapping
                pattern_jsx_expr = re.compile(rf'({{\s*)(t\s*\(\s*)?{escaped_s}(\s*\)\s*)?(\s*}})')
                
                def replace_jsx_expr(match):
                    prefix = match.group(2)
                    if prefix:
                        return match.group(0) # Already wrapped
                    else:
                        return f"{match.group(1)}t({s}){match.group(4)}"
                
                content = pattern_jsx_expr.sub(replace_jsx_expr, content)
                
                is_string_lit = (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'"))
                
                if is_string_lit:
                    inner_text = s[1:-1]
                    escaped_inner = re.escape(inner_text)
                    
                    pattern_attr = re.compile(rf'=\s*(["\']){escaped_inner}\1')
                    content = pattern_attr.sub(rf'={{t({s})}}', content)
                    
                    # Context 3: Raw usage func("foo") -> func(t("foo"))
                    # Check if already wrapped by t( ... )
                    pattern_raw = re.compile(rf'(t\s*\(\s*)?{escaped_s}')
                    
                    def replace_raw(match):
                        prefix = match.group(1)
                        if prefix:
                            return match.group(0)
                        else:
                            return f"t({s})"
                            
                    # Note: We must be careful not to double replace if Context 1 or 2 already handled it.
                    # But pattern_raw doesn't overlap with pattern_attr (quoted vs unquoted in regex perspective? no).
                    # 'escaped_s' includes quotes.
                    # If Context 1 handled it: `{ t("foo") }`.
                    # pattern_raw sees `t("foo")`. Prefix `t(` matches. Returns original. Safe.
                    
                    content = pattern_raw.sub(replace_raw, content)

                    # Context 4: Text content >foo< -> >{t("foo")}
                    # SKIP IF extracted as a T component
                    if inner_text in T_items:
                        continue

                    # Add lookarounds to ensure we are NOT inside a <T> tag
                    # (?<!<T>) ensures the opening > is not preceded by <T
                    # (?!/T>) ensures the closing < is not followed by /T>
                    pattern_text = re.compile(rf'(?<!<T>)>(\s*){escaped_inner}(\s*)<(?!/T>)')
                    content = pattern_text.sub(rf'>\1{{t({s})}}\2<', content)
            
            # --- 4. Restore <T> ---
            # Re-iterate T_items (sorted list preferred for deterministic behavior)
            sorted_T_items = sorted(list(T_items), key=len, reverse=True) # Match longer strings first?
            
            for s in sorted_T_items:
                if not s: continue
                escaped_s = re.escape(s)
                # Use negative lookahead (?!/T>) to verify we aren't already inside a <T> tag
                # We want to match >s< but NOT if it is >s</T>
                # Allow flexible whitespace around the content
                pattern_T = re.compile(rf'>(\s*){escaped_s}(\s*)<(?!/T>)')
                
                def replace_T(match):
                    # Preserve original surrounding whitespace if possible, or normalize?
                    # match.group(1) is pre-whitespace, match.group(2) is post-whitespace
                    # We wrap the content in <T>...</T>
                    return f">{match.group(1)}<T>{s}</T>{match.group(2)}<"

                content = pattern_T.sub(replace_T, content)

            # --- Cleanup ---
            content = re.sub(r't\(t\((["\'].*?["\'])\)\)', r't(\1)', content)
            content = re.sub(r't\(t\(([^"\'()]+?)\)\)', r't(\1)', content)
            # Remove {t("...")} if inside <T>
            content = re.sub(r'<T>\s*\{\s*t\s*\(\s*(["\'])(.*?)\1\s*\)\s*\}\s*</T>', r'<T>\2</T>', content)
            content = re.sub(r'<T>\s*<T>(.*?)</T>\s*</T>', r'<T>\1</T>', content, flags=re.DOTALL)

            if content != original_content:
                with open(full_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                restored_count += 1
                files_processed += 1
                print(f"Restored file: {rel_path}")

        except Exception as e:
            print(f"Error processing {rel_path}: {e}")

    print(f"Restoration complete. Modified {restored_count} files.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Restore i18n from backup.')
    parser.add_argument('path', nargs='?', help='Path to specific file to restore.', default=None)
    parser.add_argument('--backup', help='Path to backup file', default=None)
    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    src_dir = os.path.join(project_root, 'src')
    
    backup_file = os.path.join(project_root, 'i18n_backup.json')
    if args.backup:
        backup_file = args.backup
        
    print(f"Restoring from {backup_file}...")
    restore_translations(src_dir, backup_file, target_file_input=args.path)
