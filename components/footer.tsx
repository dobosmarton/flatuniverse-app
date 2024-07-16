import { siGithub, siX } from 'simple-icons';

export const Footer = () => {
  return (
    <footer className="flex items-center h-20 gap-1 font-medium border-t px-8 py-12">
      <div className="flex flex-col">
        <div>
          Flat universe
          <span className="text-sm">© 2024</span>
        </div>
        <span className="text-sm font-normal">Thank you to arXiv for use of its open access interoperability. 🙏</span>
      </div>
      <nav className="flex justify-end grow sm:gap-2">
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
