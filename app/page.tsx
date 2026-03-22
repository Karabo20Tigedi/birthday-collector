"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ── Confetti ────────────────────────────────────────────────────────
// Lightweight canvas-based confetti (no extra dependency needed)

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

function useConfetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const fire = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = [
      "#f472b6", "#a78bfa", "#fbbf24", "#2dd4bf",
      "#fb923c", "#60a5fa", "#f87171", "#34d399",
    ];

    const particles: Particle[] = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + 10,
      vx: (Math.random() - 0.5) * 8,
      vy: -(Math.random() * 14 + 8),
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
    }));

    let frame: number;
    const gravity = 0.25;

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      let alive = false;

      for (const p of particles) {
        if (p.opacity <= 0) continue;
        alive = true;
        p.x += p.vx;
        p.vy += gravity;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.008;

        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.globalAlpha = Math.max(0, p.opacity);
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx!.restore();
      }

      if (alive) {
        frame = requestAnimationFrame(animate);
      } else {
        ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      }
    }

    animate();
    return () => cancelAnimationFrame(frame);
  }, []);

  return { canvasRef, fire };
}

// ── Main Page ───────────────────────────────────────────────────────

export default function Home() {
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const { canvasRef, fire } = useConfetti();

  // Prevent future dates — compute today's date string
  const [maxDate, setMaxDate] = useState("");
  useEffect(() => {
    const today = new Date();
    setMaxDate(today.toISOString().split("T")[0]);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !birthday) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/birthday", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), birthday }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setStatus("success");
      fire();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  function handleReset() {
    setName("");
    setBirthday("");
    setStatus("idle");
    setErrorMsg("");
  }

  return (
    <>
      {/* Confetti canvas — sits above everything */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-50 pointer-events-none"
      />

      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        {/* Floating decorative elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <span className="absolute top-[10%] left-[8%] text-5xl animate-float opacity-30 select-none">
            🎂
          </span>
          <span className="absolute top-[15%] right-[12%] text-4xl animate-float-slow opacity-25 select-none">
            🎈
          </span>
          <span className="absolute bottom-[20%] left-[15%] text-4xl animate-float-slow opacity-25 select-none">
            🎁
          </span>
          <span className="absolute bottom-[15%] right-[10%] text-5xl animate-float opacity-20 select-none">
            🎉
          </span>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-orange-100/40 p-8 sm:p-10">

            {status === "success" ? (
              /* ── Success State ─────────────────────────── */
              <div className="text-center animate-fade-in-up">
                <div className="text-7xl mb-5">🎉</div>
                <h2 className="font-display text-2xl font-bold text-gray-800 mb-2">
                  Thank You, {name}!
                </h2>
                <p className="text-gray-500 mb-8">
                  Your birthday has been saved. We&apos;ll make sure to celebrate you!
                </p>
                <button onClick={handleReset} className="btn-submit">
                  Add Another Birthday
                </button>
              </div>
            ) : (
              /* ── Form State ────────────────────────────── */
              <>
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">🎂</div>
                  <h1 className="font-display text-3xl font-bold text-gray-800 mb-2">
                    When&apos;s Your Birthday?
                  </h1>
                  <p className="text-gray-500 text-sm">
                    Share your special day so we never miss it!
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-600 mb-1.5 ml-1"
                    >
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      placeholder="e.g. Jane Smith"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field"
                      disabled={status === "loading"}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="birthday"
                      className="block text-sm font-medium text-gray-600 mb-1.5 ml-1"
                    >
                      Birthday
                    </label>
                    <input
                      id="birthday"
                      type="date"
                      required
                      value={birthday}
                      max={maxDate}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="input-field"
                      disabled={status === "loading"}
                    />
                  </div>

                  {status === "error" && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading" || !name.trim() || !birthday}
                    className="btn-submit"
                  >
                    {status === "loading" ? (
                      <span className="inline-flex items-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      "Save My Birthday"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            Your info is only used to add a birthday reminder.
          </p>
        </div>
      </main>
    </>
  );
}
