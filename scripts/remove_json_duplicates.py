
import json
import os
from collections import OrderedDict

def remove_duplicates(file_path):
    print(f"Processing {file_path}...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            # Load with object_pairs_hook=OrderedDict to maintain order if desired,
            # though standard dict in Python 3.7+ is ordered.
            # Using basic json.load will take the LAST key value for duplicates,
            # explicitly removing earlier ones. This is the standard behavior for "resolving" duplicates.
            data = json.load(f)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
            
        print(f"Successfully cleaned {file_path}")
        
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_path = os.path.join(script_dir, "..", "ui", "litellm-dashboard", "src", "i18n", "locales")
    base_path = os.path.normpath(base_path)
    files = ["en.json", "zh-CN.json"]
    
    for file_name in files:
        full_path = os.path.join(base_path, file_name)
        if os.path.exists(full_path):
            remove_duplicates(full_path)
        else:
            print(f"File not found: {full_path}")
