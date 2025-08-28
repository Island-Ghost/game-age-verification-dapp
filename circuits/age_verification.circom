pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

// Age verification circuit for sports betting (18+ proof)
template AgeVerification() {
    // Private inputs (known only to prover)
    signal private input birth_year;
    signal private input birth_month;
    signal private input birth_day;
    signal private input identity_secret; // Secret key for identity commitment
    
    // Public inputs (known to verifier)
    signal input current_year;
    signal input current_month;
    signal input current_day;
    signal input identity_commitment; // Public commitment to identity
    signal input min_age; // Minimum age requirement (18 for sports betting)
    
    // Output signals
    signal output is_eligible; // 1 if eligible, 0 if not
    signal output proof_hash; // Unique proof identifier
    
    // Components for age calculation
    component age_check = GreaterEqThan(8); // Support ages up to 255
    component identity_hasher = Poseidon(4);
    component proof_hasher = Poseidon(3);
    
    // Verify identity commitment
    identity_hasher.inputs[0] <== birth_year;
    identity_hasher.inputs[1] <== birth_month;
    identity_hasher.inputs[2] <== birth_day;
    identity_hasher.inputs[3] <== identity_secret;
    
    // Ensure the identity commitment matches
    identity_commitment === identity_hasher.out;
    
    // Calculate age in years (simplified calculation)
    // This assumes birth_month and birth_day are valid (1-12, 1-31)
    signal age_years;
    signal has_had_birthday;
    
    // Check if birthday has occurred this year
    component month_check = GreaterThan(8);
    component day_check = GreaterEqThan(8);
    component month_eq = IsEqual();
    
    month_check.in[0] <== current_month;
    month_check.in[1] <== birth_month;
    
    month_eq.in[0] <== current_month;
    month_eq.in[1] <== birth_month;
    
    day_check.in[0] <== current_day;
    day_check.in[1] <== birth_day;
    
    // has_had_birthday = (current_month > birth_month) OR (current_month == birth_month AND current_day >= birth_day)
    has_had_birthday <== month_check.out + month_eq.out * day_check.out;
    
    // Calculate current age
    age_years <== current_year - birth_year - (1 - has_had_birthday);
    
    // Check if age meets minimum requirement
    age_check.in[0] <== age_years;
    age_check.in[1] <== min_age;
    
    // Set eligibility output
    is_eligible <== age_check.out;
    
    // Generate unique proof hash
    proof_hasher.inputs[0] <== identity_commitment;
    proof_hasher.inputs[1] <== is_eligible;
    proof_hasher.inputs[2] <== current_year * 10000 + current_month * 100 + current_day;
    proof_hash <== proof_hasher.out;
    
    // Constraint to ensure valid date inputs
    component year_range = LessEqThan(12);
    component month_range1 = GreaterEqThan(8);
    component month_range2 = LessEqThan(8);
    component day_range1 = GreaterEqThan(8);
    component day_range2 = LessEqThan(8);
    
    // Birth year should be reasonable (1900-2024)
    year_range.in[0] <== birth_year;
    year_range.in[1] <== 2024;
    
    // Month should be 1-12
    month_range1.in[0] <== birth_month;
    month_range1.in[1] <== 1;
    month_range2.in[0] <== birth_month;
    month_range2.in[1] <== 12;
    
    // Day should be 1-31
    day_range1.in[0] <== birth_day;
    day_range1.in[1] <== 1;
    day_range2.in[0] <== birth_day;
    day_range2.in[1] <== 31;
    
    // Ensure all date constraints are satisfied
    signal date_valid;
    date_valid <== year_range.out * month_range1.out * month_range2.out * day_range1.out * day_range2.out;
    date_valid === 1;
}

component main = AgeVerification();
