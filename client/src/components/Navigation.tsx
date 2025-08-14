import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Vault, Menu, X } from "lucide-react";
import WalletConnect from "./WalletConnect";
import ThemeToggle from "./ThemeToggle";
import logo5 from "@/assets/logo5.png";

const Navigation = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navTabs = [
    { label: "Faucet", path: "/faucet", enabled: true },
    { label: "Portfolio", path: "/dashboard#portfolio", enabled: true },
    { label: "Vault", path: "/vaults", enabled: true },
    { label: "Staking", path: "#", enabled: false },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b border-vault-border bg-vault-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Link to="/" className="flex items-center space-x-1">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <img src={logo5} alt="Famz Yield Logo" className="w-10 h-10" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Famz Yield
              </span>
            </Link>
          </div>

          {/* Centered Navigation Tabs (Desktop) */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className="flex items-center space-x-8">
              {navTabs.map((tab) =>
                tab.enabled ? (
                  <Link key={tab.label} to={tab.path}>
                    <span
                      className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200 hover:text-primary ${
                        location.pathname === tab.path.split("#")[0]
                          ? "text-primary"
                          : "text-muted-foreground"
                      } group`}
                    >
                      {tab.label}
                      {/* Underline effect */}
                      <span
                        className={`absolute bottom-0 left-0 w-full h-0.5 bg-primary transition-transform duration-200 ${
                          location.pathname === tab.path.split("#")[0]
                            ? "scale-x-100"
                            : "scale-x-0 group-hover:scale-x-100"
                        }`}
                      />
                    </span>
                  </Link>
                ) : (
                  <div
                    key={tab.label}
                    className="relative flex items-center space-x-2"
                  >
                    <span className="px-3 py-2 text-sm font-medium text-muted-foreground/60">
                      {tab.label}
                    </span>
                    <p className="px-2 py-1 text-xs font-semibold bg-amber-500/20 text-gray-400 rounded-full shadow-sm border border-amber-500/30">
                      Coming Soon
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Right side controls & Mobile menu */}
          <div className="flex items-center">
            <div className="hidden md:flex items-center space-x-4">
              <ThemeToggle />
              <WalletConnect />
            </div>
            <div className="md:hidden">
              <Button
                variant="ghost"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-vault-border mt-2 pt-2 pb-4">
            <div className="flex flex-col space-y-2">
              {navTabs.map((tab) =>
                tab.enabled ? (
                  <Link
                    key={tab.label}
                    to={tab.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button
                      variant={
                        location.pathname === tab.path.split("#")[0]
                          ? "default"
                          : "ghost"
                      }
                      className="w-full justify-start space-x-2"
                    >
                      <span>{tab.label}</span>
                    </Button>
                  </Link>
                ) : (
                  <div
                    key={tab.label}
                    className="flex items-center justify-between p-3 rounded-lg"
                  >
                    <span className="text-sm font-medium text-muted-foreground/60">
                      {tab.label}
                    </span>
                    <div className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full shadow-sm">
                      Coming Soon
                    </div>
                  </div>
                )
              )}
              <div className="pt-2 flex flex-col space-y-2">
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                <WalletConnect />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
