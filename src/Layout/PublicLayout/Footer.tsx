import React from "react";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";
import NavItems from "./NavItems";
import CommonWrapper from "@/common/CommonWrapper";

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary-brand py-8">
      <CommonWrapper className="px-4 text-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-bold mb-4">About Us</h3>
            <p className="text-sm">
              We are a team of passionate developers building amazing web
              applications with modern technologies.
            </p>
          </div>
          {/* Quick Links Section */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <NavItems
              className="grid items-start justify-start gap-4 "
              classNameC="px-0!"
              classNameNC="px-0!"
            />
          </div>

          {/* Social Media Section */}
          <div>
            <h3 className="text-lg font-bold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-300"
              >
                <FaFacebook size={24} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-300"
              >
                <FaTwitter size={24} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-300"
              >
                <FaInstagram size={24} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-300"
              >
                <FaLinkedin size={24} />
              </a>
            </div>
          </div>

          {/* Newsletter Section */}
          <div>
            <h3 className="text-lg font-bold mb-4">Newsletter</h3>
            <p className="text-sm mb-4">
              Subscribe to our newsletter to get the latest updates.
            </p>
            <form className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="p-2 mr-2 rounded-md border-1 border-white  text-white focus:outline-none"
              />
              <button
                type="submit"
                className="bg-secondary-brand text-white px-4 rounded-md hover:bg-secondary-brand/50"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-sm text-white">
            &copy; {new Date().getFullYear()}
          </p>
        </div>
      </CommonWrapper>
    </footer>
  );
};

export default Footer;
