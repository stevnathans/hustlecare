import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Footer Links */}
          <div className="mb-6 md:mb-0">
            <h3 className="font-semibold text-xl">Hustlecare</h3>
            <div className="mt-4 space-y-2">
              <Link href="#" className="text-gray-400 hover:text-green-600">About</Link>
              <Link href="#" className="text-gray-400 hover:text-green-600">Contact</Link>
              <Link href="#" className="text-gray-400 hover:text-green-600">Privacy Policy</Link>
            </div>
          </div>

          {/* Copyright */}
          <div>
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Hustlecare. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
