
import json
import os

def load_json(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return None

def compare_keys(file1_path, file2_path, name1="en", name2="zh-CN"):
    dict1 = load_json(file1_path)
    dict2 = load_json(file2_path)
    
    if dict1 is None or dict2 is None:
        return

    keys1 = set(dict1.keys())
    keys2 = set(dict2.keys())
    
    missing_in_2 = keys1 - keys2
    missing_in_1 = keys2 - keys1
    
    print("-" * 50)
    print(f"Comparison Summary:")
    print(f"Total keys in {name1}: {len(keys1)}")
    print(f"Total keys in {name2}: {len(keys2)}")
    print("-" * 50)
    
    if missing_in_2:
        print(f"\nKeys in {name1} but MISSING in {name2} ({len(missing_in_2)} keys):")
        for key in sorted(list(missing_in_2)):
            print(f"  - {key}")
    else:
        print(f"\nNo keys missing in {name2} (all keys from {name1} are present).")
        
    if missing_in_1:
        print(f"\nKeys in {name2} but MISSING in {name1} ({len(missing_in_1)} keys):")
        for key in sorted(list(missing_in_1)):
            print(f"  - {key}")
    else:
        print(f"\nNo keys missing in {name1} (all keys from {name2} are present).")
        
    print("-" * 50)

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    locales_dir = os.path.normpath(os.path.join(script_dir, "..", "ui", "litellm-dashboard", "src", "i18n", "locales"))
    
    en_path = os.path.join(locales_dir, "en.json")
    zh_path = os.path.join(locales_dir, "zh-CN.json")
    
    if os.path.exists(en_path) and os.path.exists(zh_path):
        compare_keys(en_path, zh_path, "en.json", "zh-CN.json")
    else:
        print(f"Error: One or more files not found in {locales_dir}")
