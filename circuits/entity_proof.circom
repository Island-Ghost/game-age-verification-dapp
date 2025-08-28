pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

// Privacy-preserving entity verification circuit
template EntityProof() {
    // Private inputs (known only to prover)
    signal private input entity_id;
    signal private input secret_key;
    signal private input balance;
    signal private input timestamp;
    
    // Public inputs (known to verifier)
    signal input commitment;
    signal input min_balance_threshold;
    signal input max_timestamp;
    
    // Output signals
    signal output valid_entity;
    signal output proof_hash;
    
    // Components
    component hasher = Poseidon(4);
    component balance_check = GreaterEqThan(64);
    component timestamp_check = LessEqThan(64);
    
    // Verify commitment matches entity data
    hasher.inputs[0] <== entity_id;
    hasher.inputs[1] <== secret_key;
    hasher.inputs[2] <== balance;
    hasher.inputs[3] <== timestamp;
    
    commitment === hasher.out;
    
    // Verify balance meets minimum threshold
    balance_check.in[0] <== balance;
    balance_check.in[1] <== min_balance_threshold;
    
    // Verify timestamp is within valid range
    timestamp_check.in[0] <== timestamp;
    timestamp_check.in[1] <== max_timestamp;
    
    // Output validation result
    valid_entity <== balance_check.out * timestamp_check.out;
    
    // Generate proof hash for verification
    component proof_hasher = Poseidon(2);
    proof_hasher.inputs[0] <== commitment;
    proof_hasher.inputs[1] <== valid_entity;
    proof_hash <== proof_hasher.out;
}

component main = EntityProof();
