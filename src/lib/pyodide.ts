"use client";

/**
 * Python, in the browser.
 *
 * Pyodide is CPython compiled to WebAssembly. It is a few megabytes, so it is
 * loaded lazily — only when someone opens a Python problem — and cached by the
 * browser afterwards. Nothing is sent anywhere: the code runs on the user's
 * own machine, same as the SQL problems.
 *
 * No packages are installed. These problems are standard-library only, which
 * keeps the download to the interpreter alone rather than the interpreter plus
 * pandas and its dependencies.
 */

const PYODIDE_VERSION = "0.28.3";
const CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

interface PyodideApi {
  runPython: (code: string) => unknown;
  setStdout: (options: { batched: (line: string) => void }) => void;
  setStderr: (options: { batched: (line: string) => void }) => void;
}

declare global {
  interface Window {
    loadPyodide?: (options: { indexURL: string }) => Promise<PyodideApi>;
  }
}

let instance: PyodideApi | null = null;
let loading: Promise<PyodideApi> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Could not load Python.")),
      );
      if (window.loadPyodide) resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Python."));
    document.head.appendChild(script);
  });
}

export async function getPyodide(): Promise<PyodideApi> {
  if (instance) return instance;
  loading ??= (async () => {
    await loadScript(`${CDN}pyodide.js`);
    if (!window.loadPyodide) {
      throw new Error("Python failed to load. Check your connection.");
    }
    const py = await window.loadPyodide({ indexURL: CDN });
    instance = py;
    return py;
  })();
  return loading;
}

export interface PythonRun {
  ok: boolean;
  /** Anything the code printed. */
  output: string;
  /** Present when the code or an assertion failed. */
  error?: string;
}

/**
 * Runs the candidate's code, then the problem's assertions.
 *
 * Both go through one `exec` in a fresh namespace so the tests see whatever
 * the candidate defined. An AssertionError is reported as a failed check
 * rather than a crash, since that is what it means here.
 */
export async function runPython(
  userCode: string,
  tests: string,
): Promise<PythonRun> {
  const py = await getPyodide();

  const printed: string[] = [];
  py.setStdout({ batched: (line) => printed.push(line) });
  py.setStderr({ batched: (line) => printed.push(line) });

  // The harness is built in Python so a traceback stays a Python traceback —
  // marshalling exceptions through JS loses the line the failure happened on.
  const program = `
import json, traceback

_ns = {}
_result = {"ok": True, "error": None}

try:
    exec(compile(${JSON.stringify(userCode)}, "your_code.py", "exec"), _ns)
except Exception:
    _result["ok"] = False
    _result["error"] = "Your code didn't run:\\n\\n" + traceback.format_exc(limit=2)

if _result["ok"]:
    try:
        exec(compile(${JSON.stringify(tests)}, "checks.py", "exec"), _ns)
    except AssertionError as err:
        _result["ok"] = False
        _result["error"] = str(err) or "A check failed."
    except Exception:
        _result["ok"] = False
        _result["error"] = "The checks couldn't run against your code:\\n\\n" + traceback.format_exc(limit=2)

json.dumps(_result)
`;

  try {
    const raw = py.runPython(program);
    const parsed = JSON.parse(String(raw)) as {
      ok: boolean;
      error: string | null;
    };
    return {
      ok: parsed.ok,
      output: printed.join("\n"),
      error: parsed.error ?? undefined,
    };
  } catch (error) {
    return {
      ok: false,
      output: printed.join("\n"),
      error:
        error instanceof Error
          ? error.message
          : "Python stopped unexpectedly.",
    };
  }
}
