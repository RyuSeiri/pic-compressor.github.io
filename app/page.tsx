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

const defaultSettings: CompressionOptions = { maxSide: 0, outputFormat: "webp", quality: 80 };
const presets: Record<Preset, CompressionOptions> = {
  web: { maxSide: 1600, outputFormat: "webp", quality: 78 },
  quality: { maxSide: 0, outputFormat: "webp", quality: 92 },
  smallest: { maxSide: 1200, outputFormat: "webp", quality: 65 },
};

const copy = {
  zh:{title:"在线图片压缩工具",desc:"快速压缩 JPG、PNG、WebP 和 GIF。所有处理都在浏览器本地完成。",local:"图片不会离开你的设备",localSub:"无需注册 · 无需上传 · 浏览器本地处理",selected:"已选择",original:"原始大小",estimate:"预计压缩效果",output:"预计输出",saving:"预计节省",estimateTip:"预估仅供参考，实际大小会根据图片内容和编码方式变化。",compress:"开始压缩",processing:"正在压缩…",results:"处理结果",downloadAll:"下载全部 ZIP",done:"处理完成，可以逐个下载或下载 ZIP。",error:"处理失败",workflow:"使用流程",steps:["上传图片","选择压缩参数","压缩并下载"],skipped:"重复文件已跳过：",language:"语言"},
  en:{title:"Online Image Compressor",desc:"Compress JPG, PNG, WebP and GIF images quickly. Everything runs locally in your browser.",local:"Your images stay on your device",localSub:"No registration · No upload · Browser-based processing",selected:"Selected",original:"Original size",estimate:"Estimated result",output:"Estimated output",saving:"Estimated savings",estimateTip:"Estimates are only a guide. Actual size depends on image content and encoding.",compress:"Compress images",processing:"Processing…",results:"Results",downloadAll:"Download ZIP",done:"Processing completed. Download files individually or as a ZIP.",error:"Processing failed",workflow:"Workflow",steps:["Upload images","Choose settings","Compress and download"],skipped:"Duplicate files skipped: ",language:"Language"}
};

function extension(format:string,type:string){if(format==="original") return (type.split("/")[1]||"jpg").replace("jpeg","jpg"); return format==="jpeg"?"jpg":format;}

