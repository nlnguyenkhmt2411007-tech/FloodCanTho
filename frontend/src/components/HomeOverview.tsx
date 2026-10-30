import React from 'react';
import { ArrowRight, BookOpen, ChevronDown, MapPin, Waves, ChartNoAxesCombined, ShieldCheck, Code2, Map, Layers3, LocateFixed } from 'lucide-react';
import { ActiveTab } from './Header';
import { ScientificNotice } from './ScientificNotice';

interface HomeOverviewProps { onNavigate: (tab: ActiveTab) => void; }
const features = [
 { title: 'Bản đồ ngập', description: 'Quan sát độ sâu ngập theo từng kịch bản mô phỏng.', icon: Map, tab: 'map' as ActiveTab, number: '01' },
 { title: 'Dự đoán ngập', description: 'Thử nghiệm và đối chiếu kết quả từ ba mô hình học máy.', icon: ChartNoAxesCombined, tab: 'ml' as ActiveTab, number: '02' },
 { title: 'Giới thiệu dự án', description: 'Tìm hiểu mục tiêu, dữ liệu và phương pháp nghiên cứu.', icon: BookOpen, tab: 'about' as ActiveTab, number: '03' },
 { title: 'Tài liệu API', description: 'Xem hướng dẫn tích hợp và các nguồn dữ liệu.', icon: Code2, tab: 'api' as ActiveTab, number: '04' },
];
export const HomeOverview: React.FC<HomeOverviewProps> = ({ onNavigate }) => (
 <div className="fc-home-v5 mx-auto max-w-[1700px] pb-12">
  <section className="fc-v5-hero relative isolate overflow-hidden rounded-[22px] border border-[#d6e6ed] bg-[#d6eaf3] shadow-[0_20px_60px_rgba(20,69,94,.12)] sm:rounded-[32px]">
   <div className="fc-v5-photo absolute inset-0" style={{backgroundImage:"url('/cantho-flood-street.jpg')"}} aria-hidden="true" />
   <div className="fc-v5-veil absolute inset-0" aria-hidden="true" />
   <div className="fc-v5-sunlight absolute inset-0 pointer-events-none" aria-hidden="true" />
   <div className="fc-v5-ripple pointer-events-none absolute bottom-[12%] left-[34%] z-[1] h-36 w-36 rounded-full border border-cyan-100/25" aria-hidden="true" />
   <div className="fc-v5-ripple fc-v5-ripple-delayed pointer-events-none absolute bottom-[12%] left-[34%] z-[1] h-36 w-36 rounded-full border border-cyan-100/25" aria-hidden="true" />
   <div className="fc-v5-horizon absolute inset-x-0 bottom-0 h-[35%] pointer-events-none" aria-hidden="true" />
   <div className="relative z-10 grid min-h-[690px] grid-cols-1 gap-7 px-6 pb-36 pt-10 sm:px-10 sm:pt-14 lg:min-h-[660px] lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-10 lg:px-14 xl:grid-cols-[minmax(0,1fr)_345px] xl:px-16">
    <div className="fc-v5-enter max-w-[830px]">
     <div className="flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[.16em] text-white/90 sm:text-xs"><Waves className="h-5 w-5"/> FLOODCANTHO · NGHIÊN CỨU NGẬP LỤT ĐÔ THỊ</div>
     <div className="mt-12 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#f6ce89] sm:mt-16 sm:text-xs"><span className="h-px w-10 bg-[#bc8a53]"/> BẢN ĐỒ NGẬP · PHÂN TÍCH · HỌC MÁY</div>
     <h1 className="mt-6 text-[clamp(37px,4.4vw,68px)] font-extrabold leading-[1.11] tracking-[-.055em] text-white">Khám phá bản đồ ngập.<br/><span className="fc-v5-heading-gradient">Phân tích và dự đoán ngập tại Cần Thơ.</span></h1>
     <p className="mt-7 max-w-[650px] text-[15px] font-medium leading-7 text-white/90 sm:text-lg sm:leading-8">Trực quan hóa các kịch bản ngập mô phỏng, khảo sát độ sâu ngập trên tuyến đường và thử nghiệm ba mô hình học máy trong phạm vi nghiên cứu tại Cần Thơ.</p>
     <div className="mt-9 flex flex-wrap gap-3">
      <button type="button" onClick={()=>onNavigate('map')} className="fc-v5-primary group inline-flex items-center gap-3 rounded-full px-7 py-4 text-sm font-bold text-white shadow-[0_12px_28px_rgba(0,101,148,.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#087da4]"><MapPin className="h-5 w-5"/> Khám phá bản đồ ngập <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></button>
      <button type="button" onClick={()=>onNavigate('ml')} className="fc-v5-secondary group inline-flex items-center gap-3 rounded-full border border-white/90 bg-white/90 px-7 py-4 text-sm font-bold text-[#0e4568] shadow-[0_9px_25px_rgba(20,68,91,.12)] backdrop-blur-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#087da4]"><ChartNoAxesCombined className="h-5 w-5"/> Thử dự đoán</button>
     </div>
     <p className="mt-6 max-w-[650px] text-[11px] font-medium leading-5 text-white/75">Ảnh minh họa tình trạng ngập, không thể hiện hiện trạng hôm nay. Kết quả nghiên cứu không phải cảnh báo thời gian thực.</p>
    </div>
    <aside className="fc-v5-glass fc-v5-enter mt-1 rounded-[27px] border border-white/30 p-5 text-white shadow-[0_18px_50px_rgba(2,23,42,.25)] sm:p-6 lg:mt-0" aria-label="Chức năng nghiên cứu ngập lụt">
     <div className="flex items-start gap-3 pb-5"><div className="fc-v5-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"><MapPin className="h-6 w-6"/></div><div><h2 className="text-xl font-extrabold">Nghiên cứu ngập tại Cần Thơ</h2><p className="mt-1 text-xs leading-5 text-white/75">Bản đồ tương tác · Dữ liệu mô phỏng</p></div></div>
     <div className="space-y-0 border-t border-white/25">
      <div className="flex gap-3 border-b border-white/20 py-4"><div className="fc-v5-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"><Waves className="h-6 w-6"/></div><div><h3 className="text-sm font-bold">Bản đồ ngập mô phỏng</h3><p className="mt-1 text-xs leading-5 text-white/75">Quan sát độ sâu ngập theo kịch bản nghiên cứu</p></div></div>
      <div className="flex gap-3 border-b border-white/20 py-4"><div className="fc-v5-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"><ShieldCheck className="h-6 w-6"/></div><div><h3 className="text-sm font-bold">Phân tích tuyến đường</h3><p className="mt-1 text-xs leading-5 text-white/75">Khảo sát mức ngập mô phỏng dọc tuyến đường</p></div></div>
      <div className="flex gap-3 pt-4"><div className="fc-v5-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"><Layers3 className="h-6 w-6"/></div><div><h3 className="text-sm font-bold">Dự đoán bằng học máy</h3><p className="mt-1 text-xs leading-5 text-white/75">Thử nghiệm Random Forest, Decision Tree và Extra Trees</p></div></div>
     </div>
    </aside>
   </div>
   <div className="fc-v5-region absolute bottom-[93px] left-8 z-20 hidden items-center gap-3 rounded-2xl border border-white/35 bg-[#063c61]/75 px-5 py-3 text-white shadow-lg backdrop-blur-md md:flex"><LocateFixed className="h-7 w-7"/><div><p className="text-sm font-bold">Phạm vi nghiên cứu</p><p className="text-xs text-white/90">Khu vực trung tâm Cần Thơ</p></div></div>
   <div className="absolute bottom-[96px] left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 text-xs font-semibold text-[#e7f8ff]"><ChevronDown className="fc-v5-scroll h-7 w-7 rounded-full border border-white/75 bg-[#0b4665]/65 p-1"/><span className="rounded-full bg-[#0b4665]/65 px-3 py-1 backdrop-blur-sm">Cuộn để khám phá</span></div>
   <svg className="fc-v5-waves pointer-events-none absolute bottom-0 left-0 z-10 h-[135px] w-full" viewBox="0 0 1440 140" preserveAspectRatio="none" aria-hidden="true">
    <path className="fc-v5-wave-a" d="M0 35 C150 100 260 0 415 66 S700 118 890 58 S1190 0 1440 75 L1440 140 L0 140Z" fill="#25b8e7" fillOpacity=".25"/>
    <path className="fc-v5-wave-b" d="M0 76 C190 6 260 125 475 82 S760 35 950 95 S1220 48 1440 65 L1440 140 L0 140Z" fill="#a4e8f8" fillOpacity=".54"/>
    <path d="M0 98 C165 48 290 145 480 102 S765 70 960 109 S1240 78 1440 92 L1440 140 L0 140Z" fill="#f5fbff"/>
    <path className="fc-v5-wave-line" d="M0 76 C190 6 260 125 475 82 S760 35 950 95 S1220 48 1440 65" stroke="white" strokeWidth="2" strokeOpacity=".9" fill="none"/>
   </svg>
  </section>
  <section className="fc-v5-features relative z-20 -mt-2 grid grid-cols-1 gap-4 px-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Các chức năng chính">
   {features.map((item,index)=>{const Icon=item.icon;return <button type="button" key={item.tab} onClick={()=>onNavigate(item.tab)} style={{animationDelay:`${index*110}ms`}} className="fc-v5-card group flex min-h-[170px] flex-col rounded-[23px] border border-[#e0edf2] bg-white/95 p-5 text-left shadow-[0_12px_32px_rgba(25,89,116,.09)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#087da4]">
    <div className="flex items-start gap-4"><span className="fc-v5-feature-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e8f7fd] to-[#cdeaf6] text-[#087da9]"><Icon className="h-7 w-7"/></span><div className="min-w-0"><div className="mb-1 flex items-center justify-between gap-2"><h2 className="text-base font-extrabold text-[#103d5a]">{item.title}</h2><span className="text-[10px] font-bold text-[#a5bbc8]">{item.number}</span></div><p className="text-xs leading-5 text-[#59758a]">{item.description}</p></div></div>
    <div className="mt-auto flex justify-end pt-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d7f0fb] text-[#0b79a4] transition-transform group-hover:translate-x-1"><ArrowRight className="h-4 w-4"/></span></div>
   </button>})}
  </section>
  <div className="mt-8 flex items-center justify-center gap-4 text-center text-[10px] font-bold uppercase tracking-[.22em] text-[#7c9baa] sm:text-xs"><Waves className="h-5 w-5 text-[#0e9bc9]"/> DỮ LIỆU · KHOA HỌC · CỘNG ĐỒNG <span className="hidden h-px flex-1 bg-[#c9dce6] sm:block"/><span className="hidden sm:inline">VÌ MỘT CẦN THƠ BỀN VỮNG</span></div>
  <section className="mt-10 grid items-center gap-7 overflow-hidden rounded-[28px] border border-[#d9e8e9] bg-[#eff7f7] p-5 sm:p-7 lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:p-10">
   <div className="relative min-h-[270px] overflow-hidden rounded-[21px] sm:min-h-[340px]"><div className="fc-v5-story absolute inset-0 bg-cover bg-center" style={{backgroundImage:"url('/cantho-ninhkieu.jpg')"}} role="img" aria-label="Khung cảnh đô thị Cần Thơ"/><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#103a48]/85 to-transparent px-6 pb-6 pt-20 text-sm font-semibold text-white">Cần Thơ · Không gian đô thị và sông nước</div></div>
   <div className="space-y-5 px-1 py-4 sm:px-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-[#a17b47]"><Layers3 className="h-4 w-4"/> TỪ DỮ LIỆU ĐẾN TRỰC QUAN</p><h2 className="max-w-xl text-3xl font-bold leading-tight tracking-tight text-[#153d4c] sm:text-4xl">Từ bản đồ ngập đến phân tích dữ liệu.</h2><p className="max-w-xl text-sm leading-8 text-[#58727c] sm:text-base">FloodCanTho kết hợp dữ liệu không gian, các kịch bản ngập mô phỏng và mô hình học máy để hỗ trợ quan sát, so sánh và tìm hiểu sự khác biệt giữa các khu vực trong phạm vi thử nghiệm.</p><div className="flex flex-wrap gap-3 pt-2 text-xs font-semibold text-[#246b7a]"><span className="rounded-full border border-[#c9e3e5] bg-white px-4 py-2">Bản đồ tương tác</span><span className="rounded-full border border-[#c9e3e5] bg-white px-4 py-2">Kịch bản mô phỏng</span><span className="rounded-full border border-[#c9e3e5] bg-white px-4 py-2">So sánh mô hình</span></div><button type="button" onClick={()=>onNavigate('about')} className="group inline-flex items-center gap-2 pt-3 text-sm font-bold text-[#11677e] hover:text-[#0b4b60]">Tìm hiểu phương pháp nghiên cứu <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></button></div>
  </section>
      {/* RESEARCH DETAILS */}
      <section className="rounded-[26px] border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900 sm:p-8">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf1eb] text-[#315d5c] dark:bg-slate-800 dark:text-[#e9c38d]">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Thông tin nghiên cứu
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Phạm vi thử nghiệm, giới hạn và các thông tin kỹ thuật
                </p>
              </div>
            </div>

            <ChevronDown className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
          </summary>

          <div className="mt-7 space-y-6 border-t border-slate-200 pt-6 dark:border-slate-700">
            <ScientificNotice compact={false} />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/50">
                <h3 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">
                  Phạm vi nghiên cứu thử nghiệm
                </h3>

                <p className="mb-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Khu vực nội ô trung tâm Cần Thơ, trong phạm vi
                  tọa độ WGS84:
                </p>

                <div className="space-y-1 font-mono text-xs leading-6 text-slate-600 dark:text-slate-300">
                  <p>Kinh độ: 105.737369 – 105.763636</p>
                  <p>Vĩ độ: 10.032220 – 10.060782</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/50">
                <h3 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">
                  Các mức ngập trong dữ liệu thử nghiệm
                </h3>

                <div className="space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  <p>Không ngập: dưới 0,05 m</p>
                  <p>Ngập nhẹ: từ 0,05 m đến dưới 0,30 m</p>
                  <p>Ngập nặng: từ 0,30 m trở lên</p>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Các ngưỡng được sử dụng trong phạm vi đề tài nghiên cứu.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('api')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#9a7145] hover:underline dark:text-[#e9c38d]"
            >
              <Code2 className="h-4 w-4" />
              Xem tài liệu kỹ thuật
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </details>
      </section>

  <style>{`
    .fc-v5-photo{background-size:cover;background-position:center 56%;animation:fcV5Camera 30s ease-in-out infinite alternate;will-change:transform}
    .fc-v5-veil{background:linear-gradient(90deg,rgba(3,25,46,.84) 0%,rgba(5,35,59,.73) 31%,rgba(6,40,64,.30) 60%,rgba(3,28,49,.18) 100%)}
    .fc-v5-sunlight{background:radial-gradient(ellipse at 50% 26%,rgba(255,238,186,.06),transparent 47%);animation:fcV5Light 11s ease-in-out infinite alternate}
    .fc-v5-horizon{background:linear-gradient(0deg,rgba(2,32,56,.32),transparent)}
    .fc-v5-heading-gradient{background:linear-gradient(100deg,#7be5ff,#25c3f7,#d4f7ff);-webkit-background-clip:text;background-clip:text;color:transparent}
    .fc-v5-glass{background:linear-gradient(145deg,rgba(6,42,71,.76),rgba(9,59,91,.58));backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);animation:fcV5Float 9s ease-in-out infinite alternate}
    .fc-v5-icon{background:rgba(227,246,255,.17);color:#8ce8ff;box-shadow:0 5px 18px rgba(24,100,140,.09)}
    .fc-v5-primary{background:linear-gradient(135deg,#04a6cc,#036b9a);transition:transform .3s,filter .3s,box-shadow .3s}
    .fc-v5-primary:hover{transform:translateY(-4px);filter:brightness(1.08);box-shadow:0 16px 30px rgba(0,101,148,.3)}
    .fc-v5-secondary{transition:transform .3s,background .3s}.fc-v5-secondary:hover{transform:translateY(-4px);background:white}
    .fc-v5-enter{animation:fcV5Enter 1s cubic-bezier(.2,.8,.2,1) both}.fc-v5-glass.fc-v5-enter{animation:fcV5Enter 1s .2s both,fcV5Float 9s 1.2s ease-in-out infinite alternate}
    .fc-v5-card{animation:fcV5Enter .85s cubic-bezier(.2,.8,.2,1) both;transition:transform .35s,box-shadow .35s,border-color .35s}.fc-v5-card:hover{transform:translateY(-7px);box-shadow:0 20px 40px rgba(25,89,116,.15);border-color:#a8d9eb}
    .fc-v5-feature-icon{transition:transform .4s}.fc-v5-card:hover .fc-v5-feature-icon{transform:rotate(-5deg) scale(1.08)}
    .fc-v5-wave-a{animation:fcV5WaveA 8s ease-in-out infinite alternate;transform-origin:center bottom}.fc-v5-wave-b{animation:fcV5WaveB 10s ease-in-out infinite alternate;transform-origin:center bottom}.fc-v5-wave-line{animation:fcV5WaveA 8s ease-in-out infinite alternate;transform-origin:center bottom}
    .fc-v5-scroll{animation:fcV5Scroll 2.2s ease-in-out infinite}.fc-v5-story{transition:transform 1.2s}.fc-v5-story:hover{transform:scale(1.05)}
    .fc-v5-ripple{animation:fcV5Ripple 6s ease-out infinite;transform-origin:center;opacity:0}
    .fc-v5-ripple-delayed{animation-delay:3s}
    @keyframes fcV5Ripple{0%{transform:scale(.35);opacity:0}20%{opacity:.55}100%{transform:scale(2.4);opacity:0}}
    @keyframes fcV5Camera{from{transform:scale(1.025) translateX(-.6%)}to{transform:scale(1.105) translateX(.6%)}}
    @keyframes fcV5Light{from{opacity:.45;transform:translateX(-2%)}to{opacity:.9;transform:translateX(2%)}}
    @keyframes fcV5Float{from{transform:translateY(0)}to{transform:translateY(-9px)}}
    @keyframes fcV5Enter{from{opacity:0;transform:translateY(23px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fcV5WaveA{from{transform:translateX(-1%) scaleY(1)}to{transform:translateX(1%) scaleY(.86)}}
    @keyframes fcV5WaveB{from{transform:translateX(1%) scaleY(.95)}to{transform:translateX(-1%) scaleY(1.07)}}
    @keyframes fcV5Scroll{0%,100%{transform:translateY(0)}50%{transform:translateY(7px)}}
    @media(max-width:1023px){.fc-v5-veil{background:linear-gradient(90deg,rgba(3,25,46,.88),rgba(3,25,46,.62) 65%,rgba(3,25,46,.28))}.fc-v5-glass{max-width:500px}}
    @media(max-width:639px){.fc-v5-veil{background:linear-gradient(90deg,rgba(3,25,46,.91),rgba(3,25,46,.68))}.fc-v5-photo{background-position:58% center}}
    @media(prefers-reduced-motion:reduce){.fc-home-v5 *, .fc-home-v5 *::before, .fc-home-v5 *::after{animation:none!important;transition:none!important}.fc-v5-photo{will-change:auto}}
  `}</style>
 </div>
);
