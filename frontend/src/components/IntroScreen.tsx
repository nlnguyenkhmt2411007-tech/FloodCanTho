import { useCallback, useEffect, useRef, useState } from 'react';

interface IntroScreenProps {
  onFinish: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  started: boolean;
  onStart: () => void;
}

const INTRO_DURATION = 9000;
const FADE_DURATION = 700;

const CHAPTERS = [
  { start: 0, title: 'CẦN THƠ · MIỀN SÔNG NƯỚC', subtitle: 'Một góc nhìn mới về đô thị và dòng chảy', label: 'Khám phá đô thị' },
  { start: 1700, title: 'KHÔNG GIAN ĐỊA LÝ', subtitle: 'Kết nối địa hình, sông ngòi và dữ liệu không gian', label: 'Dữ liệu địa lý' },
  { start: 3400, title: 'PHÂN TÍCH NGẬP LỤT', subtitle: 'Khám phá các kịch bản ngập theo chu kỳ lặp lại', label: 'Kịch bản ngập' },
  { start: 5400, title: 'HỌC MÁY VÀ DỰ ĐOÁN', subtitle: 'So sánh ba thuật toán trên cùng nền dữ liệu', label: 'Machine Learning' },
  { start: 7400, title: 'FloodCanTho', subtitle: 'Nền tảng phân tích nguy cơ ngập tại Cần Thơ', label: 'Bắt đầu khám phá' },
] as const;

