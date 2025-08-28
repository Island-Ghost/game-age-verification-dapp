import React, { useState, useEffect } from 'react';
import './App.css';
import EntityVerification from './components/EntityVerification';
import WalletConnection from './components/WalletConnection';
import ProofGeneration from './components/ProofGeneration';
import TransactionHistory from './components/TransactionHistory';
import SportsBettingVerification from './components/SportsBettingVerification';

function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [proofServerStatus, setProofServerStatus] = useState('disconnected');

  useEffect(() => {
    checkProofServerStatus();
  }, []);

  const checkProofServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:6300/health');
      if (response.ok) {
        setProofServerStatus('connected');
      } else {
        setProofServerStatus('error');
      }
    } catch (error) {
      setProofServerStatus('error');
    }
  };

  const handleWalletConnect = (address) => {
    setWalletConnected(true);
    setWalletAddress(address);
  };

  const handleWalletDisconnect = () => {
    setWalletConnected(false);
    setWalletAddress('');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🌙 Midnight Network Privacy DApp</h1>
        <div className="status-indicators">
          <div className={`status-indicator ${proofServerStatus}`}>
            Proof Server: {proofServerStatus}
          </div>
          <div className={`status-indicator ${walletConnected ? 'connected' : 'disconnected'}`}>
            Wallet: {walletConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </header>

      <main className="App-main">
        <div className="dapp-container">
          <WalletConnection 
            onConnect={handleWalletConnect}
            onDisconnect={handleWalletDisconnect}
            connected={walletConnected}
            address={walletAddress}
          />

          {walletConnected && (
            <>
              <SportsBettingVerification 
                walletAddress={walletAddress}
                proofServerConnected={proofServerStatus === 'connected'}
              />
              
              <EntityVerification 
                walletAddress={walletAddress}
                proofServerConnected={proofServerStatus === 'connected'}
              />
              
              <ProofGeneration 
                walletAddress={walletAddress}
                proofServerConnected={proofServerStatus === 'connected'}
              />
              
              <TransactionHistory 
                walletAddress={walletAddress}
              />
            </>
          )}
        </div>
      </main>

      <footer className="App-footer">
        <p>Privacy-preserving transactions powered by Midnight Network</p>
      </footer>
    </div>
  );
}

export default App;
