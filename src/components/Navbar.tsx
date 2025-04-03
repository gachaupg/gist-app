"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const isPathActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const goToSearch = () => {
    router.push("/gists/search");
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-14">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-lg font-semibold text-indigo-600">
                Gist Tracker
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-2">
              <Link
                href="/"
                className={`px-2 py-1 rounded-md text-xs font-medium ${
                  isActive("/")
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
                }`}
              >
                Home
              </Link>

              {status === "authenticated" && (
                <>
                  <Link
                    href="/gists"
                    className={`px-2 py-1 rounded-md text-xs font-medium ${
                      isPathActive("/gists") && !pathname.includes("/search")
                        ? "text-indigo-600 bg-indigo-50"
                        : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
                    }`}
                  >
                    My Gists
                  </Link>
                  <Link
                    href="/profile"
                    className={`px-2 py-1 rounded-md text-xs font-medium ${
                      isPathActive("/profile")
                        ? "text-indigo-600 bg-indigo-50"
                        : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
                    }`}
                  >
                    Profile
                  </Link>
                </>
              )}

              <Link
                href="/gists/search"
                className={`px-2 py-1 rounded-md text-xs font-medium flex items-center ${
                  pathname.includes("/search")
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-3 h-3 mr-1"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                    clipRule="evenodd"
                  />
                </svg>
                Search
              </Link>
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-3">
            {/* Search button for medium+ screens */}
            <button
              onClick={goToSearch}
              className="md:hidden lg:flex items-center justify-center p-1.5 rounded-full text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-indigo-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {status === "authenticated" ? (
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-600">
                  Hi, {session.user?.name}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="px-3 py-1 rounded-md text-xs bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-1 focus:ring-red-400 focus:ring-offset-1 transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-3 py-1 rounded-md text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1 rounded-md text-xs bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:ring-offset-1 transition-colors duration-200"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Search button for mobile */}
            <button
              onClick={goToSearch}
              className="inline-flex items-center justify-center p-1.5 rounded-full text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-indigo-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-1 rounded-md text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-indigo-400"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <svg
                className={`${isMenuOpen ? "hidden" : "block"} h-5 w-5`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className={`${isMenuOpen ? "block" : "hidden"} h-5 w-5`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`${isMenuOpen ? "block" : "hidden"} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            href="/"
            className={`block px-3 py-1 rounded-md text-xs font-medium ${
              isActive("/")
                ? "text-indigo-600 bg-indigo-50"
                : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
            }`}
          >
            Home
          </Link>

          {status === "authenticated" && (
            <>
              <Link
                href="/gists"
                className={`block px-3 py-1 rounded-md text-xs font-medium ${
                  isPathActive("/gists") && !pathname.includes("/search")
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
                }`}
              >
                My Gists
              </Link>
              <Link
                href="/profile"
                className={`block px-3 py-1 rounded-md text-xs font-medium ${
                  isPathActive("/profile")
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
                }`}
              >
                Profile
              </Link>
            </>
          )}

          <Link
            href="/gists/search"
            className={`block px-3 py-1 rounded-md text-xs font-medium flex items-center ${
              pathname.includes("/search")
                ? "text-indigo-600 bg-indigo-50"
                : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3 h-3 mr-1"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
            Search Gists
          </Link>

          {status === "authenticated" ? (
            <div className="pt-2">
              <span className="block px-3 py-1 text-xs text-gray-600">
                Hi, {session.user?.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="block w-full text-left px-3 py-1 rounded-md text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-2 space-y-1">
              <Link
                href="/login"
                className="block px-3 py-1 rounded-md text-center text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="block px-3 py-1 rounded-md text-center text-xs bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