export default function IntroScreen({ onFinish, soundEnabled, onToggleSound, started, onStart }: IntroScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const leavingRef = useRef(false);
  const onFinishRef = useRef(onFinish);

  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  const finishIntro = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setIsLeaving(true);
  }, []);

  useEffect(() => {
    if (!started) return;
    const startedAt = performance.now();
    let frame = 0;
    const update = (now: number) => {
      if (leavingRef.current) return;
      const elapsed = now - startedAt;
      setProgress(Math.min(elapsed / INTRO_DURATION, 1));
      if (elapsed >= INTRO_DURATION) {
        setIsComplete(true);
      } else frame = window.requestAnimationFrame(update);
    };
    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [started]);

  useEffect(() => {
    if (!isLeaving) return;
    const timeout = window.setTimeout(() => onFinishRef.current(), reducedMotion ? 30 : FADE_DURATION);
    return () => window.clearTimeout(timeout);
  }, [isLeaving, reducedMotion]);

  const elapsed = progress * INTRO_DURATION;
  const chapterIndex = CHAPTERS.reduce((index, chapter, i) => elapsed >= chapter.start ? i : index, 0);
  const chapter = CHAPTERS[chapterIndex];
  const bridgeVisible = elapsed >= 3400;
  const isFinal = chapterIndex === CHAPTERS.length - 1;

  return (
    <div className={`fc-intro ${isLeaving ? 'fc-intro--exit' : ''} ${reducedMotion ? 'fc-intro--reduced' : ''}`} aria-label="Giới thiệu FloodCanTho">
      <div className="fc-intro__scene fc-intro__scene--city" aria-hidden="true" />
      <div className={`fc-intro__scene fc-intro__scene--bridge ${bridgeVisible ? 'is-visible' : ''}`} aria-hidden="true" />
      <div className="fc-intro__shade" aria-hidden="true" />
      <div className="fc-intro__sunlight" aria-hidden="true" />
      <div className="fc-intro__water" aria-hidden="true" />

      <svg className="fc-intro__geography" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path className="fc-intro__river-line" d="M-30 545 C 175 465, 280 640, 510 530 S 860 470, 1240 585" />
        <path className="fc-intro__river-line fc-intro__river-line--second" d="M-40 575 C 190 490, 310 670, 540 555 S 900 505, 1240 615" />        
        {[ [160,520], [490,535], [830,492], [1080,548] ].map(([x,y], i) => (
          <g key={i} className="fc-intro__geo-point" style={{ animationDelay: `${i * 0.4}s` }}>
            <circle cx={x} cy={y} r="15" className="fc-intro__geo-pulse" />
            <circle cx={x} cy={y} r="4" fill="#fff3d6" />
          </g>
        ))}
      </svg>

      <header className="fc-intro__header">
        <div className="fc-intro__brand"><span className="fc-intro__brand-mark">◈</span><span>FloodCanTho</span><span className="fc-intro__brand-separator" /> <span className="fc-intro__brand-note">PHÂN TÍCH NGẬP ĐÔ THỊ</span></div>
        <div className="fc-intro__controls">
          <button type="button" onClick={onToggleSound} aria-pressed={soundEnabled} className="fc-intro__button">{soundEnabled ? '♪ Tắt âm thanh' : '♫ Bật âm thanh'}</button>
          <button type="button" onClick={finishIntro} className="fc-intro__button fc-intro__button--primary">{isComplete ? "Vào website" : "Bỏ qua"} <span aria-hidden="true">→</span></button>
        </div>
      </header>

      {!started && (
        <div className="fc-intro__start-overlay">
          <div className="fc-intro__start-panel">
            <div className="fc-intro__start-eyebrow">CẦN THƠ · VIỆT NAM</div>
            <h2>Khám phá FloodCanTho</h2>
            <p>Hành trình khám phá dữ liệu không gian, nguy cơ ngập lụt và công nghệ học máy.</p>
            <button type="button" onClick={onStart}>
              ▶ Bắt đầu trải nghiệm
            </button>
            <span>Trải nghiệm có âm thanh · Có thể tắt bất kỳ lúc nào</span>
          </div>
        </div>
      )}

      <main className="fc-intro__content">
        <div className="fc-intro__eyebrow"><span className="fc-intro__eyebrow-line" /> DỰ ÁN PHÂN TÍCH KHÔNG GIAN VÀ HỌC MÁY</div>
        <div className="fc-intro__chapter" key={chapterIndex} aria-live="off">
          <h1 className={`fc-intro__title ${isFinal ? 'fc-intro__title--final' : ''}`}>{chapter.title}</h1>
          <p className="fc-intro__subtitle">{chapter.subtitle}</p>
        </div>
        <div className="fc-intro__features" aria-hidden="true">
          {chapterIndex === 1 && <><span>ĐỊA HÌNH</span><span>SÔNG NGÒI</span><span>DỮ LIỆU KHÔNG GIAN</span></>}
          {chapterIndex === 2 && <><span>2 NĂM</span><span>5 NĂM</span><span>10 NĂM</span><span>20 NĂM</span><span>50 NĂM</span><span>100 NĂM</span></>}
          {chapterIndex === 3 && <><span>RANDOM FOREST</span><span>DECISION TREE</span><span>EXTRA TREES</span></>}
          {isComplete && <button type="button" className="fc-intro__ready-button" onClick={finishIntro}>Sẵn sàng khám phá bản đồ <span aria-hidden="true">→</span></button>}
        </div>
      </main>

      <aside className="fc-intro__side-label" aria-hidden="true"><span className="fc-intro__side-dot" /> CẦN THƠ · VIỆT NAM</aside>

      <footer className="fc-intro__footer fc-intro__footer--cinematic">
        <div className="fc-intro__cinematic-wave" aria-hidden="true">
          <svg viewBox="0 0 1200 42" preserveAspectRatio="none">
            <path className="fc-intro__wave-back"
              d="M0 23 C100 8 200 38 300 23 S500 8 600 23 S800 38 900 23 S1100 8 1200 23" />
            <path className="fc-intro__wave-front"
              d="M0 27 C100 42 200 12 300 27 S500 42 600 27 S800 12 900 27 S1100 42 1200 27" />
          </svg>
        </div>

        <div className="fc-intro__cinematic-meta">
          <div className="fc-intro__cinematic-location">
            <span className="fc-intro__cinematic-dot" />
            <span>CẦN THƠ, VIỆT NAM</span>
          </div>

          <div className="fc-intro__cinematic-caption" key={chapterIndex}>
            {isComplete
              ? 'Sẵn sàng khám phá bản đồ ngập lụt'
              : chapterIndex === 0
                ? 'Hành trình khám phá miền sông nước'
                : chapterIndex === 1
                  ? 'Khám phá không gian địa lý'
                  : chapterIndex === 2
                    ? 'Tìm hiểu các kịch bản ngập lụt'
                    : chapterIndex === 3
                      ? 'Phân tích và dự đoán nguy cơ ngập'
                      : 'Khám phá FloodCanTho'}
          </div>
        </div>
      </footer>

      <style>{`
        .fc-intro{position:fixed;inset:0;z-index:9999;overflow:hidden;background:#273b41;color:#fffaf2;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;isolation:isolate}
        .fc-intro *{box-sizing:border-box}
        /* CINEMATIC V4 */

        .fc-intro__start-overlay{
          perspective:1200px;
        }

        .fc-intro__start-overlay::before{
          animation:
            fcV4Camera 24s cubic-bezier(.45,0,.55,1) infinite alternate;
          transform-origin:center 55%;
          filter:saturate(1.08) contrast(1.06);
        }

        .fc-intro__start-overlay::after{
          animation:fcV4Sunlight 8s ease-in-out infinite alternate;
        }

        .fc-intro__start-panel{
          transform-style:preserve-3d;
          animation:fcV4Entrance 1.6s cubic-bezier(.16,1,.3,1) both;
        }

        .fc-intro__start-eyebrow{
          animation:fcV4Reveal 1.1s .15s both;
        }

        .fc-intro__start-panel h2{
          font-size:clamp(42px,6vw,82px);
          line-height:1.1;
          margin:26px auto 24px;
          max-width:850px;
          animation:
            fcV4Reveal 1.4s .3s both,
            fcStartGold 9s 1.7s linear infinite;
        }

        .fc-intro__start-panel p{
          animation:fcV4Reveal 1.2s .55s both;
        }

        .fc-intro__start-panel button{
          overflow:hidden;
          isolation:isolate;
          animation:
            fcV4Reveal 1.2s .75s both,
            fcV4Breath 4s 2s ease-in-out infinite;
        }

        .fc-intro__start-panel button::before{
          content:"";
          position:absolute;
          inset:-80%;
          z-index:-1;
          background:linear-gradient(
            110deg,
            transparent 42%,
            rgba(255,255,255,.75) 50%,
            transparent 58%
          );
          transform:translateX(-80%) rotate(-12deg);
          animation:fcV4Shine 5s 2s ease-in-out infinite;
        }

        .fc-intro__start-panel button::after{
          content:"";
          position:absolute;
          inset:3px;
          border:1px solid rgba(255,255,255,.35);
          border-radius:inherit;
          pointer-events:none;
        }

        .fc-intro__start-panel>span{
          animation:fcV4Reveal 1.2s 1s both;
        }

        @keyframes fcV4Camera{
          0%{
            transform:scale(1.035) translate3d(-.6%,0,0);
          }
          100%{
            transform:scale(1.095) translate3d(.6%,-.5%,0);
          }
        }

        @keyframes fcV4Sunlight{
          0%{
            opacity:.3;
            transform:translate3d(-3%,1%,0);
          }
          100%{
            opacity:.8;
            transform:translate3d(3%,-1%,0);
          }
        }

        @keyframes fcV4Entrance{
          from{
            opacity:0;
            transform:translate3d(0,35px,0) scale(.97);
            filter:blur(10px);
          }
          to{
            opacity:1;
            transform:translate3d(0,0,0) scale(1);
            filter:blur(0);
          }
        }

        @keyframes fcV4Reveal{
          from{
            opacity:0;
            transform:translateY(25px);
            filter:blur(6px);
          }
          to{
            opacity:1;
            transform:translateY(0);
            filter:blur(0);
          }
        }

        @keyframes fcV4Breath{
          0%,100%{
            box-shadow:
              0 12px 40px rgba(0,0,0,.28),
              0 0 20px rgba(255,215,152,.15);
          }
          50%{
            box-shadow:
              0 16px 50px rgba(0,0,0,.35),
              0 0 42px rgba(255,215,152,.48);
          }
        }

        @keyframes fcV4Shine{
          0%,20%{
            transform:translateX(-90%) rotate(-12deg);
          }
          55%,100%{
            transform:translateX(90%) rotate(-12deg);
          }
        }

        @media(prefers-reduced-motion:reduce){
          .fc-intro__start-overlay::before,
          .fc-intro__start-overlay::after,
          .fc-intro__start-panel,
          .fc-intro__start-eyebrow,
          .fc-intro__start-panel h2,
          .fc-intro__start-panel p,
          .fc-intro__start-panel button,
          .fc-intro__start-panel button::before,
          .fc-intro__start-panel>span{
            animation:none!important;
          }
        }
        /* CINEMATIC START SCREEN */
        .fc-intro__start-overlay{
          position:absolute;inset:0;z-index:20;
          display:flex;align-items:center;justify-content:center;
          padding:clamp(20px,5vw,60px);
          overflow:hidden;
          background:
            linear-gradient(180deg,rgba(5,23,38,.24),rgba(5,23,38,.08) 40%,rgba(5,23,38,.55));
          isolation:isolate;
        }
        .fc-intro__start-overlay::before{
          content:"";position:absolute;inset:-5%;z-index:-2;
          background:url('/cantho-ninhkieu.jpg') center/cover no-repeat;
          animation:fcStartCamera 22s ease-in-out infinite alternate;
        }
        .fc-intro__start-overlay::after{
          content:"";position:absolute;inset:-25%;z-index:-1;
          background:radial-gradient(ellipse at 48% 43%,rgba(255,204,130,.18),transparent 45%);
          animation:fcStartLight 7s ease-in-out infinite alternate;
          pointer-events:none;
        }
        .fc-intro__start-panel{
          position:relative;
          width:min(900px,100%);
          padding:clamp(24px,5vw,65px) 20px;
          border:0;border-radius:0;
          background:transparent;
          box-shadow:none;
          text-align:center;
          animation:fcStartAppear 1.3s ease-out both;
        }
        .fc-intro__start-eyebrow{
          color:#f8d49e;font-size:clamp(10px,1vw,14px);
          letter-spacing:.45em;font-weight:700;
          text-shadow:0 2px 12px rgba(0,0,0,.5);
          animation:fcStartRise 1s ease-out both;
        }
        .fc-intro__start-panel h2{
          margin:28px 0 25px;
          font-size:clamp(46px,7vw,100px);
          line-height:1.08;
          font-weight:800;
          letter-spacing:-.06em;
          color:#ffe3ac;
          background:linear-gradient(110deg,#fff5df,#e5ae66,#fff4d7,#dca15b);
          background-size:220% 100%;
          -webkit-background-clip:text;
          background-clip:text;
          -webkit-text-fill-color:transparent;
          filter:drop-shadow(0 8px 24px rgba(0,0,0,.4));
          animation:fcStartRise 1.1s .15s ease-out both,fcStartGold 7s 1.4s linear infinite;
        }
        .fc-intro__start-panel p{
          max-width:590px;
          margin:0 auto 38px;
          color:#fffaf0;
          font-size:clamp(15px,1.5vw,21px);
          line-height:1.7;
          text-shadow:0 3px 16px rgba(0,0,0,.8);
          animation:fcStartRise 1s .35s ease-out both;
        }
        .fc-intro__start-panel button{
          position:relative;
          display:block;
          width:min(490px,100%);
          margin:auto;
          padding:21px 25px;
          border:1px solid rgba(255,255,255,.7);
          border-radius:999px;
          background:linear-gradient(110deg,#fff6dd,#f0c68b,#fff1cf);
          background-size:200% 100%;
          color:#173447;
          font-size:clamp(14px,1.3vw,19px);
          font-weight:800;
          cursor:pointer;
          box-shadow:0 12px 40px rgba(0,0,0,.28),0 0 35px rgba(255,215,152,.24);
          animation:fcStartRise 1s .55s ease-out both,fcStartButton 5s 1.5s ease-in-out infinite;
          transition:transform .25s,box-shadow .25s;
        }
        .fc-intro__start-panel button:hover{
          transform:translateY(-5px) scale(1.03);
          box-shadow:0 18px 55px rgba(0,0,0,.4),0 0 48px rgba(255,220,160,.6);
        }
        .fc-intro__start-panel button:focus-visible{
          outline:3px solid white;outline-offset:5px;
        }
        .fc-intro__start-panel>span{
          display:block;margin-top:28px;
          color:rgba(255,250,240,.9);
          font-size:12px;letter-spacing:.08em;
          text-shadow:0 2px 10px rgba(0,0,0,.8);
          animation:fcStartRise 1s .75s ease-out both;
        }
        @keyframes fcStartCamera{
          from{transform:scale(1.05) translateX(-1%)}
          to{transform:scale(1.14) translateX(1%)}
        }
        @keyframes fcStartLight{
          from{opacity:.35;transform:translateX(-3%)}
          to{opacity:.95;transform:translateX(3%)}
        }
        @keyframes fcStartAppear{
          from{opacity:0}
          to{opacity:1}
        }
        @keyframes fcStartRise{
          from{opacity:0;transform:translateY(30px);filter:blur(7px)}
          to{opacity:1;transform:translateY(0);filter:blur(0)}
        }
        @keyframes fcStartGold{
          from{background-position:100% 50%}
          to{background-position:-100% 50%}
        }
        @keyframes fcStartButton{
          0%,100%{background-position:0% 50%}
          50%{background-position:100% 50%}
        }
        @media(max-width:720px){
          .fc-intro__start-panel{padding:30px 5px}
          .fc-intro__start-panel h2{font-size:clamp(42px,11vw,68px)}
          .fc-intro__start-panel p{font-size:15px}
          .fc-intro__start-panel button{padding:18px}
        }
        @media(prefers-reduced-motion:reduce){
          .fc-intro__start-overlay::before,
          .fc-intro__start-overlay::after,
          .fc-intro__start-panel,
          .fc-intro__start-panel h2,
          .fc-intro__start-panel p,
          .fc-intro__start-panel button,
          .fc-intro__start-panel>span,
          .fc-intro__start-eyebrow{
            animation:none!important;
          }
        }
        .fc-intro__scene{position:absolute;inset:-3%;background-position:center;background-size:cover;will-change:transform,opacity}
        .fc-intro__scene--city{background-image:url('/cantho-ninhkieu.jpg');animation:fcCity 9s ease-out both}
        .fc-intro__scene--bridge{background-image:url('/cantho-bridge.webp');opacity:0;transform:scale(1.12);transition:opacity 1.35s ease-in-out;animation:fcBridge 9s ease-out both}
        .fc-intro__scene--bridge.is-visible{opacity:1}
        .fc-intro__shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(14,30,38,.77) 0%,rgba(19,32,42,.50) 45%,rgba(19,30,41,.18) 100%),linear-gradient(0deg,rgba(11,24,31,.84),transparent 35%,rgba(17,26,34,.34));pointer-events:none}
        .fc-intro__sunlight{position:absolute;inset:-30%;background:radial-gradient(ellipse at 72% 22%,rgba(255,187,111,.22),transparent 34%);mix-blend-mode:screen;animation:fcLight 6s ease-in-out infinite alternate;pointer-events:none}
        .fc-intro__water{position:absolute;left:-20%;bottom:-28%;width:140%;height:55%;background:repeating-linear-gradient(172deg,transparent 0 24px,rgba(255,226,173,.08) 25px,transparent 27px 54px);transform:rotate(-4deg);mask-image:linear-gradient(0deg,#000,transparent 85%);animation:fcWater 9s linear infinite;pointer-events:none}
        .fc-intro__geography{position:absolute;inset:0;width:100%;height:100%;opacity:.55;pointer-events:none}
        .fc-intro__river-line{fill:none;stroke:rgba(255,237,201,.55);stroke-width:1.5;stroke-dasharray:12 13;animation:fcRiver 14s linear infinite}
        .fc-intro__river-line--second{stroke:rgba(175,229,228,.4);stroke-width:1;animation-direction:reverse}
        .fc-intro__geo-point{animation:fcPoint 2.5s ease-in-out infinite alternate}
        .fc-intro__geo-pulse{fill:none;stroke:rgba(255,240,207,.65);stroke-width:1.2;transform-box:fill-box;transform-origin:center;animation:fcPulse 2.8s ease-out infinite}
        .fc-intro__header{position:absolute;top:0;left:0;right:0;z-index:3;display:flex;justify-content:space-between;align-items:center;gap:16px;padding:clamp(18px,3.5vw,48px) clamp(20px,5vw,76px)}
        .fc-intro__brand{display:flex;align-items:center;gap:10px;font-size:clamp(15px,1.5vw,22px);font-weight:750;letter-spacing:-.03em;white-space:nowrap}
        .fc-intro__brand-mark{font-size:25px;color:#f2c795;font-weight:400}
        .fc-intro__brand-separator{height:22px;width:1px;background:rgba(255,255,255,.4);margin:0 6px}
        .fc-intro__brand-note{font-size:10px;letter-spacing:.18em;font-weight:500;color:rgba(255,250,242,.75)}
        .fc-intro__controls{display:flex;gap:10px;align-items:center}
        .fc-intro__button{border:1px solid rgba(255,255,255,.42);border-radius:100px;padding:11px 17px;background:rgba(16,31,40,.35);backdrop-filter:blur(10px);color:#fffaf2;font-size:12px;font-weight:600;cursor:pointer;transition:background .25s,transform .25s}
        .fc-intro__button:hover{background:rgba(255,255,255,.2);transform:translateY(-2px)}
        .fc-intro__button:focus-visible{outline:3px solid #f4d0a1;outline-offset:3px}
        .fc-intro__button--primary{background:rgba(255,250,242,.92);color:#24363b;border-color:transparent}
        .fc-intro__button--primary:hover{background:#fff}
        .fc-intro__content{position:absolute;z-index:2;left:clamp(24px,9vw,144px);top:47%;transform:translateY(-45%);width:min(850px,78vw)}        
        .fc-intro__eyebrow{display:flex;align-items:center;gap:12px;font-size:clamp(9px,.9vw,12px);letter-spacing:.26em;font-weight:650;color:#ffe0b8;margin-bottom:24px;animation:fcRise .9s ease-out both}
        .fc-intro__eyebrow-line{display:block;width:36px;height:1px;background:#ffe0b8}
        .fc-intro__chapter{animation:fcRise .7s cubic-bezier(.2,.7,.2,1) both}
        .fc-intro__title{margin:0;max-width:900px;font-size:clamp(37px,6.3vw,98px);line-height:1.02;font-weight:750;letter-spacing:-.055em;text-wrap:balance;text-shadow:0 8px 38px rgba(0,0,0,.24)}
        .fc-intro__title--final{font-size:clamp(56px,9vw,136px);letter-spacing:-.07em}
        .fc-intro__subtitle{font-size:clamp(14px,1.6vw,21px);font-weight:400;line-height:1.55;max-width:570px;color:rgba(255,250,242,.9);margin:24px 0 0}
        .fc-intro__features{display:flex;flex-wrap:wrap;gap:9px;max-width:760px;min-height:40px;margin-top:32px}
        .fc-intro__features span{padding:9px 13px;border:1px solid rgba(255,243,217,.45);background:rgba(26,45,49,.28);backdrop-filter:blur(8px);border-radius:6px;font-size:10px;font-weight:700;letter-spacing:.11em;animation:fcRise .5s ease-out both}
        .fc-intro__features span:nth-child(2){animation-delay:.09s}.fc-intro__features span:nth-child(3){animation-delay:.18s}.fc-intro__features span:nth-child(4){animation-delay:.27s}.fc-intro__features span:nth-child(5){animation-delay:.36s}.fc-intro__features span:nth-child(6){animation-delay:.45s}
        .fc-intro__ready-button{background:rgba(244,207,157,.96);color:#25393d;border:1px solid transparent;border-radius:8px;padding:13px 20px;font:inherit;font-size:13px;font-weight:750;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.16);animation:fcRise .6s ease-out both;transition:transform .2s,background .2s}
        .fc-intro__ready-button:hover{transform:translateY(-2px);background:#fff2d8}
        .fc-intro__ready-button:focus-visible{outline:3px solid white;outline-offset:3px}
        .fc-intro__side-label{position:absolute;z-index:2;right:clamp(22px,5vw,76px);top:50%;display:flex;align-items:center;gap:9px;writing-mode:vertical-rl;letter-spacing:.24em;font-size:10px;color:rgba(255,250,242,.75)}
        .fc-intro__side-dot{height:7px;width:7px;border-radius:50%;background:#f3c98e}
        .fc-intro__footer{position:absolute;z-index:3;left:clamp(20px,5vw,76px);right:clamp(20px,5vw,76px);bottom:clamp(24px,5vh,55px)}
        .fc-intro__timeline{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;margin-bottom:17px}
        .fc-intro__step{display:flex;align-items:center;gap:10px;opacity:.45;transition:opacity .5s}
        .fc-intro__step.is-active{opacity:1}
        .fc-intro__step-number{font-size:11px;font-weight:750;color:#f6cf9e}
        .fc-intro__step-name{font-size:11px;font-weight:550;letter-spacing:.03em}
        .fc-intro__progress-track{height:3px;background:rgba(255,255,255,.35);overflow:hidden;border-radius:4px}
        .fc-intro__progress-fill{height:100%;background:linear-gradient(90deg,#f5b67b,#fff2cf);box-shadow:0 0 16px rgba(255,209,144,.65)}
        .fc-intro__footer-meta{display:flex;justify-content:space-between;margin-top:12px;font-size:10px;font-weight:600;letter-spacing:.15em;color:rgba(255,250,242,.8)}
                /* CINEMATIC FOOTER V5 */
        .fc-intro__footer--cinematic{
          position:absolute;
          z-index:3;
          left:clamp(24px,5vw,76px);
          right:clamp(24px,5vw,76px);
          bottom:clamp(20px,4vh,46px);
          pointer-events:none;
        }

        .fc-intro__cinematic-wave{
          height:38px;
          width:100%;
          overflow:hidden;
          opacity:.85;
        }

        .fc-intro__cinematic-wave svg{
          display:block;
          width:100%;
          height:100%;
          overflow:visible;
        }

        .fc-intro__wave-back,
        .fc-intro__wave-front{
          fill:none;
          stroke-linecap:round;
        }

        .fc-intro__wave-back{
          stroke:rgba(255,245,220,.4);
          stroke-width:1.1;
          animation:fcV5WaveBack 8s ease-in-out infinite alternate;
        }

        .fc-intro__wave-front{
          stroke:rgba(244,202,145,.88);
          stroke-width:1.7;
          animation:fcV5WaveFront 6s ease-in-out infinite alternate;
        }

        .fc-intro__cinematic-meta{
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:24px;
          padding-top:13px;
        }

        .fc-intro__cinematic-location{
          display:flex;
          align-items:center;
          gap:10px;
          color:#f5dfbd;
          font-size:10px;
          font-weight:700;
          letter-spacing:.2em;
          white-space:nowrap;
        }

        .fc-intro__cinematic-dot{
          width:6px;
          height:6px;
          flex:none;
          border-radius:50%;
          background:#f4d4a5;
          box-shadow:0 0 12px rgba(244,212,165,.45);
        }

        .fc-intro__cinematic-caption{
          color:rgba(255,250,241,.9);
          font-size:11px;
          font-weight:500;
          letter-spacing:.06em;
          text-align:right;
          text-shadow:0 2px 10px rgba(0,0,0,.5);
          animation:fcV5Caption .65s ease-out both;
        }

        @keyframes fcV5WaveBack{
          from{transform:translateY(-4px) scaleY(.8)}
          to{transform:translateY(4px) scaleY(1.12)}
        }

        @keyframes fcV5WaveFront{
          from{transform:translateY(4px) scaleY(1.12)}
          to{transform:translateY(-4px) scaleY(.8)}
        }

        @keyframes fcV5Caption{
          from{opacity:0;transform:translateY(8px)}
          to{opacity:1;transform:translateY(0)}
        }

        @media(max-width:720px){
          .fc-intro__cinematic-meta{
            flex-direction:column;
            align-items:flex-start;
            gap:8px;
          }
          .fc-intro__cinematic-caption{
            text-align:left;
            font-size:10px;
          }
          .fc-intro__cinematic-wave{
            height:26px;
          }
        }

        @media(prefers-reduced-motion:reduce){
          .fc-intro__wave-back,
          .fc-intro__wave-front,
          .fc-intro__cinematic-caption{
            animation:none!important;
          }
        }
.fc-intro--exit{animation:fcExit ${FADE_DURATION}ms ease-in-out forwards;pointer-events:none}
        @keyframes fcCity{from{transform:scale(1.13) translateX(-1.5%)}to{transform:scale(1.02) translateX(1%)}}
        @keyframes fcBridge{from{transform:scale(1.14) translateX(2%)}to{transform:scale(1.03) translateX(-1%)}}
        @keyframes fcLight{from{opacity:.45;transform:translateX(-4%)}to{opacity:1;transform:translateX(4%)}}
        @keyframes fcWater{from{background-position:0 0}to{background-position:0 160px}}
        @keyframes fcRiver{to{stroke-dashoffset:-200}}
        @keyframes fcPulse{0%{transform:scale(.5);opacity:1}100%{transform:scale(2.1);opacity:0}}
        @keyframes fcPoint{from{opacity:.3}to{opacity:1}}
        @keyframes fcRise{from{opacity:0;transform:translateY(24px);filter:blur(5px)}to{opacity:1;transform:translateY(0);filter:blur(0)}}
        @keyframes fcExit{to{opacity:0;transform:scale(1.02)}}
        @media(max-width:720px){.fc-intro__brand-note,.fc-intro__brand-separator,.fc-intro__side-label{display:none}.fc-intro__header{align-items:flex-start}.fc-intro__brand{padding-top:8px}.fc-intro__controls{gap:6px}.fc-intro__button{font-size:10px;padding:10px}.fc-intro__content{left:24px;top:46%;width:calc(100% - 48px)}.fc-intro__title{font-size:clamp(36px,9vw,66px)}.fc-intro__subtitle{font-size:14px}.fc-intro__step{display:block}.fc-intro__step-name{display:none}.fc-intro__timeline{gap:6px}.fc-intro__footer-meta{font-size:9px}.fc-intro__eyebrow{font-size:9px;letter-spacing:.12em}}
        @media(max-height:550px){.fc-intro__content{top:46%}.fc-intro__eyebrow{margin-bottom:10px}.fc-intro__title{font-size:clamp(30px,5vw,55px)}.fc-intro__subtitle{margin-top:10px}.fc-intro__features{margin-top:12px}.fc-intro__footer{bottom:14px}}
        @media(prefers-reduced-motion:reduce){.fc-intro__scene,.fc-intro__sunlight,.fc-intro__water,.fc-intro__river-line,.fc-intro__geo-point,.fc-intro__geo-pulse,.fc-intro__chapter,.fc-intro__eyebrow,.fc-intro__features span{animation:none!important}.fc-intro__scene--bridge{transition:none!important}        /* CINEMATIC FOOTER V5 */
        .fc-intro__footer--cinematic{
          position:absolute;
          z-index:3;
          left:clamp(24px,5vw,76px);
          right:clamp(24px,5vw,76px);
          bottom:clamp(20px,4vh,46px);
          pointer-events:none;
        }

        .fc-intro__cinematic-wave{
          height:38px;
          width:100%;
          overflow:hidden;
          opacity:.85;
        }

        .fc-intro__cinematic-wave svg{
          display:block;
          width:100%;
          height:100%;
          overflow:visible;
        }

        .fc-intro__wave-back,
        .fc-intro__wave-front{
          fill:none;
          stroke-linecap:round;
        }

        .fc-intro__wave-back{
          stroke:rgba(255,245,220,.4);
          stroke-width:1.1;
          animation:fcV5WaveBack 8s ease-in-out infinite alternate;
        }

        .fc-intro__wave-front{
          stroke:rgba(244,202,145,.88);
          stroke-width:1.7;
          animation:fcV5WaveFront 6s ease-in-out infinite alternate;
        }

        .fc-intro__cinematic-meta{
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:24px;
          padding-top:13px;
        }

        .fc-intro__cinematic-location{
          display:flex;
          align-items:center;
          gap:10px;
          color:#f5dfbd;
          font-size:10px;
          font-weight:700;
          letter-spacing:.2em;
          white-space:nowrap;
        }

        .fc-intro__cinematic-dot{
          width:6px;
          height:6px;
          flex:none;
          border-radius:50%;
          background:#f4d4a5;
          box-shadow:0 0 12px rgba(244,212,165,.45);
        }

        .fc-intro__cinematic-caption{
          color:rgba(255,250,241,.9);
          font-size:11px;
          font-weight:500;
          letter-spacing:.06em;
          text-align:right;
          text-shadow:0 2px 10px rgba(0,0,0,.5);
          animation:fcV5Caption .65s ease-out both;
        }

        @keyframes fcV5WaveBack{
          from{transform:translateY(-4px) scaleY(.8)}
          to{transform:translateY(4px) scaleY(1.12)}
        }

        @keyframes fcV5WaveFront{
          from{transform:translateY(4px) scaleY(1.12)}
          to{transform:translateY(-4px) scaleY(.8)}
        }

        @keyframes fcV5Caption{
          from{opacity:0;transform:translateY(8px)}
          to{opacity:1;transform:translateY(0)}
        }

        @media(max-width:720px){
          .fc-intro__cinematic-meta{
            flex-direction:column;
            align-items:flex-start;
            gap:8px;
          }
          .fc-intro__cinematic-caption{
            text-align:left;
            font-size:10px;
          }
          .fc-intro__cinematic-wave{
            height:26px;
          }
        }

        @media(prefers-reduced-motion:reduce){
          .fc-intro__wave-back,
          .fc-intro__wave-front,
          .fc-intro__cinematic-caption{
            animation:none!important;
          }
        }
.fc-intro--exit{animation-duration:.01ms!important}}
      `}</style>
    </div>
  );
}
