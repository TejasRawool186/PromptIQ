import os
import re

root_dir = r"d:\Projects\PromptIQ\app_build\frontend"

def replace_in_file(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"Skipping {file_path}: {e}")
        return

    modified = False
    
    # 1. Hex overrides (case-insensitive)
    if re.search(r"#06B6D4", content, re.IGNORECASE):
        content = re.sub(r"#06B6D4", "#ef4444", content, flags=re.IGNORECASE)
        modified = True
        
    if re.search(r"#0891B2", content, re.IGNORECASE):
        content = re.sub(r"#0891B2", "#b91c1c", content, flags=re.IGNORECASE)
        modified = True
        
    # 2. Key class names
    if "ice-glow" in content:
        content = content.replace("ice-glow", "red-glow")
        modified = True
        
    # 3. RGBA functions
    if "rgba(6, 182, 212" in content:
        content = content.replace("rgba(6, 182, 212", "rgba(239, 68, 68")
        modified = True
    if "rgba(6,182,212" in content:
        content = content.replace("rgba(6,182,212", "rgba(239,68,68")
        modified = True
        
    if "rgba(6, 182, 212" in content.lower():
        # Handle case variations
        content = re.sub(r"rgba\(6,\s*182,\s*212", "rgba(239, 68, 68", content, flags=re.IGNORECASE)
        modified = True

    if modified:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated: {file_path}")

# Run recursively
for dirpath, _, filenames in os.walk(root_dir):
    if "node_modules" in dirpath or ".next" in dirpath:
        continue
    for file in filenames:
        if file.endswith((".tsx", ".ts", ".css")):
            replace_in_file(os.path.join(dirpath, file))

print("Color replacement run finished.")
