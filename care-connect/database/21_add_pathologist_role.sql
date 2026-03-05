USE careconnect;

-- 1. Update the role enum for users
ALTER TABLE users MODIFY COLUMN role ENUM('Admin', 'Doctor', 'Patient', 'Staff', 'Pharmacist', 'Pathologist') NOT NULL;

-- 2. Update VerifyAdminCredentials procedure to allow Pathologist login
DROP PROCEDURE IF EXISTS VerifyAdminCredentials;

DELIMITER //

CREATE PROCEDURE VerifyAdminCredentials(
    IN p_email VARCHAR(100),
    IN p_password VARCHAR(255),
    OUT p_is_valid INT,
    OUT p_user_id INT,
    OUT p_role VARCHAR(20)
)
BEGIN
    DECLARE v_stored_hash VARCHAR(255);
    DECLARE v_user_id INT;
    DECLARE v_role VARCHAR(20);
    
    -- Check if user exists
    SELECT user_id, password_hash, role 
    INTO v_user_id, v_stored_hash, v_role
    FROM users 
    WHERE email = p_email 
    LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        -- Check if role is in authorized staff roles
        IF v_stored_hash = p_password AND v_role IN ('Admin', 'Doctor', 'Staff', 'Pharmacist', 'Pathologist') THEN
            SET p_is_valid = 1;
            SET p_user_id = v_user_id;
            SET p_role = v_role;
        ELSE
            SET p_is_valid = 0;
        END IF;
    ELSE
        SET p_is_valid = 0;
    END IF;
END //

DELIMITER ;

-- 3. Seed a Pathologist User
DELETE FROM users WHERE email = 'pathology@careconnect.bd';

INSERT INTO users (email, password_hash, role) VALUES 
('pathology@careconnect.bd', 'pathology123', 'Pathologist');

SET @pathologist_id = LAST_INSERT_ID();

INSERT INTO profiles (user_id, first_name, last_name, phone_number, gender, date_of_birth, address) 
VALUES (
    @pathologist_id,
    'Pathology',
    'Report Manager',
    '01811223344',
    'Male',
    '1985-05-15',
    'Diagnostic Lab, CareConnect Hospital'
);

-- Add to staff table
INSERT INTO staff (user_id, job_title, salary, shift, joining_date)
VALUES (
    @pathologist_id,
    'Pathologist',
    55000.00,
    'Day',
    CURDATE()
);
