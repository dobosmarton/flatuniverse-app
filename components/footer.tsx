import Link from 'next/link';
import { siGithub, siX } from 'simple-icons';

export const Footer = () => {
  return (
    <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
      <p className="text-xs font-light text-gray-500 dark:text-gray-400">© 2024 Flatuniverse. All rights reserved.</p>
      <nav className="sm:ml-auto flex gap-4 sm:gap-6">
        <Link className="text-xs hover:underline underline-offset-4" href="/terms">
          Terms of Service
        </Link>
        <Link className="text-xs hover:underline underline-offset-4" href="#">
          Privacy
        </Link>
        <Link className="text-xs hover:underline underline-offset-4" href="/cookie-policy">
          Cookie Policy
        </Link>
        {/*  <a
          className="flex gap-2 px-3 py-2 text-sm font-semibold text-gray-600 transition duration-100 rounded-md hover:text-gray-800"
          href="https://github.com/devagrawal09/clerk-nextjs-template">
          <div className="m-auto">
            <svg
              role="img"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg">
              <path d={siGithub.path}></path>
            </svg>
          </div>
          <span className="hidden sm:inline"> View on Github</span>
        </a>
        <a className="flex flex-col justify-center p-2 hover:underline" href="https://twitter.com/ClerkDev">
          <svg
            role="img"
            viewBox="0 0 24 24"
            className="mr-2 h-4 w-4"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg">
            <path d={siX.path}></path>
          </svg>
        </a> */}
      </nav>
    </footer>
  );
};
