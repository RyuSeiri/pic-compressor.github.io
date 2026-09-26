"use client";

import { useEffect, useMemo, useState } from "react";
import JSZip from "jszip";
import imageCompression from "browser-image-compression";
import DropZone from "@/components/DropZone";
import FileList from "@/components/FileList";
import Settings from "@/components/Settings";
import ResultCard from "@/components/ResultCard";
import { CompressionOptions, CompressionResult } from "@/types";
import { formatFileSize } from "@/utils/fileHelpers";

type Locale = "zh" | "en";
type Preset = "web" | "quality" | "smallest";

const defaults: CompressionOptions = { maxSide: 0, outputFormat: "webp", quality: 80 };
const presets: Record<Preset, CompressionOptions> = {
  web: { maxSide: 1600, outputFormat: "webp", quality: 78 },
  quality: { maxSide: 0, outputFormat: "webp", quality: 92 },
  smallest: { maxSide: 1200, outputFormat: "webp", quality: 65 },
};
const text = {
  zh: { title:"把图片变小，图片不用离开你的设备。", desc:"批量压缩 JPG、PNG、WebP 和 GIF。拖入图片、选择参数，然后直接下载。", local:"本地处理", localSub:"无需上传 · 无需注册", add:"添加图片", settings:"输出设置", results:"处理结果", selected:"已选择", original:"原始大小", estimated:"预计输出", saved:"预计节省", start:"开始压缩", processing:"正在压缩", clear:"清空", all:"下载全部", ready:"准备就绪", why:"简单好用的图片压缩工具", whyDesc:"为日常网站、博客、社交媒体和开发工作准备。少一点上传，多一点效率。", cards:[["本地优先","图片在浏览器中处理，正常压缩流程不需要上传图片。"],["批量处理","一次选择多张图片，统一设置，一次完成。"],["网页友好","WebP、质量和尺寸控制适合常见网页图片工作流。"]], note:"预计值仅供参考，实际文件大小取决于图片内容和编码方式。" },
  en: { title:"Make images smaller. Keep them on your device.", desc:"Compress JPG, PNG, WebP and GIF files in batches. Drop images, choose settings, and download.", local:"Local processing", localSub:"No upload · No account", add:"Add images", settings:"Output settings", results:"Results", selected:"Selected", original:"Original", estimated:"Estimated output", saved:"Estimated savings", start:"Compress images", processing:"Processing", clear:"Clear", all:"Download all", ready:"Ready", why:"A practical image compressor", whyDesc:"Built for everyday websites, blogs, social media and development work. Less uploading, more getting things done.", cards:[["Local-first","Images are processed in your browser, so normal compression does not require an upload."],["Batch workflow","Select multiple images, use one configuration, and process them together."],["Web friendly","WebP, quality and dimension controls fit common web image workflows."]], note:"Estimates are only a guide. Actual file size depends on image content and encoding." }
};

function ext(format:string,type:string){if(format==="original")return(type.split("/")[1]||"jpg").replace("jpeg","jpg");return format==="jpeg"?"jpg":format;}

