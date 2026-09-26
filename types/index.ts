export interface CompressionOptions { maxSide:number; outputFormat:"png"|"jpeg"|"webp"|"original"; quality:number; }
export interface CompressionResult { name:string; outputName:string; originalSize:number; compressedSize:number; success:boolean; error?:string; format:string; blob?:Blob; }
