import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-cream-200 bg-sage/10 mt-auto">
      <div className="mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-earth-warm">
          <div className="flex items-center gap-4">
            <Link href="/help" className="hover:text-sage-dark hover:underline transition-colors">
              Help
            </Link>
            <Link href="/privacy" className="hover:text-sage-dark hover:underline transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-sage-dark hover:underline transition-colors">
              Terms
            </Link>
          </div>
          <p className="text-earth-warm/80">&copy; {new Date().getFullYear()} Unfiltered Investments LLC</p>
        </div>
      </div>
    </footer>
  );
}