export default function Home(){
  const [locale,setLocale]=useState<Locale>("zh");
  const [files,setFiles]=useState<File[]>([]);
  const [settings,setSettings]=useState(defaults);
  const [results,setResults]=useState<CompressionResult[]>([]);
  const [busy,setBusy]=useState(false),[progress,setProgress]=useState(0),[notice,setNotice]=useState(""),[error,setError]=useState("");
  const t=text[locale];

  useEffect(()=>{try{const s=localStorage.getItem("pic-compressor:settings");const l=localStorage.getItem("pic-compressor:locale");if(s)setSettings({...defaults,...JSON.parse(s)});if(l==="zh"||l==="en")setLocale(l);}catch{}},[]);
  useEffect(()=>{localStorage.setItem("pic-compressor:settings",JSON.stringify(settings));},[settings]);
  useEffect(()=>{localStorage.setItem("pic-compressor:locale",locale);},[locale]);

  const summary=useMemo(()=>{const total=files.reduce((n,f)=>n+f.size,0);const ratio=settings.outputFormat==="png"?0.78:settings.outputFormat==="jpeg"?0.18+settings.quality*0.0068:0.15+settings.quality*0.006;const estimated=total?Math.min(total,Math.max(files.length*1024,Math.round(total*ratio))):0;return{count:files.length,total,estimated,saving:Math.max(0,total-estimated),rate:total?Math.round(Math.max(0,total-estimated)/total*100):0};},[files,settings]);

  const add=(incoming:File[])=>{setError("");setNotice("");setResults([]);setFiles(prev=>{const keys=new Set(prev.map(f=>f.name+f.size+f.lastModified));const unique=incoming.filter(f=>{const k=f.name+f.size+f.lastModified;if(keys.has(k))return false;keys.add(k);return true;});if(unique.length<incoming.length)setNotice(locale==="zh"?"已跳过 "+(incoming.length-unique.length)+" 个重复文件":(incoming.length-unique.length)+" duplicate files skipped");return[...prev,...unique];});};
  const clear=()=>{setFiles([]);setResults([]);setProgress(0);setNotice("");setError("");};

  const compress=async()=>{if(!files.length||busy)return;setBusy(true);setProgress(0);setResults([]);setNotice("");setError("");const out:CompressionResult[]=[];
    for(let i=0;i<files.length;i++){const file=files[i];try{const mime=settings.outputFormat==="original"?file.type:"image/"+settings.outputFormat;const blob=await imageCompression(file,{maxWidthOrHeight:settings.maxSide||undefined,useWebWorker:true,fileType:mime,initialQuality:settings.quality/100,preserveExif:false});const e=ext(settings.outputFormat,file.type);out.push({name:file.name,outputName:file.name.replace(/\.[^/.]+$/,"")+"-compressed."+e,originalSize:file.size,compressedSize:blob.size,success:true,format:e.toUpperCase(),blob});}catch(e){out.push({name:file.name,outputName:file.name,originalSize:file.size,compressedSize:0,success:false,error:e instanceof Error?e.message:"Unknown error",format:ext(settings.outputFormat,file.type).toUpperCase()});}setResults([...out]);setProgress(i+1);}
    setBusy(false);if(out.every(x=>x.success))setNotice(locale==="zh"?"全部处理完成，可以下载。":"Everything is ready to download.");else setError(locale==="zh"?"部分文件处理失败。":"Some files could not be processed.");
  };
  const download=(r:CompressionResult)=>{if(!r.blob)return;const u=URL.createObjectURL(r.blob),a=document.createElement("a");a.href=u;a.download=r.outputName;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),800);};
  const downloadAll=async()=>{const zip=new JSZip();results.filter(r=>r.success&&r.blob).forEach(r=>zip.file(r.outputName,r.blob as Blob));const blob=await zip.generateAsync({type:"blob",compression:"DEFLATE"});const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download="pic-compressor-results.zip";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),800);};
  const done=results.filter(r=>r.success).length,percent=files.length?Math.round(progress/files.length*100):0;

  return <main>
    <section className="hero-section"><div className="hero-orb hero-orb-one"/><div className="hero-orb hero-orb-two"/><div className="page-container hero-inner">
      <div className="hero-copy"><div className="hero-eyebrow"><span className="live-dot"/>{t.local.toUpperCase()} · FAST · PRIVATE</div><h1>{t.title}</h1><p>{t.desc}</p></div>
      <div className="hero-actions"><div className="language-switcher"><button onClick={()=>setLocale("zh")} className={locale==="zh"?"language-active":""}>中文</button><button onClick={()=>setLocale("en")} className={locale==="en"?"language-active":""}>EN</button></div><div className="privacy-pill"><span className="privacy-icon">✓</span><div><strong>{t.local}</strong><small>{t.localSub}</small></div></div></div>
    </div></section>
    <div className="page-container">
      <div className="workflow-bar"><div className="workflow-step"><span>01</span><strong>{t.add}</strong></div><i/><div className="workflow-step"><span>02</span><strong>{t.settings}</strong></div><i/><div className="workflow-step"><span>03</span><strong>{t.results}</strong></div></div>
      <section id="compressor" className="workspace">
        <div className="workspace-main"><div className="card-header"><div><span className="mini-label">IMAGE WORKSPACE</span><h2>{t.add}</h2><p>{locale==="zh"?"拖拽图片到这里，或点击选择文件":"Drop images here, or browse your files"}</p></div>{files.length>0&&<button onClick={clear} className="clear-button">{t.clear}</button>}</div><DropZone onFilesAdded={add} locale={locale}/><FileList files={files} onRemove={i=>{setFiles(p=>p.filter((_,x)=>x!==i));setResults([])}} onClear={clear} locale={locale}/></div>
        <aside className="workspace-side"><div className="stats-card"><div className="stats-top"><span>{t.selected}</span><strong>{summary.count}</strong></div><div className="stats-line"><span>{t.original}</span><b>{formatFileSize(summary.total)}</b></div><div className="stats-line"><span>{t.ready}</span><b>{files.length?percent+"%":"—"}</b></div></div><div className="estimate-card"><div className="estimate-head"><div><span className="mini-label">{t.estimated}</span><h3>{summary.rate}%</h3></div><span className="estimate-ring">↓</span></div><div className="estimate-values"><span>{t.original}<b>{formatFileSize(summary.total)}</b></span><span>{t.estimated}<b>{formatFileSize(summary.estimated)}</b></span><span className="saving"><em>{t.saved}</em><b>{formatFileSize(summary.saving)}</b></span></div><div className="estimate-track"><div style={{width:summary.rate+"%"}}/></div><p>{t.note}</p></div></aside>
      </section>
      <section className="settings-card"><Settings settings={settings} onChange={setSettings} onApplyPreset={p=>setSettings(presets[p])} onReset={()=>setSettings(defaults)} locale={locale}/>{busy&&<div className="progress-panel"><div><span>{t.processing}</span><b>{percent}%</b></div><div className="progress-track"><div className="progress-bar" style={{width:percent+"%"}}/></div></div>}<button disabled={!files.length||busy} onClick={compress} className="compress-button"><span>{busy?t.processing:t.start}</span><svg viewBox="0 0 24 24" fill="none"><path d="M5 12h13m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button></section>
      {(notice||error)&&<div className={error?"notice notice-error":"notice notice-success"}>{error||notice}</div>}
      {results.length>0&&<section className="results-card"><div className="results-head"><div><span className="mini-label">{t.results}</span><h2>{done} <small>/ {results.length}</small></h2></div>{done>1&&<button onClick={downloadAll} className="download-all">↓ {t.all}</button>}</div><div className="results-list">{results.map((r,i)=><ResultCard key={r.name+i} result={r} onDownload={download} locale={locale}/>)}</div></section>}
      <section className="why-section"><div className="section-heading"><span className="mini-label">WHY PIC COMPRESSOR</span><h2>{t.why}</h2><p>{t.whyDesc}</p></div><div className="benefit-grid">{t.cards.map((c,i)=><article className="benefit-card" key={c[0]}><span>0{i+1}</span><h3>{c[0]}</h3><p>{c[1]}</p></article>)}</div></section>
      <section className="format-strip"><div><span className="mini-label">OUTPUT FORMATS</span><h2>JPG · PNG · WebP</h2><p>{locale==="zh"?"WebP 适合网页，JPG 适合照片，PNG 适合透明背景。":"WebP works well for the web, JPG for photos, and PNG when transparency matters."}</p></div><div className="format-list"><span><b>WEBP</b><small>Web</small></span><span><b>JPG</b><small>Photos</small></span><span><b>PNG</b><small>Alpha</small></span></div></section>
    </div>
  </main>;
}