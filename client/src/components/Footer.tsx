import React from "react";
import { Link } from "react-router-dom";
import { Twitter, Github } from "lucide-react";

const Footer = () => {
  const footerSections = [
    {
      title: "Products",
      links: [
        { label: "Vaults", href: "/vaults" },
        { label: "Dashboard", href: "/dashboard" },
        { label: "Faucet", href: "/faucet" },
        { label: "Stake", href: "#", comingSoon: true },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "#" },
        { label: "Tutorials", href: "#" },
        { label: "GitHub", href: "https://github.com/alade-dev/famz-yield" },
      ],
    },
    {
      title: "Community",
      links: [
        { label: "Twitter", href: "https://twitter.com/famz_yield" },
        { label: "Discord", href: "#" },
        { label: "Telegram", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "#" },
        { label: "Contact", href: "#" },
        { label: "Careers", href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-background border-t border-vault-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2 pr-8">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">
                  F
                </span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Famz Yield
              </span>
            </Link>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              Maximizing yield and optimizing investments in the decentralized
              finance ecosystem.
            </p>
            <div className="flex space-x-4">
              <Link
                to="https://twitter.com/famz_yield"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </Link>
              <Link
                to="https://github.com/alade-dev/famz-yield"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Github className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Links Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-foreground mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center"
                    >
                      {link.label}
                      {link.comingSoon && (
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-400/20 text-amber-400">
                          Soon
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-vault-border/50 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Famz Yield. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <Link
              to="#"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="#"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
