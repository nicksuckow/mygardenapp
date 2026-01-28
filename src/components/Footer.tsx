import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 mt-auto">
      <div className="mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-4">
            <Link href="/help" className="hover:text-slate-900 hover:underline">
              Help
            </Link>
            <Link href="/privacy" className="hover:text-slate-900 hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-900 hover:underline">
              Terms
            </Link>
          </div>
          <p>&copy; {new Date().getFullYear()} Unfiltered Investments LLC</p>
        </div>
      </div>
    </footer>
  );
}