export default function Home(){
  const [locale,setLocale]=useState<Locale>("zh");
  const [files,setFiles]=useState<File[]>([]);
  const [settings,setSettings]=useState<CompressionOptions>(defaultSettings);
  const [results,setResults]=useState<CompressionResult[]>([]);
  const [compressing,setCompressing]=useState(false);
  const [progress,setProgress]=useState(0);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const t=copy[locale];

  useEffect(()=>{try{const s=localStorage.getItem("pic-compressor:settings");if(s)setSettings({...defaultSettings,...JSON.parse(s)});const l=localStorage.getItem("pic-compressor:locale");if(l==="zh"||l==="en")setLocale(l);}catch{}},[]);
  useEffect(()=>{localStorage.setItem("pic-compressor:settings",JSON.stringify(settings));},[settings]);
  useEffect(()=>{localStorage.setItem("pic-compressor:locale",locale);},[locale]);

  const summary=useMemo(()=>{const total=files.reduce((s,f)=>s+f.size,0);const ratio=settings.outputFormat==="png"?0.78:settings.outputFormat==="jpeg"?0.18+settings.quality*0.0068:0.15+settings.quality*0.006;const estimated=total?Math.min(total,Math.max(files.length*1024,Math.round(total*ratio))):0;return{count:files.length,total,estimated,saving:Math.max(0,total-estimated),rate:total?Math.round((total-estimated)/total*100):0};},[files,settings]);

  const addFiles=(newFiles:File[])=>{setError("");setMessage("");setResults([]);setFiles(prev=>{const keys=new Set(prev.map(f=>f.name+"-"+f.size+"-"+f.lastModified));const unique=newFiles.filter(f=>{const k=f.name+"-"+f.size+"-"+f.lastModified;if(keys.has(k))return false;keys.add(k);return true;});if(unique.length!==newFiles.length)setMessage(t.skipped+(newFiles.length-unique.length));return[...prev,...unique];});};
  const remove=(i:number)=>{setFiles(p=>p.filter((_,x)=>x!==i));setResults([]);};
  const clear=()=>{setFiles([]);setResults([]);setProgress(0);setMessage("");setError("");};

  const compress=async()=>{if(!files.length||compressing)return;setCompressing(true);setProgress(0);setResults([]);setError("");setMessage("");const output:CompressionResult[]=[];
    for(let i=0;i<files.length;i++){const file=files[i];try{const mime=settings.outputFormat==="original"?file.type:"image/"+settings.outputFormat;const blob=await imageCompression(file,{maxWidthOrHeight:settings.maxSide||undefined,useWebWorker:true,fileType:mime,quality:settings.quality/100,preserveExif:false});const ext=extension(settings.outputFormat,file.type);output.push({name:file.name,outputName:file.name.replace(/\.[^/.]+$/,"")+"-compressed."+ext,originalSize:file.size,compressedSize:blob.size,success:true,format:ext.toUpperCase(),blob});}catch(e){output.push({name:file.name,outputName:file.name,originalSize:file.size,compressedSize:0,success:false,error:e instanceof Error?e.message:"Unknown error",format:extension(settings.outputFormat,file.type).toUpperCase()});}setResults([...output]);setProgress(i+1);}
    const failed=output.find(x=>!x.success);if(failed)setError(t.error+": "+(failed.error||"Unknown error"));else setMessage(t.done);setCompressing(false);
  };
  const download=(r:CompressionResult)=>{if(!r.blob)return;const url=URL.createObjectURL(r.blob);const a=document.createElement("a");a.href=url;a.download=r.outputName;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  const downloadZip=async()=>{const zip=new JSZip();results.filter(r=>r.success&&r.blob).forEach(r=>zip.file(r.outputName,r.blob as Blob));const blob=await zip.generateAsync({type:"blob",compression:"DEFLATE"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="pic-compressor-results.zip";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  const successful=results.filter(r=>r.success);const percent=files.length?Math.round(progress/files.length*100):0;

  return <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-10">
    <section className="hero-shell"><div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"><div className="max-w-2xl"><span className="eyebrow">PIC COMPRESSOR · IMAGE TOOLS</span><h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] text-slate-950 md:text-6xl">{t.title}</h1><p className="mt-4 text-base leading-7 text-slate-600 md:text-lg">{t.desc}</p></div><div className="language-switcher" aria-label={t.language}><button type="button" onClick={()=>setLocale("zh")} className={locale==="zh"?"language-active":""}>中文</button><button type="button" onClick={()=>setLocale("en")} className={locale==="en"?"language-active":""}>EN</button></div></div><div className="trust-strip"><div className="trust-item"><span className="trust-dot"/><div><strong>{t.local}</strong><span>{t.localSub}</span></div></div><div className="trust-stat"><strong>{summary.count}</strong><span>{t.selected}</span></div><div className="trust-stat"><strong>{formatFileSize(summary.total)}</strong><span>{t.original}</span></div></div></section>
    <section className="tool-grid mt-6"><div><div className="surface-card p-4 md:p-6"><DropZone onFilesAdded={addFiles} locale={locale}/><FileList files={files} onRemove={remove} onClear={clear} locale={locale}/></div><div className="surface-card mt-5 p-5 md:p-6"><Settings settings={settings} onChange={setSettings} onApplyPreset={p=>setSettings(presets[p])} onReset={()=>setSettings(defaultSettings)} locale={locale}/>{compressing&&<div className="progress-panel"><div className="flex justify-between text-sm font-medium text-slate-700"><span>{t.processing}</span><span>{percent}%</span></div><div className="progress-track"><div className="progress-bar" style={{width:percent+"%"}}/></div></div>}<button type="button" disabled={!files.length||compressing} onClick={compress} className="btn-primary mt-6 w-full">{compressing?t.processing:t.compress}<svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M5 12h13m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button></div></div>
      <aside><div className="surface-card p-5"><div className="mb-5 flex items-center justify-between"><div><p className="section-kicker">{t.estimate}</p><h2 className="mt-1 text-lg font-bold text-slate-900">Compression</h2></div><span className="estimate-badge">{summary.rate}%</span></div><div className="space-y-3"><div className="metric-row"><span>{t.original}</span><strong>{formatFileSize(summary.total)}</strong></div><div className="metric-row"><span>{t.output}</span><strong>{formatFileSize(summary.estimated)}</strong></div><div className="metric-row metric-saving"><span>{t.saving}</span><strong>{formatFileSize(summary.saving)}</strong></div></div><div className="estimate-track"><div style={{width:summary.rate+"%"}}/></div><p className="mt-3 text-xs leading-5 text-slate-400">{t.estimateTip}</p></div><div className="surface-card mt-5 p-5"><p className="section-kicker">{t.workflow}</p><div className="workflow-list">{t.steps.map((s,i)=><div key={s}><span>0{i+1}</span><p>{s}</p></div>)}</div></div></aside>
    </section>
    {(message||error)&&<div className={"message-box mt-5 "+(error?"message-error":"message-success")}>{error||message}</div>}
    {results.length>0&&<section className="surface-card mt-5 p-5 md:p-6"><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="section-kicker">{t.results}</p><h2 className="mt-1 text-2xl font-bold text-slate-900">{successful.length} / {results.length}</h2></div>{successful.length>1&&<button type="button" onClick={downloadZip} className="secondary-button"><svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 20h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>{t.downloadAll}</button>}</div><div className="space-y-2">{results.map((r,i)=><ResultCard key={r.name+i} result={r} onDownload={download} locale={locale}/>)}</div></section>}
  </main>;
}
