const http = require('http');
const url = require('url');
const { createHash } = require('crypto');

/**
 * Simple GAP Server for Age Verification Demo
 * Demonstrates privacy-preserving age verification for sports betting
 */
class SimpleAgeVerificationGAP {
    constructor() {
        this.port = 6300;
        this.proofCache = new Map();
        this.server = null;
    }

    start() {
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        this.server.listen(this.port, () => {
            console.log('🎰 Age Verification GAP Server Started');
            console.log(`📡 Server running on http://localhost:${this.port}`);
            console.log('🔒 Privacy-preserving age verification for sports betting');
            console.log('');
            console.log('Available endpoints:');
            console.log('  GET  /health                    - Health check');
            console.log('  POST /api/generate-commitment   - Generate identity commitment');
            console.log('  POST /api/generate-proof        - Generate age verification proof');
            console.log('  POST /api/verify-proof          - Verify age proof');
            console.log('  POST /api/betting-eligibility   - Check betting eligibility');
            console.log('');
        });
    }

    handleRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        const path = parsedUrl.pathname;
        const method = req.method;

        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        console.log(`${new Date().toISOString()} - ${method} ${path}`);

        if (method === 'GET' && path === '/health') {
            this.handleHealth(req, res);
        } else if (method === 'POST' && path === '/api/generate-commitment') {
            this.handleGenerateCommitment(req, res);
        } else if (method === 'POST' && path === '/api/generate-proof') {
            this.handleGenerateProof(req, res);
        } else if (method === 'POST' && path === '/api/verify-proof') {
            this.handleVerifyProof(req, res);
        } else if (method === 'POST' && path === '/api/betting-eligibility') {
            this.handleBettingEligibility(req, res);
        } else {
            this.handle404(req, res);
        }
    }

    handleHealth(req, res) {
        const response = {
            status: 'healthy',
            service: 'Age Verification GAP Server',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
        this.sendJSON(res, 200, response);
    }

    handleGenerateCommitment(req, res) {
        this.getRequestBody(req, (body) => {
            try {
                const { birthYear, birthMonth, birthDay, identitySecret } = JSON.parse(body);
                
                if (!birthYear || !birthMonth || !birthDay || !identitySecret) {
                    this.sendJSON(res, 400, { 
                        error: 'Missing required fields: birthYear, birthMonth, birthDay, identitySecret' 
                    });
                    return;
                }

                // Generate identity commitment (simulated Poseidon hash)
                const commitment = this.generateIdentityCommitment(
                    birthYear, birthMonth, birthDay, identitySecret
                );

                console.log(`🔒 Identity commitment generated: ${commitment}`);

                this.sendJSON(res, 200, {
                    success: true,
                    commitment: commitment,
                    message: 'Identity commitment generated successfully'
                });

            } catch (error) {
                console.error('Error generating commitment:', error);
                this.sendJSON(res, 500, { error: 'Failed to generate commitment' });
            }
        });
    }

    handleGenerateProof(req, res) {
        this.getRequestBody(req, (body) => {
            try {
                const {
                    birthYear,
                    birthMonth,
                    birthDay,
                    identitySecret,
                    identityCommitment
                } = JSON.parse(body);

                if (!birthYear || !birthMonth || !birthDay || !identitySecret || !identityCommitment) {
                    this.sendJSON(res, 400, { 
                        error: 'Missing required fields for proof generation' 
                    });
                    return;
                }

                // Calculate age
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth() + 1;
                const currentDay = now.getDate();

                const age = this.calculateAge(birthYear, birthMonth, birthDay, currentYear, currentMonth, currentDay);
                const isEligible = age >= 18;

                // Generate ZK proof (simulated)
                const proof = this.generateZKProof({
                    birthYear, birthMonth, birthDay, identitySecret,
                    currentYear, currentMonth, currentDay, identityCommitment,
                    isEligible
                });

                // Cache the proof
                const proofId = this.generateProofId(proof);
                this.proofCache.set(proofId, {
                    proof,
                    isEligible,
                    age: isEligible ? '18+' : 'under_18',
                    timestamp: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                });

                console.log(`🎯 Age verification proof generated: ${proofId} (Eligible: ${isEligible})`);

                this.sendJSON(res, 200, {
                    success: true,
                    proofId,
                    isEligible,
                    age: isEligible ? '18+' : 'under_18',
                    proofHash: proof.proofHash,
                    message: isEligible ? 
                        'Age verification successful - eligible for sports betting' : 
                        'Age verification failed - not eligible for sports betting'
                });

            } catch (error) {
                console.error('Error generating proof:', error);
                this.sendJSON(res, 500, { error: 'Failed to generate age verification proof' });
            }
        });
    }

    handleVerifyProof(req, res) {
        this.getRequestBody(req, (body) => {
            try {
                const { proofId } = JSON.parse(body);

                if (!proofId) {
                    this.sendJSON(res, 400, { error: 'Missing proofId' });
                    return;
                }

                const cachedProof = this.proofCache.get(proofId);
                if (!cachedProof) {
                    this.sendJSON(res, 404, { error: 'Proof not found' });
                    return;
                }

                // Check if proof has expired
                const now = new Date();
                const expiresAt = new Date(cachedProof.expiresAt);
                const isExpired = now > expiresAt;

                console.log(`🔍 Proof verification: ${proofId} (Valid: ${!isExpired}, Eligible: ${cachedProof.isEligible})`);

                this.sendJSON(res, 200, {
                    success: true,
                    isValid: !isExpired,
                    isEligible: cachedProof.isEligible,
                    age: cachedProof.age,
                    timestamp: cachedProof.timestamp,
                    expiresAt: cachedProof.expiresAt,
                    message: !isExpired && cachedProof.isEligible ? 
                        'Valid proof - user is eligible for sports betting' :
                        isExpired ? 'Proof has expired' : 'Invalid proof or user not eligible'
                });

            } catch (error) {
                console.error('Error verifying proof:', error);
                this.sendJSON(res, 500, { error: 'Failed to verify proof' });
            }
        });
    }

    handleBettingEligibility(req, res) {
        this.getRequestBody(req, (body) => {
            try {
                const { proofId, bettingAmount, jurisdiction } = JSON.parse(body);

                if (!proofId) {
                    this.sendJSON(res, 400, { error: 'Missing proofId' });
                    return;
                }

                const cachedProof = this.proofCache.get(proofId);
                if (!cachedProof) {
                    this.sendJSON(res, 404, { error: 'Age verification proof not found' });
                    return;
                }

                // Check if proof has expired
                const now = new Date();
                const expiresAt = new Date(cachedProof.expiresAt);
                const isExpired = now > expiresAt;

                if (isExpired) {
                    this.sendJSON(res, 400, { 
                        eligible: false,
                        reason: 'Age verification proof has expired',
                        canBet: false
                    });
                    return;
                }

                // Check age eligibility
                if (!cachedProof.isEligible) {
                    this.sendJSON(res, 200, {
                        eligible: false,
                        reason: 'Age verification failed - must be 18 or older',
                        canBet: false
                    });
                    return;
                }

                // Check jurisdiction rules
                const jurisdictionRules = this.getJurisdictionRules(jurisdiction);
                const eligibilityCheck = this.checkBettingEligibility(bettingAmount, jurisdictionRules);

                console.log(`🎲 Betting eligibility check: ${proofId} - Amount: $${bettingAmount} - Jurisdiction: ${jurisdiction} - Eligible: ${eligibilityCheck.eligible}`);

                this.sendJSON(res, 200, {
                    eligible: eligibilityCheck.eligible,
                    canBet: cachedProof.isEligible && eligibilityCheck.eligible,
                    reason: eligibilityCheck.reason,
                    maxBet: jurisdictionRules.maxBet,
                    jurisdiction: jurisdiction || 'default',
                    ageVerified: true,
                    proofValid: true
                });

            } catch (error) {
                console.error('Error checking betting eligibility:', error);
                this.sendJSON(res, 500, { error: 'Failed to check betting eligibility' });
            }
        });
    }

    handle404(req, res) {
        this.sendJSON(res, 404, { error: 'Endpoint not found' });
    }

    // Helper methods
    generateIdentityCommitment(birthYear, birthMonth, birthDay, identitySecret) {
        const input = `${birthYear}-${birthMonth}-${birthDay}-${identitySecret}`;
        const hash = createHash('sha256').update(input).digest('hex');
        return hash.substring(0, 16);
    }

    calculateAge(birthYear, birthMonth, birthDay, currentYear, currentMonth, currentDay) {
        let age = currentYear - birthYear;
        if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
            age--;
        }
        return age;
    }

    generateZKProof(input) {
        const proofHash = createHash('sha256')
            .update(`${input.identityCommitment}-${input.isEligible}-${Date.now()}`)
            .digest('hex')
            .substring(0, 16);

        return {
            proof: {
                pi_a: ["0x1", "0x2", "0x1"],
                pi_b: [["0x1", "0x2"], ["0x3", "0x4"], ["0x1", "0x1"]],
                pi_c: ["0x1", "0x2", "0x1"],
                protocol: "groth16",
                curve: "bn128"
            },
            publicSignals: [input.isEligible ? "1" : "0", proofHash],
            proofHash
        };
    }

    generateProofId(proof) {
        const proofString = JSON.stringify(proof);
        return createHash('sha256').update(proofString).digest('hex').substring(0, 16);
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
        if (!bettingAmount || bettingAmount <= 0) {
            return {
                eligible: false,
                reason: 'Invalid betting amount'
            };
        }

        if (bettingAmount > rules.maxBet) {
            return {
                eligible: false,
                reason: `Betting amount exceeds maximum allowed ($${rules.maxBet.toLocaleString()})`
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

    getRequestBody(req, callback) {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            callback(body);
        });
    }

    sendJSON(res, statusCode, data) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data, null, 2));
    }

    stop() {
        if (this.server) {
            this.server.close();
            console.log('🔌 GAP Server stopped');
        }
    }
}

// Start the server
if (require.main === module) {
    const gapServer = new SimpleAgeVerificationGAP();
    gapServer.start();

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down GAP server...');
        gapServer.stop();
        process.exit(0);
    });
}

module.exports = SimpleAgeVerificationGAP;
