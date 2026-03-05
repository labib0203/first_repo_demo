-- Add Pharmacist User to the System
-- This file adds a pharmacist user to enable pharmacy management features

USE careconnect;

-- Delete any existing pharmacist entry to prevent duplication if we reran
DELETE FROM users WHERE email = 'pharmacy@careconnect.bd';

-- Insert Pharmacist User
INSERT INTO users (email, password_hash, role) VALUES 
('pharmacy@careconnect.bd', 'pharmacy123', 'Pharmacist');

-- Get the user_id of the newly inserted pharmacist
SET @pharmacist_user_id = LAST_INSERT_ID();

-- Insert Profile for Pharmacist
INSERT INTO profiles (user_id, first_name, last_name, phone_number, gender, date_of_birth, address) 
VALUES (
    @pharmacist_user_id,
    'Pharmacy',
    'Manager',
    '01711223344',
    'Other',
    '1990-01-01',
    'Hospital Pharmacy Department, Dhaka'
);

-- Insert into staff table with CORRECT columns
INSERT INTO staff (user_id, job_title, salary, shift, joining_date)
VALUES (
    @pharmacist_user_id,
    'Pharmacist',
    35000.00,
    'Day',
    CURDATE()
);

SELECT 'Pharmacist user added successfully!' AS message;
SELECT 'Email: pharmacy@careconnect.bd' AS credentials;
SELECT 'Password: pharmacy123' AS password_info;
