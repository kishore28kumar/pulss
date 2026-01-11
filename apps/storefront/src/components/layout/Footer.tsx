'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Facebook, Twitter, Instagram /*, Mail */ } from 'lucide-react';

export default function Footer() {
  const params = useParams();
  const storeName = params?.['store-name'] as string | undefined;

  // Helper to get tenant-aware path
  const getPath = (path: string) => {
    if (storeName) {
      return `/${storeName}${path}`;
    }
    // Fallback: try to get from window location if params not available
    if (typeof window !== 'undefined') {
      const pathSegments = window.location.pathname.split('/').filter(Boolean);
      const slug = pathSegments[0];
      if (slug) {
        return `/${slug}${path}`;
      }
    }
    return path;
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Pulss Store</h3>
            <p className="text-sm text-gray-400 mb-4">
              Your trusted source for quality products. We deliver excellence with every order.
            </p>
            {/* <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Instagram className="w-5 h-5" />
              </a>
            </div> */}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={getPath('/products')} className="hover:text-white transition">Shop</Link></li>
              <li><Link href={getPath('/about')} className="hover:text-white transition">About Us</Link></li>
              <li><Link href={getPath('/contact')} className="hover:text-white transition">Contact</Link></li>
              <li><Link href={getPath('/faq')} className="hover:text-white transition">FAQ</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={getPath('/shipping')} className="hover:text-white transition">Shipping Info</Link></li>
              <li><Link href={getPath('/returns')} className="hover:text-white transition">Returns</Link></li>
              <li><Link href={getPath('/privacy')} className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link href={getPath('/terms')} className="hover:text-white transition">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* Newsletter - Commented out as requested
          <div>
            <h3 className="text-white font-semibold mb-4">Newsletter</h3>
            <p className="text-sm text-gray-400 mb-4">
              Subscribe to get special offers and updates.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2 rounded-l-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-600"
              />
              <button className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition">
                <Mail className="w-5 h-5" />
              </button>
            </div>
          </div>
          */}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 Pulss. All rights reserved. Built with ❤️ for local businesses and their customers.</p>
        </div>
      </div>
    </footer>
  );
}

