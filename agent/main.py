# devlook/agent/main.py
import sys
import time
import json
from typing import Optional, Dict
import psutil

# Try pygetwindow (fallback for window title if platform‑specific APIs fail)
try:
    import pygetwindow as gw  # type: ignore
except Exception:
    gw = None

def _win_active_window() -> Dict[str, Optional[str]]:
    """Windows: prefer win32 APIs for accurate process name + title, else fallback."""
    try:
        import win32gui  # type: ignore
        import win32process  # type: ignore
    except Exception:
        title = None
        if gw:
            try:
                w = gw.getActiveWindow()
                title = w.title if w else None
            except Exception:
                pass
        return {"app_name": None, "window_title": title}

    hwnd = win32gui.GetForegroundWindow()
    if not hwnd:
        return {"app_name": None, "window_title": None}

    try:
        title = win32gui.GetWindowText(hwnd)
    except Exception:
        title = None

    try:
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        app = psutil.Process(pid).name()
    except Exception:
        app = None

    return {"app_name": app, "window_title": title}

def _mac_active_window() -> Dict[str, Optional[str]]:
    """macOS support (not used on Windows, but keeps code portable)."""
    app_name = None
    title = None
    try:
        from AppKit import NSWorkspace  # type: ignore
        ns_app = NSWorkspace.sharedWorkspace().frontmostApplication()
        if ns_app:
            app_name = ns_app.localizedName()
    except Exception:
        pass
    if not title and gw:
        try:
            w = gw.getActiveWindow()
            title = w.title if w else None
        except Exception:
            pass
    return {"app_name": app_name, "window_title": title}

def _linux_active_window() -> Dict[str, Optional[str]]:
    """Linux support (not used on Windows, but keeps code portable)."""
    title = None
    if gw:
        try:
            w = gw.getActiveWindow()
            title = w.title if w else None
        except Exception:
            pass
    return {"app_name": None, "window_title": title}

def get_active_window_info() -> Dict[str, Optional[str]]:
    """Cross‑platform wrapper."""
    platform = sys.platform
    if platform.startswith("win"):
        return _win_active_window()
    elif platform == "darwin":
        return _mac_active_window()
    else:
        return _linux_active_window()

def main() -> None:
    print("DevLook agent started. Press Ctrl+C to stop.")
    try:
        while True:
            info = get_active_window_info()
            print(json.dumps(info, ensure_ascii=False))
            time.sleep(5)
    except KeyboardInterrupt:
        print("\nDevLook agent stopped.")

if __name__ == "__main__":
    main()
