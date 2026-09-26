import Link from "next/link";

export default function Header() {
  return <header className="site-header"><div className="page-container header-inner">
    <Link href="/" className="brand"><img src="/favicon.svg" alt="" className="brand-mark"/><span>Pic Compressor</span></Link>
    <nav className="nav-links"><Link href="/#compressor" className="nav-link">Compressor</Link><Link href="/privacy" className="nav-link">Privacy</Link><Link href="/terms" className="nav-link">Terms</Link><Link href="/policy" className="nav-link">About</Link></nav>
    <Link href="/#compressor" className="header-cta">Start compressing</Link>
  </div></header>;
}