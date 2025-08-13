# Contributing to Famz Yielding Protocol

Thank you for considering contributing to **Famz Yield** — a decentralized yield vault on the **CORE Blockchain** that converts **wBTC and LSTs** into a single, yield-bearing token: **lstBTC**.

We welcome contributions from the community to help improve the protocol’s security, usability, and functionality.

Please read this guide carefully before opening a pull request.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How Can I Contribute?](#how-can-i-contribute)
3. [Getting Started](#getting-started)
4. [Development Workflow](#development-workflow)
5. [Coding Standards](#coding-standards)
6. [Testing](#testing)
7. [Pull Request Process](#pull-request-process)
8. [Security Policy](#security-policy)
9. [License](#license)

---

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/).  
By participating, you are expected to uphold this code. Please report unacceptable behavior to [dev@famz-yield.network](mailto:dev@famz-yield.network).

---

## How Can I Contribute?

You can contribute in several ways:

- **Bug Reports**: Report issues via GitHub Issues.
- **Feature Requests**: Suggest new features or improvements.
- **Code Contributions**: Fix bugs, add features, or improve documentation.
- **Testing**: Run tests, deploy locally, and report edge cases.
- **Documentation**: Improve READMEs, add tutorials, or write guides.
- **Audits**: Help identify security vulnerabilities.

---

## Getting Started

### Prerequisites

- Node.js >= 16.x
- npm or yarn
- Git
- Hardhat CLI
- Wallet with CORE testnet tokens

### Fork and Clone the Repository

```bash
git clone https://github.com/alade-dev/famz-yield.git
cd famz-yield
```

### Install Dependencies

```bash
# In root
npm install

# Or if using yarn
yarn install
```

### Set Up Environment

Create a `.env` file in the root:

```env
PRIVATE_KEY=your_private_key_here
CORE_TESTNET_RPC_URL=https://rpc.test2.btcs.network/
CORE_SCAN_API_KEY=xxxxxxxxx
```

---

## Development Workflow

1. **Create a Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**

   - Follow [Coding Standards](#coding-standards)
   - Add NatSpec comments
   - Write tests

3. **Compile Contracts**

   ```bash
   npx hardhat compile
   ```

4. **Run Tests**

   ```bash
   npx hardhat test
   ```

5. **Test Frontend (if applicable)**

   ```bash
   cd client
   npm run dev
   ```

6. **Commit Changes**
   Use clear, descriptive commit messages:

   ```bash
   git commit -m "feat: add emergencyWithdraw to VaultNew"
   ```

7. **Push to Your Fork**

   ```bash
   git push origin feature/your-feature-name
   ```

8. **Open a Pull Request**
   - Target the `main` branch
   - Include a clear description
   - Reference related issues (e.g., `Fixes #12`)

---

## Coding Standards

### Solidity

- Use **Solidity 0.8.24** or higher.
- Follow [OpenZeppelin Style Guide](https://docs.openzeppelin.com/contracts/4.x/writing-contracts).
- Use **NatSpec** for all functions and state variables:
  ```solidity
  /// @notice Mints lstBTC based on BTC-equivalent deposit value
  /// @dev Only callable via deposit() after asset transfer
  /// @param _amountOfwBTC Amount of wBTC deposited
  /// @param _amountOfStCORE Amount of stCORE deposited
  /// @return lstBTCMinted Amount of lstBTC minted
  function deposit(uint256 _amountOfwBTC, uint256 _amountOfStCORE)
      external
      nonReentrant
      whenNotPaused
      returns (uint256 lstBTCMinted)
  ```
- Use `immutable` for dependencies.
- Use `onlyOwner`, `onlyOperator`, `nonReentrant` modifiers where appropriate.
- Avoid floating pragmas: `pragma solidity 0.8.24;`

### JavaScript/TypeScript

- Use **ESLint** and **Prettier** (config included).
- Prefer `const` over `let`.
- Use descriptive variable names.
- Handle errors gracefully.

### Git

- Use conventional commit messages:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation
  - `test:` for tests
  - `chore:` for maintenance

---

## Testing

### Smart Contracts

All changes must be tested:

```bash
npx hardhat test
```

- Add unit tests for new functions.
- Test edge cases (zero inputs, max values, reverts).
- Ensure 100% coverage for critical functions.

### Frontend

If contributing to the UI:

- Ensure responsive design.
- Test on mobile and desktop.
- Validate user input.

---

## Pull Request Process

1. Ensure your branch is up to date with `main`:

   ```bash
   git pull origin main
   ```

2. Open a Pull Request with:

   - A clear title and description
   - Screenshots (for UI changes)
   - Test results
   - Issue references

3. Wait for review from maintainers.

4. Address feedback and update your PR.

5. Once approved, it will be merged.

> ⚠️ **Note**: We may request changes or close PRs that don’t align with the roadmap.

---

## Security Policy

We take security seriously. If you discover a vulnerability:

1. **Do not open a public issue.**
2. Email us at [dev@famz-yield.network](mailto:dev@famz-yield.network) with:
   - A detailed description
   - Steps to reproduce
   - Suggested fix (if known)
3. We will acknowledge receipt within 48 hours.
4. Work with you to patch and disclose responsibly.

We are preparing for a third-party audit. Your input helps make the protocol safer.

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).

---

## Thank You!

Your contribution helps build a more secure, efficient, and accessible DeFi ecosystem on the CORE Blockchain.

We appreciate your time and effort.

— The Famz Team
