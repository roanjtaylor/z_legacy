"""Build a standalone FlappyBird.exe using PyInstaller."""

import subprocess
import sys

cmd = [
    sys.executable, "-m", "PyInstaller",
    "--onefile",
    "--windowed",
    "--name", "FlappyBird",
    "--add-data", "assets;assets",
    "--icon", "NONE",
    "main.py",
]

print("Building FlappyBird.exe ...")
print(f"Command: {' '.join(cmd)}\n")
subprocess.run(cmd, check=True)
print("\nDone! Executable is at: dist/FlappyBird.exe")
