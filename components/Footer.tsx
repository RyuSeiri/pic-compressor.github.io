import Link from "next/link";

export default function Footer() {
  return <footer className="site-footer"><div className="page-container footer-inner">
    <div className="footer-brand"><strong>Pic Compressor</strong><p>Simple image compression that runs in your browser.</p></div>
    <nav className="footer-links"><Link className="footer-link" href="/privacy">Privacy</Link><Link className="footer-link" href="/terms">Terms</Link><Link className="footer-link" href="/policy">About</Link></nav>
  </div></footer>;
}