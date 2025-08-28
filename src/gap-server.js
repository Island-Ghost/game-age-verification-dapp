const express = require('express');
const cors = require('cors');
const { createHash } = require('crypto');
const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');

class AgeVerificationGAP {
    constructor() {
        this.app = express();
        this.port = 6300;
        this.proofCache = new Map();
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                service: 'Age Verification GAP Server',
                timestamp: new Date().toISOString()
            });
        });

        // Generate identity commitment
        this.app.post('/api/generate-commitment', async (req, res) => {
            try {
                const { birthYear, birthMonth, birthDay, identitySecret } = req.body;
                
                if (!birthYear || !birthMonth || !birthDay || !identitySecret) {
                    return res.status(400).json({ 
                        error: 'Missing required fields: birthYear, birthMonth, birthDay, identitySecret' 
                    });
                }

                // Generate Poseidon hash for identity commitment
                const commitment = await this.generateIdentityCommitment(
                    birthYear, birthMonth, birthDay, identitySecret
                );

                res.json({
                    success: true,
                    commitment: commitment.toString(),
                    message: 'Identity commitment generated successfully'
                });

            } catch (error) {
                console.error('Error generating commitment:', error);
                res.status(500).json({ error: 'Failed to generate commitment' });
            }
        });

        // Generate age verification proof
        this.app.post('/api/generate-proof', async (req, res) => {
            try {
                const {
                    birthYear,
                    birthMonth,
                    birthDay,
                    identitySecret,
                    identityCommitment
                } = req.body;

                if (!birthYear || !birthMonth || !birthDay || !identitySecret || !identityCommitment) {
                    return res.status(400).json({ 
                        error: 'Missing required fields for proof generation' 
                    });
                }

                // Get current date
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth() + 1;
                const currentDay = now.getDate();

                // Prepare circuit inputs
                const input = {
                    birth_year: birthYear,
                    birth_month: birthMonth,
                    birth_day: birthDay,
                    identity_secret: identitySecret,
                    current_year: currentYear,
                    current_month: currentMonth,
                    current_day: currentDay,
                    identity_commitment: identityCommitment,
                    min_age: 18
                };

                // Generate ZK proof
                const proof = await this.generateZKProof(input);
                
                // Cache the proof
                const proofId = this.generateProofId(proof);
                this.proofCache.set(proofId, {
                    proof,
                    publicSignals: proof.publicSignals,
                    timestamp: new Date().toISOString(),
                    isEligible: proof.publicSignals[0] === '1'
                });

                res.json({
                    success: true,
                    proofId,
                    isEligible: proof.publicSignals[0] === '1',
                    proofHash: proof.publicSignals[1],
                    message: proof.publicSignals[0] === '1' ? 
                        'Age verification successful - eligible for sports betting' : 
                        'Age verification failed - not eligible for sports betting'
                });

            } catch (error) {
                console.error('Error generating proof:', error);
                res.status(500).json({ error: 'Failed to generate age verification proof' });
            }
        });

        // Verify age proof
        this.app.post('/api/verify-proof', async (req, res) => {
            try {
                const { proofId } = req.body;

                if (!proofId) {
                    return res.status(400).json({ error: 'Missing proofId' });
                }

                const cachedProof = this.proofCache.get(proofId);
                if (!cachedProof) {
                    return res.status(404).json({ error: 'Proof not found' });
                }

                // Verify the ZK proof
                const isValid = await this.verifyZKProof(
                    cachedProof.proof, 
                    cachedProof.publicSignals
                );

                res.json({
                    success: true,
                    isValid,
                    isEligible: cachedProof.isEligible,
                    timestamp: cachedProof.timestamp,
                    message: isValid && cachedProof.isEligible ? 
                        'Valid proof - user is eligible for sports betting' :
                        'Invalid proof or user not eligible'
                });

            } catch (error) {
                console.error('Error verifying proof:', error);
                res.status(500).json({ error: 'Failed to verify proof' });
            }
        });

        // Sports betting eligibility check
        this.app.post('/api/betting-eligibility', async (req, res) => {
            try {
                const { proofId, bettingAmount, jurisdiction } = req.body;

                if (!proofId) {
                    return res.status(400).json({ error: 'Missing proofId' });
                }

                const cachedProof = this.proofCache.get(proofId);
                if (!cachedProof) {
                    return res.status(404).json({ error: 'Age verification proof not found' });
                }

                // Check age eligibility
                if (!cachedProof.isEligible) {
                    return res.json({
                        eligible: false,
                        reason: 'Age verification failed - must be 18 or older',
                        canBet: false
                    });
                }

                // Additional jurisdiction checks (example)
                const jurisdictionRules = this.getJurisdictionRules(jurisdiction);
                const eligibilityCheck = this.checkBettingEligibility(
                    bettingAmount, 
                    jurisdictionRules
                );

                res.json({
                    eligible: eligibilityCheck.eligible,
                    canBet: cachedProof.isEligible && eligibilityCheck.eligible,
                    reason: eligibilityCheck.reason,
                    maxBet: jurisdictionRules.maxBet,
                    jurisdiction: jurisdiction || 'default'
                });

            } catch (error) {
                console.error('Error checking betting eligibility:', error);
                res.status(500).json({ error: 'Failed to check betting eligibility' });
            }
        });
    }

    async generateIdentityCommitment(birthYear, birthMonth, birthDay, identitySecret) {
        // Simulate Poseidon hash generation
        // In production, use actual Poseidon hash from circomlib
        const input = `${birthYear}-${birthMonth}-${birthDay}-${identitySecret}`;
        const hash = createHash('sha256').update(input).digest('hex');
        return BigInt('0x' + hash.substring(0, 16));
    }

    async generateZKProof(input) {
        // Simulate ZK proof generation
        // In production, use actual snarkjs with compiled circuit
        console.log('Generating ZK proof for age verification...');
        
        // Calculate age
        const currentDate = new Date(input.current_year, input.current_month - 1, input.current_day);
        const birthDate = new Date(input.birth_year, input.birth_month - 1, input.birth_day);
        const age = Math.floor((currentDate - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
        
        const isEligible = age >= input.min_age ? '1' : '0';
        const proofHash = this.generateProofHash(input, isEligible);

        return {
            proof: {
                pi_a: ["0x1", "0x2", "0x1"],
                pi_b: [["0x1", "0x2"], ["0x3", "0x4"], ["0x1", "0x1"]],
                pi_c: ["0x1", "0x2", "0x1"],
                protocol: "groth16",
                curve: "bn128"
            },
            publicSignals: [isEligible, proofHash]
        };
    }

    async verifyZKProof(proof, publicSignals) {
        // Simulate ZK proof verification
        // In production, use actual snarkjs verification
        console.log('Verifying ZK proof...');
        return true; // Simplified for demo
    }

    generateProofId(proof) {
        const proofString = JSON.stringify(proof);
        return createHash('sha256').update(proofString).digest('hex').substring(0, 16);
    }

    generateProofHash(input, isEligible) {
        const hashInput = `${input.identity_commitment}-${isEligible}-${input.current_year}${input.current_month}${input.current_day}`;
        return createHash('sha256').update(hashInput).digest('hex').substring(0, 16);
    }

    getJurisdictionRules(jurisdiction) {
        const rules = {
            'US': { maxBet: 10000, minAge: 21, restricted: false },
            'UK': { maxBet: 50000, minAge: 18, restricted: false },
            'EU': { maxBet: 25000, minAge: 18, restricted: false },
            'default': { maxBet: 1000, minAge: 18, restricted: false }
        };
        return rules[jurisdiction] || rules['default'];
    }

    checkBettingEligibility(bettingAmount, rules) {
        if (bettingAmount > rules.maxBet) {
            return {
                eligible: false,
                reason: `Betting amount exceeds maximum allowed (${rules.maxBet})`
            };
        }

        if (rules.restricted) {
            return {
                eligible: false,
                reason: 'Sports betting restricted in this jurisdiction'
            };
        }

        return {
            eligible: true,
            reason: 'All eligibility requirements met'
        };
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`🎰 Age Verification GAP Server running on port ${this.port}`);
            console.log(`🔒 Privacy-preserving age verification for sports betting`);
            console.log(`📡 Health check: http://localhost:${this.port}/health`);
        });
    }
}

// Start the GAP server
if (require.main === module) {
    const gapServer = new AgeVerificationGAP();
    gapServer.start();
}

module.exports = AgeVerificationGAP;
