USE careconnect;

DROP PROCEDURE IF EXISTS DischargePatient;

DELIMITER //

CREATE PROCEDURE DischargePatient(
    IN p_admission_id INT,
    OUT p_total_bill DECIMAL(10, 2),
    OUT p_invoice_id INT,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_room_number VARCHAR(20);
    DECLARE v_daily_rate DECIMAL(10, 2);
    DECLARE v_admission_time TIMESTAMP;
    DECLARE v_discharge_time TIMESTAMP;
    DECLARE v_days_stayed INT;
    DECLARE v_patient_id INT;
    DECLARE v_already_discharged INT;

    -- Check if admission exists and is active
    SELECT COUNT(*)
    INTO v_already_discharged
    FROM admissions
    WHERE admission_id = p_admission_id;

    IF v_already_discharged = 0 THEN
        SET p_message = 'Admission record not found.';
    ELSE
        -- Get admission details
        SELECT room_number, admission_date, patient_id
        INTO v_room_number, v_admission_time, v_patient_id
        FROM admissions
        WHERE admission_id = p_admission_id;
        
        -- Check if already discharged
        IF (SELECT status FROM admissions WHERE admission_id = p_admission_id) = 'Discharged' THEN
            SET p_message = 'Patient is already discharged.';
        ELSE
            -- 1. Calculate Duration and Cost
            SET v_discharge_time = NOW();
            
            -- Get Room Rate
            SELECT charge_per_day INTO v_daily_rate FROM rooms WHERE room_number = v_room_number;

            -- Calculate Days (Ceil logic: even 1 hour counts as a day for simplicity, or 24h blocks)
            -- Using simple DATEDIFF + 1 for inclusive billing
            SET v_days_stayed = DATEDIFF(v_discharge_time, v_admission_time);
            
            IF v_days_stayed < 1 THEN
                SET v_days_stayed = 1;
            END IF;

            SET p_total_bill = v_days_stayed * v_daily_rate;

            -- 2. Update Admission Record
            UPDATE admissions 
            SET discharge_date = v_discharge_time,
                total_cost = p_total_bill,
                status = 'Discharged',
                payment_status = 'Pending' -- Invoice will be created
            WHERE admission_id = p_admission_id;

            -- 3. Free up the Room
            UPDATE rooms 
            SET is_available = TRUE 
            WHERE room_number = v_room_number;

            -- 4. Create Invoice
            INSERT INTO invoices (admission_id, total_amount, net_amount, status)
            VALUES (p_admission_id, p_total_bill, p_total_bill, 'Unpaid');
            
            SET p_invoice_id = LAST_INSERT_ID();
            SET p_message = 'Discharge successful. Invoice generated.';

        END IF;
    END IF;
END //

DELIMITER ;

-- Discharge now checks lab test clearance




-- discharge now validates lab test clearance before finalizing


-- [F41: Extended Discharge Validation — Farhana Uvro]
DELIMITER $$

CREATE OR REPLACE PROCEDURE sp_validate_discharge(
    IN  p_patient_id    INT,
    OUT p_can_discharge TINYINT)
BEGIN
    DECLARE v_pending_labs     INT          DEFAULT 0;
    DECLARE v_pending_bills    DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_active_consult   INT          DEFAULT 0;
    DECLARE v_pending_pharmacy INT          DEFAULT 0;

    SELECT COUNT(*) INTO v_pending_labs
    FROM lab_tests
    WHERE patient_id = p_patient_id
      AND status NOT IN ('completed','cancelled')
      AND scheduled_date <= NOW();

    SELECT COALESCE(SUM(total_amount - paid_amount), 0) INTO v_pending_bills
    FROM billing b
    JOIN appointments a ON b.appointment_id = a.appointment_id
    WHERE a.patient_id = p_patient_id
      AND b.payment_status != 'paid';

    SELECT COUNT(*) INTO v_active_consult
    FROM consultations
    WHERE patient_id = p_patient_id AND status = 'in_progress';

    SELECT COUNT(*) INTO v_pending_pharmacy
    FROM pharmacy_orders
    WHERE patient_id = p_patient_id
      AND order_status NOT IN ('dispensed','cancelled');

    IF v_pending_labs > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot discharge: lab results still pending';
    ELSEIF v_pending_bills > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot discharge: outstanding billing balance';
    ELSEIF v_active_consult > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot discharge: consultation in progress';
    ELSEIF v_pending_pharmacy > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot discharge: pharmacy order not dispensed';
    ELSE
        SET p_can_discharge = 1;
        INSERT INTO discharge_log(patient_id, cleared_at, cleared_by)
        VALUES (p_patient_id, NOW(), CURRENT_USER());
    END IF;
END$$

CREATE OR REPLACE TRIGGER trg_before_discharge_insert
BEFORE INSERT ON discharges
FOR EACH ROW
BEGIN
    DECLARE v_ok TINYINT DEFAULT 0;
    CALL sp_validate_discharge(NEW.patient_id, v_ok);
    IF v_ok != 1 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Discharge blocked: clearance validation failed';
    END IF;
END$$

CREATE OR REPLACE PROCEDURE sp_force_discharge(
    IN p_patient_id  INT,
    IN p_admin_id    INT,
    IN p_reason      VARCHAR(255))
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM staff WHERE staff_id = p_admin_id AND role = 'admin'
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Only admins can force a discharge';
    END IF;

    INSERT INTO discharges(patient_id, discharge_date, is_forced,
                           admin_override_by, override_reason)
    VALUES (p_patient_id, NOW(), 1, p_admin_id, p_reason);

    INSERT INTO discharge_log(patient_id, cleared_at, cleared_by, is_forced)
    VALUES (p_patient_id, NOW(), p_admin_id, 1);
END$$

DELIMITER ;
-- [F41: end]


-- [F41: Extended Discharge Validation System — Farhana Uvro]

DELIMITER $$

-- Procedure: Full pre-discharge validation for a patient
CREATE OR REPLACE PROCEDURE sp_validate_discharge(
    IN  p_patient_id     INT,
    OUT p_can_discharge  TINYINT)
BEGIN
    DECLARE v_pending_labs      INT          DEFAULT 0;
    DECLARE v_pending_bills     DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_active_consult    INT          DEFAULT 0;
    DECLARE v_pending_pharmacy  INT          DEFAULT 0;
    DECLARE v_open_complaints   INT          DEFAULT 0;

    -- Check pending lab test results
    SELECT COUNT(*) INTO v_pending_labs
    FROM lab_tests
    WHERE patient_id  = p_patient_id
      AND status      NOT IN ('completed', 'cancelled')
      AND scheduled_date <= NOW();

    -- Check outstanding billing balance
    SELECT COALESCE(SUM(total_amount - paid_amount), 0) INTO v_pending_bills
    FROM billing b
    JOIN appointments a ON b.appointment_id = a.appointment_id
    WHERE a.patient_id      = p_patient_id
      AND b.payment_status != 'paid';

    -- Check for active or in-progress consultations
    SELECT COUNT(*) INTO v_active_consult
    FROM consultations
    WHERE patient_id = p_patient_id
      AND status     = 'in_progress';

    -- Check for unprocessed pharmacy orders
    SELECT COUNT(*) INTO v_pending_pharmacy
    FROM pharmacy_orders
    WHERE patient_id    = p_patient_id
      AND order_status NOT IN ('dispensed', 'cancelled');

    -- Check for open patient complaints
    SELECT COUNT(*) INTO v_open_complaints
    FROM patient_complaints
    WHERE patient_id = p_patient_id
      AND status     = 'open';

    -- Raise specific error for each blocking condition
    IF v_pending_labs > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot discharge: lab results still pending';
    ELSEIF v_pending_bills > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot discharge: outstanding billing balance';
    ELSEIF v_active_consult > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot discharge: consultation still in progress';
    ELSEIF v_pending_pharmacy > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot discharge: pharmacy order not dispensed';
    ELSEIF v_open_complaints > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot discharge: open patient complaint unresolved';
    ELSE
        SET p_can_discharge = 1;
        INSERT INTO discharge_log(patient_id, cleared_at, cleared_by, notes)
        VALUES (p_patient_id, NOW(), CURRENT_USER(),
                'All pre-discharge checks passed');
    END IF;
END$$

-- Trigger: enforce validation on every discharge insert
CREATE OR REPLACE TRIGGER trg_before_discharge_insert
BEFORE INSERT ON discharges
FOR EACH ROW
BEGIN
    DECLARE v_ok TINYINT DEFAULT 0;
    CALL sp_validate_discharge(NEW.patient_id, v_ok);
    IF v_ok != 1 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Discharge blocked: pre-discharge validation failed';
    END IF;
END$$

-- Procedure: Admin override for forced discharge
CREATE OR REPLACE PROCEDURE sp_force_discharge(
    IN p_patient_id  INT,
    IN p_admin_id    INT,
    IN p_reason      VARCHAR(500))
BEGIN
    DECLARE v_is_admin INT DEFAULT 0;

    SELECT COUNT(*) INTO v_is_admin
    FROM staff
    WHERE staff_id = p_admin_id AND role = 'admin' AND is_active = 1;

    IF v_is_admin = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Only active admins can perform a forced discharge';
    END IF;

    IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Override reason is mandatory for forced discharge';
    END IF;

    INSERT INTO discharges(patient_id, discharge_date,
                           is_forced, admin_override_by, override_reason)
    VALUES (p_patient_id, NOW(), 1, p_admin_id, p_reason);

    INSERT INTO discharge_log(patient_id, cleared_at,
                              cleared_by, is_forced, notes)
    VALUES (p_patient_id, NOW(), p_admin_id, 1,
            CONCAT('FORCED: ', p_reason));
END$$

DELIMITER ;
-- [F41: end]


-- [F41: Extended Discharge Validation System — Farhana Uvro]

DELIMITER $$

-- Procedure: Full pre-discharge validation for a patient
CREATE OR REPLACE PROCEDURE sp_validate_discharge(
    IN  p_patient_id     INT,
    OUT p_can_discharge  TINYINT)
BEGIN
    DECLARE v_pending_labs      INT          DEFAULT 0;
    DECLARE v_pending_bills     DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_active_consult    INT          DEFAULT 0;
    DECLARE v_pending_pharmacy  INT          DEFAULT 0;
    DECLARE v_open_complaints   INT          DEFAULT 0;

    -- Check pending lab test results
    SELECT COUNT(*) INTO v_pending_labs
    FROM lab_tests
    WHERE patient_id  = p_patient_id
      AND status      NOT IN ('completed', 'cancelled')
      AND scheduled_date <= NOW();

    -- Check outstanding billing balance
    SELECT COALESCE(SUM(total_amount - paid_amount), 0) INTO v_pending_bills
    FROM billing b
    JOIN appointments a ON b.appointment_id = a.appointment_id
    WHERE a.patient_id      = p_patient_id
      AND b.payment_status != 'paid';

    -- Check for active or in-progress consultations
    SELECT COUNT(*) INTO v_active_consult
    FROM consultations
    WHERE patient_id = p_patient_id
      AND status     = 'in_progress';

    -- Check for unprocessed pharmacy orders
    SELECT COUNT(*) INTO v_pending_pharmacy
    FROM pharmacy_orders
    WHERE patient_id    = p_patient_id
      AND order_status NOT IN ('dispensed', 'cancelled');

    -- Check for open patient complaints
    SELECT COUNT(*) INTO v_open_complaints
    FROM patient_complaints
    WHERE patient_id = p_patient_id
      AND status     = 'open';

    -- Raise specific error for each blocking condition
    IF v_pending_labs > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot discharge: lab results still pending';
    ELSEIF v_pending_bills > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot discharge: outstanding billing balance';
    ELSEIF v_active_consult > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot discharge: consultation still in progress';
    ELSEIF v_pending_pharmacy > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot discharge: pharmacy order not dispensed';
    ELSEIF v_open_complaints > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot discharge: open patient complaint unresolved';
    ELSE
        SET p_can_discharge = 1;
        INSERT INTO discharge_log(patient_id, cleared_at, cleared_by, notes)
        VALUES (p_patient_id, NOW(), CURRENT_USER(),
                'All pre-discharge checks passed');
    END IF;
END$$

-- Trigger: enforce validation on every discharge insert
CREATE OR REPLACE TRIGGER trg_before_discharge_insert
BEFORE INSERT ON discharges
FOR EACH ROW
BEGIN
    DECLARE v_ok TINYINT DEFAULT 0;
    CALL sp_validate_discharge(NEW.patient_id, v_ok);
    IF v_ok != 1 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Discharge blocked: pre-discharge validation failed';
    END IF;
END$$

-- Procedure: Admin override for forced discharge
CREATE OR REPLACE PROCEDURE sp_force_discharge(
    IN p_patient_id  INT,
    IN p_admin_id    INT,
    IN p_reason      VARCHAR(500))
BEGIN
    DECLARE v_is_admin INT DEFAULT 0;

    SELECT COUNT(*) INTO v_is_admin
    FROM staff
    WHERE staff_id = p_admin_id AND role = 'admin' AND is_active = 1;

    IF v_is_admin = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Only active admins can perform a forced discharge';
    END IF;

    IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Override reason is mandatory for forced discharge';
    END IF;

    INSERT INTO discharges(patient_id, discharge_date,
                           is_forced, admin_override_by, override_reason)
    VALUES (p_patient_id, NOW(), 1, p_admin_id, p_reason);

    INSERT INTO discharge_log(patient_id, cleared_at,
                              cleared_by, is_forced, notes)
    VALUES (p_patient_id, NOW(), p_admin_id, 1,
            CONCAT('FORCED: ', p_reason));
END$$

DELIMITER ;
-- [F41: end]
