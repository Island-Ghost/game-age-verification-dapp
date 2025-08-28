const { Compact } = require('@midnight-ntwrk/compact-runtime');
const { MidnightProviders } = require('@midnight-ntwrk/midnight-js-network-id');
const { createHash } = require('crypto');

/**
 * Compact integration for age verification on Midnight Network
 * Provides privacy-preserving age proofs for sports betting eligibility
 */
class CompactAgeVerification {
    constructor(networkId = 'testnet') {
        this.networkId = networkId;
        this.provider = null;
        this.compact = null;
        this.initialized = false;
    }

    /**
     * Initialize Compact runtime and connect to Midnight Network
     */
    async initialize() {
        try {
            // Initialize Midnight provider
            this.provider = MidnightProviders.getProvider(this.networkId);
            
            // Initialize Compact runtime
            this.compact = new Compact({
                provider: this.provider,
                networkId: this.networkId
            });

            await this.compact.initialize();
            this.initialized = true;
            
            console.log(`✅ Compact initialized on ${this.networkId}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Compact:', error);
            return false;
        }
    }

    /**
     * Create a privacy-preserving identity commitment using Compact
     */
    async createIdentityCommitment(birthYear, birthMonth, birthDay, identitySecret) {
        if (!this.initialized) {
            throw new Error('Compact not initialized');
        }

        try {
            // Create identity data structure
            const identityData = {
                birth_year: BigInt(birthYear),
                birth_month: BigInt(birthMonth),
                birth_day: BigInt(birthDay),
                secret: BigInt(identitySecret)
            };

            // Generate commitment using Compact's privacy primitives
            const commitment = await this.compact.createCommitment(identityData);
            
            console.log('🔒 Identity commitment created:', commitment.toString());
            return commitment;
        } catch (error) {
            console.error('❌ Failed to create identity commitment:', error);
            throw error;
        }
    }

    /**
     * Generate age verification proof using Compact
     */
    async generateAgeProof(identityData, currentDate) {
        if (!this.initialized) {
            throw new Error('Compact not initialized');
        }

        try {
            // Prepare proof inputs
            const proofInputs = {
                // Private inputs (only known to prover)
                private: {
                    birth_year: BigInt(identityData.birthYear),
                    birth_month: BigInt(identityData.birthMonth),
                    birth_day: BigInt(identityData.birthDay),
                    identity_secret: BigInt(identityData.identitySecret)
                },
                // Public inputs (known to verifier)
                public: {
                    current_year: BigInt(currentDate.year),
                    current_month: BigInt(currentDate.month),
                    current_day: BigInt(currentDate.day),
                    min_age: BigInt(18),
                    identity_commitment: identityData.identityCommitment
                }
            };

            // Generate zero-knowledge proof using Compact
            const proof = await this.compact.generateProof('age_verification', proofInputs);
            
            // Calculate age for verification
            const age = this.calculateAge(
                identityData.birthYear,
                identityData.birthMonth,
                identityData.birthDay,
                currentDate.year,
                currentDate.month,
                currentDate.day
            );

            const result = {
                proof: proof,
                isEligible: age >= 18,
                proofHash: this.generateProofHash(proof),
                timestamp: new Date().toISOString(),
                age: age >= 18 ? '18+' : 'under_18' // Privacy-preserving age indicator
            };

            console.log('🎯 Age verification proof generated:', result.proofHash);
            return result;
        } catch (error) {
            console.error('❌ Failed to generate age proof:', error);
            throw error;
        }
    }

    /**
     * Verify age proof using Compact
     */
    async verifyAgeProof(proof, publicInputs) {
        if (!this.initialized) {
            throw new Error('Compact not initialized');
        }

        try {
            // Verify the zero-knowledge proof
            const isValid = await this.compact.verifyProof('age_verification', proof, publicInputs);
            
            console.log('🔍 Proof verification result:', isValid);
            return isValid;
        } catch (error) {
            console.error('❌ Failed to verify proof:', error);
            return false;
        }
    }

    /**
     * Submit age verification to Midnight Network
     */
    async submitVerificationToNetwork(proofData, walletAddress) {
        if (!this.initialized) {
            throw new Error('Compact not initialized');
        }

        try {
            // Create transaction for age verification
            const transaction = await this.compact.createTransaction({
                type: 'age_verification',
                from: walletAddress,
                data: {
                    proof_hash: proofData.proofHash,
                    is_eligible: proofData.isEligible,
                    timestamp: proofData.timestamp
                },
                proof: proofData.proof
            });

            // Submit to Midnight Network
            const txHash = await this.compact.submitTransaction(transaction);
            
            console.log('📡 Age verification submitted to network:', txHash);
            return {
                success: true,
                transactionHash: txHash,
                networkId: this.networkId
            };
        } catch (error) {
            console.error('❌ Failed to submit verification:', error);
            throw error;
        }
    }

    /**
     * Query age verification status from network
     */
    async queryVerificationStatus(proofHash) {
        if (!this.initialized) {
            throw new Error('Compact not initialized');
        }

        try {
            const status = await this.compact.queryState({
                type: 'age_verification',
                proof_hash: proofHash
            });

            return {
                exists: status !== null,
                isEligible: status?.is_eligible || false,
                timestamp: status?.timestamp,
                verified: true
            };
        } catch (error) {
            console.error('❌ Failed to query verification status:', error);
            return { exists: false, verified: false };
        }
    }

    /**
     * Create sports betting eligibility certificate
     */
    async createBettingCertificate(proofData, jurisdiction, maxBetAmount) {
        if (!this.initialized) {
            throw new Error('Compact not initialized');
        }

        try {
            const certificate = {
                proof_hash: proofData.proofHash,
                is_eligible: proofData.isEligible,
                jurisdiction: jurisdiction,
                max_bet_amount: maxBetAmount,
                issued_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
                certificate_id: this.generateCertificateId(proofData.proofHash, jurisdiction)
            };

            // Sign certificate with Compact
            const signedCertificate = await this.compact.signData(certificate);
            
            console.log('📜 Betting certificate created:', certificate.certificate_id);
            return signedCertificate;
        } catch (error) {
            console.error('❌ Failed to create betting certificate:', error);
            throw error;
        }
    }

    /**
     * Helper method to calculate age
     */
    calculateAge(birthYear, birthMonth, birthDay, currentYear, currentMonth, currentDay) {
        let age = currentYear - birthYear;
        
        // Check if birthday has occurred this year
        if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
            age--;
        }
        
        return age;
    }

    /**
     * Generate unique proof hash
     */
    generateProofHash(proof) {
        const proofString = JSON.stringify(proof);
        return createHash('sha256').update(proofString).digest('hex').substring(0, 16);
    }

    /**
     * Generate unique certificate ID
     */
    generateCertificateId(proofHash, jurisdiction) {
        const input = `${proofHash}-${jurisdiction}-${Date.now()}`;
        return createHash('sha256').update(input).digest('hex').substring(0, 12);
    }

    /**
     * Get network information
     */
    getNetworkInfo() {
        return {
            networkId: this.networkId,
            initialized: this.initialized,
            provider: this.provider ? 'connected' : 'disconnected'
        };
    }

    /**
     * Cleanup and disconnect
     */
    async disconnect() {
        if (this.compact) {
            await this.compact.disconnect();
        }
        this.initialized = false;
        console.log('🔌 Compact disconnected');
    }
}

module.exports = CompactAgeVerification;
