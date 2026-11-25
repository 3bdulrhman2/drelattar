import re, subprocess, sys
subprocess.run(["adb", "shell", "uiautomator", "dump", "/sdcard/u.xml"], capture_output=True)
subprocess.run(["adb", "pull", "/sdcard/u.xml", "u.xml"], capture_output=True)
x = open("u.xml", encoding="utf-8").read()
for m in re.finditer(r'text="([^"]*)"[^>]*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', x):
    if m.group(1).strip().lower() in ("create", "allow", "yes", "ok"):
        a, b, c, d = map(int, m.groups()[1:])
        subprocess.run(["adb", "shell", "input", "tap", str((a + c) // 2), str((b + d) // 2)])
        print("tapped", m.group(1))
        sys.exit(0)
print("no dialog button found")
