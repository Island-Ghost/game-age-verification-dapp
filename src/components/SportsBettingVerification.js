import React, { useState, useEffect } from 'react';
import './SportsBettingVerification.css';

const SportsBettingVerification = ({ walletAddress, proofServerConnected }) => {
    const [verificationStep, setVerificationStep] = useState('input'); // input, generating, verified, betting
    const [birthDate, setBirthDate] = useState({ year: '', month: '', day: '' });
    const [identitySecret, setIdentitySecret] = useState('');
    const [identityCommitment, setIdentityCommitment] = useState('');
    const [proofId, setProofId] = useState('');
    const [isEligible, setIsEligible] = useState(false);
    const [bettingAmount, setBettingAmount] = useState('');
    const [jurisdiction, setJurisdiction] = useState('US');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [bettingEligibility, setBettingEligibility] = useState(null);

    const GAP_SERVER_URL = 'http://localhost:6300';

    useEffect(() => {
        // Generate a random identity secret on component mount
        if (!identitySecret) {
            const secret = Math.floor(Math.random() * 1000000000).toString();
            setIdentitySecret(secret);
        }
    }, [identitySecret]);

    const generateCommitment = async () => {
        if (!birthDate.year || !birthDate.month || !birthDate.day) {
            setError('Please enter your complete birth date');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${GAP_SERVER_URL}/api/generate-commitment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    birthYear: parseInt(birthDate.year),
                    birthMonth: parseInt(birthDate.month),
                    birthDay: parseInt(birthDate.day),
                    identitySecret: identitySecret
                })
            });

            const data = await response.json();
            
            if (data.success) {
                setIdentityCommitment(data.commitment);
                setVerificationStep('generating');
                await generateAgeProof(data.commitment);
            } else {
                setError(data.error || 'Failed to generate commitment');
            }
        } catch (err) {
            setError('Failed to connect to proof server');
        } finally {
            setLoading(false);
        }
    };

    const generateAgeProof = async (commitment) => {
        setLoading(true);
        
        try {
            const response = await fetch(`${GAP_SERVER_URL}/api/generate-proof`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    birthYear: parseInt(birthDate.year),
                    birthMonth: parseInt(birthDate.month),
                    birthDay: parseInt(birthDate.day),
                    identitySecret: identitySecret,
                    identityCommitment: commitment
                })
            });

            const data = await response.json();
            
            if (data.success) {
                setProofId(data.proofId);
                setIsEligible(data.isEligible);
                setVerificationStep('verified');
            } else {
                setError(data.error || 'Failed to generate age proof');
            }
        } catch (err) {
            setError('Failed to generate age proof');
        } finally {
            setLoading(false);
        }
    };

    const checkBettingEligibility = async () => {
        if (!bettingAmount || parseFloat(bettingAmount) <= 0) {
            setError('Please enter a valid betting amount');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${GAP_SERVER_URL}/api/betting-eligibility`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    proofId: proofId,
                    bettingAmount: parseFloat(bettingAmount),
                    jurisdiction: jurisdiction
                })
            });

            const data = await response.json();
            setBettingEligibility(data);
            setVerificationStep('betting');
        } catch (err) {
            setError('Failed to check betting eligibility');
        } finally {
            setLoading(false);
        }
    };

    const resetVerification = () => {
        setVerificationStep('input');
        setBirthDate({ year: '', month: '', day: '' });
        setIdentityCommitment('');
        setProofId('');
        setIsEligible(false);
        setBettingAmount('');
        setBettingEligibility(null);
        setError('');
        // Generate new identity secret
        const secret = Math.floor(Math.random() * 1000000000).toString();
        setIdentitySecret(secret);
    };

    const renderInputStep = () => (
        <div className="verification-step">
            <h3>🎰 Sports Betting Age Verification</h3>
            <p>Prove you're 18+ without revealing your exact age using zero-knowledge proofs</p>
            
            <div className="birth-date-input">
                <h4>Enter Your Birth Date</h4>
                <div className="date-inputs">
                    <input
                        type="number"
                        placeholder="Year (e.g., 1990)"
                        value={birthDate.year}
                        onChange={(e) => setBirthDate({...birthDate, year: e.target.value})}
                        min="1900"
                        max="2024"
                    />
                    <input
                        type="number"
                        placeholder="Month (1-12)"
                        value={birthDate.month}
                        onChange={(e) => setBirthDate({...birthDate, month: e.target.value})}
                        min="1"
                        max="12"
                    />
                    <input
                        type="number"
                        placeholder="Day (1-31)"
                        value={birthDate.day}
                        onChange={(e) => setBirthDate({...birthDate, day: e.target.value})}
                        min="1"
                        max="31"
                    />
                </div>
            </div>

            <div className="privacy-notice">
                <p>🔒 <strong>Privacy Protected:</strong> Your birth date is used to generate a zero-knowledge proof. 
                Only the fact that you're 18+ is revealed, not your exact age or birth date.</p>
            </div>

            <button 
                onClick={generateCommitment}
                disabled={loading || !proofServerConnected}
                className="verify-button"
            >
                {loading ? 'Generating Proof...' : 'Verify Age for Sports Betting'}
            </button>
        </div>
    );

    const renderGeneratingStep = () => (
        <div className="verification-step">
            <h3>🔄 Generating Zero-Knowledge Proof</h3>
            <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Creating privacy-preserving age verification proof...</p>
            </div>
            <div className="proof-details">
                <p><strong>Identity Commitment:</strong> {identityCommitment}</p>
                <p>This process proves you're 18+ without revealing your birth date</p>
            </div>
        </div>
    );

    const renderVerifiedStep = () => (
        <div className="verification-step">
            <h3>{isEligible ? '✅ Age Verification Successful' : '❌ Age Verification Failed'}</h3>
            
            {isEligible ? (
                <div className="success-message">
                    <p>🎉 You are eligible for sports betting!</p>
                    <div className="proof-info">
                        <p><strong>Proof ID:</strong> {proofId}</p>
                        <p><strong>Status:</strong> Verified 18+ years old</p>
                        <p><strong>Privacy:</strong> Your exact age remains private</p>
                    </div>
                    
                    <div className="betting-setup">
                        <h4>Set Up Your Bet</h4>
                        <div className="betting-inputs">
                            <input
                                type="number"
                                placeholder="Betting Amount ($)"
                                value={bettingAmount}
                                onChange={(e) => setBettingAmount(e.target.value)}
                                min="1"
                                step="0.01"
                            />
                            <select 
                                value={jurisdiction}
                                onChange={(e) => setJurisdiction(e.target.value)}
                            >
                                <option value="US">United States</option>
                                <option value="UK">United Kingdom</option>
                                <option value="EU">European Union</option>
                                <option value="default">Other</option>
                            </select>
                        </div>
                        <button 
                            onClick={checkBettingEligibility}
                            disabled={loading}
                            className="betting-button"
                        >
                            {loading ? 'Checking...' : 'Check Betting Eligibility'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="failure-message">
                    <p>❌ You must be 18 or older to participate in sports betting</p>
                    <button onClick={resetVerification} className="retry-button">
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );

    const renderBettingStep = () => (
        <div className="verification-step">
            <h3>🎯 Betting Eligibility Result</h3>
            
            {bettingEligibility && (
                <div className={`eligibility-result ${bettingEligibility.canBet ? 'success' : 'failure'}`}>
                    <h4>{bettingEligibility.canBet ? '✅ Ready to Bet!' : '❌ Betting Restricted'}</h4>
                    <p><strong>Status:</strong> {bettingEligibility.reason}</p>
                    <p><strong>Jurisdiction:</strong> {bettingEligibility.jurisdiction}</p>
                    <p><strong>Max Bet Limit:</strong> ${bettingEligibility.maxBet?.toLocaleString()}</p>
                    <p><strong>Requested Amount:</strong> ${parseFloat(bettingAmount).toLocaleString()}</p>
                    
                    {bettingEligibility.canBet && (
                        <div className="betting-actions">
                            <button className="place-bet-button">
                                🎰 Place Bet (${bettingAmount})
                            </button>
                            <p className="privacy-reminder">
                                🔒 Your age verification is cryptographically secured and private
                            </p>
                        </div>
                    )}
                </div>
            )}
            
            <div className="action-buttons">
                <button onClick={resetVerification} className="new-verification-button">
                    New Verification
                </button>
            </div>
        </div>
    );

    return (
        <div className="sports-betting-verification">
            <div className="verification-header">
                <h2>🎰 Privacy-Preserving Sports Betting</h2>
                <div className="connection-status">
                    <span className={`status ${proofServerConnected ? 'connected' : 'disconnected'}`}>
                        GAP Server: {proofServerConnected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    ⚠️ {error}
                </div>
            )}

            <div className="verification-content">
                {verificationStep === 'input' && renderInputStep()}
                {verificationStep === 'generating' && renderGeneratingStep()}
                {verificationStep === 'verified' && renderVerifiedStep()}
                {verificationStep === 'betting' && renderBettingStep()}
            </div>

            <div className="technical-info">
                <h4>🔧 Technical Details</h4>
                <ul>
                    <li><strong>Protocol:</strong> Generic Application Protocol (GAP)</li>
                    <li><strong>Network:</strong> Midnight Network</li>
                    <li><strong>Proof System:</strong> Zero-Knowledge (ZK-SNARKs)</li>
                    <li><strong>Privacy:</strong> Birth date never leaves your device in plaintext</li>
                    <li><strong>Verification:</strong> Cryptographic proof of age ≥ 18</li>
                </ul>
            </div>
        </div>
    );
};

export default SportsBettingVerification;
