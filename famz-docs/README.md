# Famz Yield Documentation

[![Deploy Status](https://img.shields.io/badge/deploy-success-brightgreen)](https://famz-defi.vercel.app/)
[![Docusaurus](https://img.shields.io/badge/Built%20with-Docusaurus-blue)](https://docusaurus.io/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

> **Professional documentation for Famz Yield - A decentralized BTC yield vault on CORE Blockchain**

## 🌟 Overview

This documentation site provides comprehensive guides, API references, and technical specifications for Famz Yield, a cutting-edge decentralized finance protocol that enables Bitcoin yield generation through innovative vault mechanisms on the CORE Blockchain.

## 🚀 Features

- **Professional Design**: Modern, responsive design matching the main application
- **Comprehensive Coverage**: Complete documentation for users, developers, and integrators
- **Interactive Examples**: Live code samples and interactive components
- **Multi-theme Support**: Light and dark mode with automatic system preference detection
- **Fast Search**: Instant search across all documentation
- **Mobile Optimized**: Fully responsive design for all devices

## 📚 Documentation Structure

```
docs/
├── 🌟 overview/          # Project vision, problems, and goals
├── 🏗️ architecture/      # System design, contracts, and tokenomics
├── 👤 user-guide/        # End-user documentation
├── 🛠️ developer-guide/   # Development setup and contribution guide
├── 💰 economics/         # Yield models and economic mechanisms
├── 🔒 security/          # Security audits and risk assessment
├── 🗺️ roadmap/          # Project roadmap and future plans
└── ❓ faq/              # Frequently asked questions
```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Local Development

```bash
# Clone the repository
git clone https://github.com/alade-dev/famz-yield.git
cd famz-yield/famz-docs

# Install dependencies
npm install

# Start development server
npm start
```

The documentation site will be available at `http://localhost:3000`.

### Building for Production

```bash
# Build static files
npm run build

# Serve built files locally
npm run serve
```

### Deployment

The documentation is automatically deployed to Vercel on every push to the main branch.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Falade-dev%2Ffamz-yield)

## 🎨 Customization

### Theming

The documentation uses a custom theme that matches the Famz Yield application:

- **Colors**: Professional blue gradient with proper contrast ratios
- **Typography**: Inter font family for modern, readable text
- **Components**: Custom cards, buttons, and interactive elements
- **Animations**: Smooth transitions and hover effects

### Adding Content

1. **New Documentation**: Add markdown files to the appropriate `docs/` subdirectory
2. **Update Sidebar**: Modify `sidebars.js` to include new pages
3. **Custom Components**: Add React components to `src/components/`
4. **Styling**: Update `src/css/custom.css` for global styles

### Configuration

Key configuration files:

- `docusaurus.config.js` - Main configuration
- `sidebars.js` - Sidebar navigation structure
- `src/css/custom.css` - Custom styling
- `static/` - Static assets (images, icons, etc.)

## 📖 Content Guidelines

### Writing Style

- **Clear and Concise**: Use simple, direct language
- **Professional Tone**: Maintain consistency with the brand
- **Code Examples**: Include practical, working examples
- **Visual Aids**: Use diagrams, screenshots, and illustrations

### Markdown Features

The documentation supports enhanced markdown features:

```markdown
:::tip Pro Tip
Use admonitions to highlight important information
:::

:::warning Testnet Only
Remember this is testnet documentation
:::

:::danger Security Notice
Always verify contract addresses
:::
```

### Code Blocks

```solidity
// Solidity code with syntax highlighting
contract Vault {
    function deposit(uint256 amount) external {
        // Implementation
    }
}
```

```javascript
// JavaScript examples
const vault = new ethers.Contract(address, abi, provider);
await vault.deposit(parseEther("1.0"));
```

## 🤝 Contributing

We welcome contributions to improve the documentation!

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-docs`)
3. **Make** your changes
4. **Test** locally (`npm start`)
5. **Commit** your changes (`git commit -m 'Add amazing documentation'`)
6. **Push** to the branch (`git push origin feature/amazing-docs`)
7. **Open** a Pull Request

### Content Contributions

- Fix typos and grammatical errors
- Add missing documentation
- Improve existing explanations
- Add code examples and tutorials
- Create visual diagrams and illustrations

### Technical Contributions

- Improve site performance
- Enhance mobile responsiveness
- Add new interactive components
- Optimize SEO and accessibility

## 📝 License

This documentation is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 🔗 Links

- **Live Documentation**: [https://famz-defi.vercel.app/](https://famz-defi.vercel.app/)
- **Main Application**: [https://core-yield-hub.vercel.app](https://core-yield-hub.vercel.app)
- **GitHub Repository**: [https://github.com/alade-dev/famz-yield](https://github.com/alade-dev/famz-yield)
- **Discord Community**: [Join our Discord](https://discord.gg/core-yield-hub)

## ⚠️ Important Notice

**This documentation covers testnet deployment only.**

Famz Yield is currently in active development on the CORE testnet. Do not deposit real funds or use this in production environments. Always verify you are connected to the testnet before interacting with any contracts.

---

<div align="center">
  <p>Built with ❤️ for the Bitcoin ecosystem</p>
  <p>
    <a href="https://coredao.org">CORE Blockchain</a> •
    <a href="https://docusaurus.io">Docusaurus</a> •
    <a href="https://vercel.com">Vercel</a>
  </p>
</div>
