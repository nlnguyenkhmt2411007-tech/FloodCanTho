
import { useCallback, useEffect, useRef, useState } from 'react';

interface IntroScreenProps {
  onFinish: () => void;
}

const INTRO_DURATION = 7000;
const FADE_DURATION = 650;

export default function IntroScreen({
  onFinish,
}: IntroScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSoundsRef = useRef<OscillatorNode[]>([]);
  const leavingRef = useRef(false);
  const onFinishRef = useRef(onFinish);

  // Giữ callback mới nhất, không làm reset intro
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  // Bắt đầu chuyển cảnh, tránh gọi nhiều lần
  const finishIntro = useCallback(() => {
    if (leavingRef.current) return;

    leavingRef.current = true;
    setIsLeaving(true);
  }, []);

  // Thanh tiến trình 7 giây
  useEffect(() => {
    const startTime = performance.now();
    let animationFrame = 0;

    const updateProgress = (now: number) => {
      if (leavingRef.current) return;

      const elapsed = now - startTime;
      const percent = Math.min(
        (elapsed / INTRO_DURATION) * 100,
        100
      );

      setProgress(percent);

      if (percent >= 100) {
        finishIntro();
      } else {
        animationFrame = requestAnimationFrame(
          updateProgress
        );
      }
    };

    animationFrame = requestAnimationFrame(
      updateProgress
    );

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [finishIntro]);

  // Đợi fade-out xong mới mở giao diện bản đồ
  useEffect(() => {
    if (!isLeaving) return;

    const timeout = window.setTimeout(() => {
      onFinishRef.current();
    }, FADE_DURATION);

    return () => window.clearTimeout(timeout);
  }, [isLeaving]);

  // Dừng các nốt nhạc đang phát
  const stopSounds = useCallback(() => {
    activeSoundsRef.current.forEach((oscillator) => {
      try {
        oscillator.stop();
      } catch {
        // Nốt đã kết thúc
      }
    });

    activeSoundsRef.current = [];
  }, []);

  // Phát hiệu ứng âm thanh khởi động
  const toggleSound = async () => {
    if (soundEnabled) {
      stopSounds();
      setSoundEnabled(false);
      return;
    }

    try {
      const context =
        audioContextRef.current ?? new AudioContext();

      audioContextRef.current = context;
      await context.resume();

      stopSounds();

      const now = context.currentTime;
      const frequencies = [220, 330, 440, 660, 880];

      frequencies.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        const startAt = now + index * 0.18;
        const endAt = startAt + 0.65;

        oscillator.type = 'sine';

        oscillator.frequency.setValueAtTime(
          frequency,
          startAt
        );

        gain.gain.setValueAtTime(
          0.001,
          startAt
        );

        gain.gain.exponentialRampToValueAtTime(
          0.045,
          startAt + 0.06
        );

        gain.gain.exponentialRampToValueAtTime(
          0.001,
          endAt
        );

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start(startAt);
        oscillator.stop(endAt);

        activeSoundsRef.current.push(oscillator);
      });

      setSoundEnabled(true);
    } catch (error) {
      console.error(
        'Không thể phát âm thanh intro:',
        error
      );
    }
  };

  // Dọn dẹp âm thanh khi rời intro
  useEffect(() => {
    return () => {
      stopSounds();
      void audioContextRef.current?.close();
    };
  }, [stopSounds]);

  return (
    <div
      className={`fixed inset-0 z-[9999] overflow-hidden bg-[#020b1d] ${
        isLeaving ? 'intro-exit' : 'intro-enter'
      }`}
      style={{
        pointerEvents: isLeaving ? 'none' : 'auto',
      }}
    >
      {/* ẢNH NỀN + CAMERA CINEMATIC */}
      <div
        className="intro-camera pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "url('/np-intro-clean.png')",
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* LỚP ÁNH SÁNG QUANH LOGO */}
      <div className="intro-glow pointer-events-none absolute inset-0" />

      {/* LUỒNG SÁNG QUÉT NGANG */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="intro-light-sweep absolute inset-y-0 w-[18%]" />
      </div>

      {/* HIỆU ỨNG VÒNG SÁNG */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="intro-pulse-ring h-[35vw] w-[35vw] max-h-[520px] max-w-[520px] rounded-full border border-cyan-300/20" />
      </div>

      {/* NÚT ĐIỀU KHIỂN */}
      <div className="absolute right-4 top-4 z-20 flex flex-wrap justify-end gap-2 sm:right-10 sm:top-8 sm:gap-3">
        <button
          type="button"
          onClick={toggleSound}
          className="rounded-full border border-cyan-400/50 bg-slate-950/75 px-4 py-2 text-xs text-white backdrop-blur-md transition hover:bg-cyan-900/60 sm:text-sm"
        >
          {soundEnabled
            ? '🔊 Tắt âm thanh'
            : '🔇 Bật âm thanh'}
        </button>

        <button
          type="button"
          onClick={finishIntro}
          className="rounded-full border border-cyan-400/60 bg-slate-950/80 px-4 py-2 text-xs font-medium text-white backdrop-blur-md transition hover:border-cyan-200 hover:bg-cyan-900/60 sm:px-5 sm:text-sm"
        >
          Bỏ qua giới thiệu →
        </button>
      </div>

      {/* THANH TIẾN TRÌNH */}
      <div className="absolute bottom-[7%] left-1/2 z-20 w-[min(440px,75vw)] -translate-x-1/2">
        <div className="h-[5px] overflow-hidden rounded-full bg-cyan-950/80 shadow-[0_0_15px_rgba(0,220,255,0.3)]">
          <div
            className="relative h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-300 to-cyan-100 shadow-[0_0_18px_#00dfff]"
            style={{
              width: `${progress}%`,
            }}
          >
            <div className="absolute -right-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow-[0_0_18px_6px_#00dfff]" />
          </div>
        </div>

        <p className="mt-4 text-center text-xs tracking-[0.2em] text-cyan-100 sm:text-sm">
          {progress >= 100
            ? 'HOÀN TẤT'
            : 'ĐANG KHỞI ĐỘNG...'}
        </p>
      </div>

      <style>{`
        /* Màn hình xuất hiện */
        @keyframes introEnter {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .intro-enter {
          animation: introEnter 0.6s ease-out both;
        }

        /* Fade-out trước khi vào bản đồ */
        @keyframes introExit {
          from {
            opacity: 1;
            transform: scale(1);
          }

          to {
            opacity: 0;
            transform: scale(1.025);
          }
        }

        .intro-exit {
          animation: introExit ${FADE_DURATION}ms ease-in-out forwards;
        }

        /* Camera zoom-out nhẹ */
        @keyframes introCamera {
          0% {
            transform: scale(1.12);
            filter: brightness(0.65) saturate(0.9);
          }

          35% {
            filter: brightness(1.15) saturate(1.25);
          }

          100% {
            transform: scale(1);
            filter: brightness(1) saturate(1);
          }
        }

        .intro-camera {
          animation: introCamera 7s ease-out forwards;
          will-change: transform, filter;
        }

        /* Ánh sáng ở trung tâm */
        @keyframes introGlow {
          0% { opacity: 0.08; }
          50% { opacity: 0.4; }
          100% { opacity: 0.12; }
        }

        .intro-glow {
          background: radial-gradient(
            circle at 50% 48%,
            rgba(0, 210, 255, 0.32),
            transparent 43%
          );
          animation: introGlow 3s ease-in-out infinite;
        }

        /* Dải sáng chạy ngang */
        @keyframes introLightSweep {
          0% {
            left: -30%;
            opacity: 0;
          }

          20% { opacity: 0.8; }
          75% { opacity: 0.6; }

          100% {
            left: 115%;
            opacity: 0;
          }
        }

        .intro-light-sweep {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(90, 230, 255, 0.16),
            transparent
          );
          filter: blur(30px);
          animation: introLightSweep 4.8s ease-in-out infinite;
        }

        /* Vòng sáng lan tỏa */
        @keyframes introPulseRing {
          0% {
            opacity: 0;
            transform: scale(0.65);
          }

          45% { opacity: 0.45; }

          100% {
            opacity: 0;
            transform: scale(1.45);
          }
        }

        .intro-pulse-ring {
          animation: introPulseRing 3.5s ease-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .intro-camera,
          .intro-glow,
          .intro-light-sweep,
          .intro-pulse-ring {
            animation: none !important;
          }

          .intro-enter,
          .intro-exit {
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}
