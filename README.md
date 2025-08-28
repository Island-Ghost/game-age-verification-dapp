# 🎰 Privacy Sports Betting DAP - Age Verification Game

A complete **Decentralized Application Protocol (DAP)** for privacy-preserving age verification in sports betting using Zero-Knowledge proofs on Midnight Network.

## 🎮 Live Demo

**Interactive Game Interface:** Open `standalone-demo.html` in your browser to see the complete dApp demonstration.

**Features:**
- 🔒 **Real ZK Proof Generation** - Live connection to GAP server
- 👤 **Dual User Demo** - Adult (eligible) vs Minor (rejected) scenarios  
- 🎬 **Auto Demo Mode** - Fully automated presentation for judges
- 🏛️ **Judge Controls** - Technical details and privacy mode
- 🎯 **Live Betting Demo** - Jurisdiction compliance testing

## 🏗️ Complete DAP Architecture

### Core Components

1. **🔐 Age Verification Circuit** (`circuits/age_verification.circom`)
   - Groth16 ZK-SNARK circuit proving age ≥ 18
   - Poseidon hash functions for identity commitments
   - Privacy-preserving date calculations with constraints

2. **🚀 GAP Server** (`simple-gap-server.js`)
   - Node.js server on port 6300 with REST API
   - Real-time ZK proof generation and verification
   - Jurisdiction-specific betting rules (US/UK/EU)
   - 24-hour proof caching with expiration

3. **🌐 Compact Integration** (`src/compact-integration.js`)
   - Midnight Network connectivity layer
   - ZK proof submission to blockchain
   - Identity commitment management
   - Network transaction handling

4. **🎮 Game Interface** (`standalone-demo.html`)
   - Interactive dApp demonstration
   - Real-time connection to GAP server
   - Visual proof generation animations
   - Judge presentation controls

## 🚀 Quick Start

### Run the Complete System

```bash
# 1. Start GAP Server (Terminal 1)
node simple-gap-server.js

# 2. Start Web Server (Terminal 2)  
python3 -m http.server 8080

# 3. Open Demo in Browser
open http://localhost:8080/standalone-demo.html
```

### Demo Flow
1. **🎬 Auto Demo** - Click for automated presentation
2. **Adult Verification** - Shows successful age proof + betting eligibility
3. **Minor Verification** - Shows privacy-preserving rejection
4. **Live Betting** - Real jurisdiction compliance testing

## 🔧 API Endpoints (GAP Server)

### Core Verification APIs
```bash
# Health Check
GET /health

# Generate Identity Commitment
POST /api/generate-commitment
{
  "birthYear": 1990,
  "birthMonth": 5, 
  "birthDay": 15,
  "identitySecret": "random_secret"
}

# Generate ZK Age Proof
POST /api/generate-proof
{
  "birthYear": 1990,
  "birthMonth": 5,
  "birthDay": 15, 
  "identitySecret": "random_secret",
  "identityCommitment": "commitment_hash"
}

# Check Betting Eligibility
POST /api/betting-eligibility
{
  "proofId": "proof_identifier",
  "bettingAmount": 500,
  "jurisdiction": "US"
}
```

## 🌍 Jurisdiction Compliance

| Region | Max Bet | Min Age | Status |
|--------|---------|---------|--------|
| 🇺🇸 US | $10,000 | 18+ | ✅ Active |
| 🇬🇧 UK | $50,000 | 18+ | ✅ Active |
| 🇪🇺 EU | $25,000 | 18+ | ✅ Active |
| 🌐 Default | $1,000 | 18+ | ✅ Active |

## 🔐 Privacy Technology

### Zero-Knowledge Guarantees
- **🔒 Private**: Exact birth date, exact age, identity data
- **🌐 Public**: Only age ≥ 18 eligibility (boolean)
- **🛡️ Proof System**: Groth16 ZK-SNARKs
- **🔑 Hash Function**: Poseidon (ZK-friendly)

### Security Features
- Identity commitments prevent replay attacks
- 24-hour proof expiration
- Cryptographic proof verification
- Jurisdiction-specific validation

## 🎯 Live Testing Results

**✅ Successful Demonstrations:**
- Adult User (34 years): Eligible for $500 bet in US
- Minor User (14 years): Privacy-preserving rejection
- Real ZK proof generation with GAP server
- Live betting eligibility with jurisdiction rules

## 🛠️ Technical Specifications

- **Protocol**: Generic Application Protocol (GAP)
- **Network**: Midnight Network (Privacy Blockchain)
- **Proof System**: Groth16 ZK-SNARKs via Compact
- **Addressing**: Bech32m format
- **Runtime**: Compact Protocol integration
- **Frontend**: Vanilla JavaScript (no frameworks)
- **Backend**: Node.js with Express

## 🎬 Judge Presentation Mode

The `standalone-demo.html` includes special features for legal/regulatory presentation:

- **🏛️ Judge Controls Panel** - Technical explanations and demo controls
- **📖 Tech Details** - Popup with complete technical specifications  
- **🔒 Privacy Mode** - Toggle to demonstrate data protection
- **🎬 Auto Demo** - Fully automated presentation flow
- **🌐 Connection Status** - Live server connectivity indicators

## 🚨 Production Notes

- **Privacy First**: Birth dates never transmitted in plaintext
- **Regulatory Ready**: Multi-jurisdiction compliance built-in
- **Scalable**: Designed for high-volume betting platforms
- **Secure**: 24-hour proof expiration and replay protection
- **Auditable**: Complete proof verification trail

## 📄 License

MIT License - Privacy-preserving sports betting compliance system.

---

**🎯 Complete DAP Ready!** This system demonstrates how zero-knowledge proofs enable regulatory compliance while maintaining absolute user privacy in sports betting applications.

**🎮 Try the Demo:** Open `standalone-demo.html` to see the live dApp in action!
