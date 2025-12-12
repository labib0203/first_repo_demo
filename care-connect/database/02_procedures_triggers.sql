-- Procedures, Functions, and Triggers for CareConnect

USE careconnect;

DELIMITER //

-- =============================================
-- FUNCTIONS
-- =============================================

-- 1. CalculateAge Function
CREATE FUNCTION CalculateAge(dob DATE) 
RETURNS INT
DETERMINISTIC
BEGIN
    RETURN TIMESTAMPDIFF(YEAR, dob, CURDATE());
END //

-- 2. Check Doctor Availability
CREATE FUNCTION IsDoctorAvailable(doc_id INT, appt_datetime DATETIME)
RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE conflict_count INT;
    SELECT COUNT(*) INTO conflict_count
    FROM appointments
    WHERE doctor_id = doc_id 
      AND status NOT IN ('Cancelled', 'NoShow')
      AND appointment_date = appt_datetime;
      
    IF conflict_count > 0 THEN
        RETURN FALSE;
    ELSE
        RETURN TRUE;
    END IF;
END //

-- 3. Calculate Appointment Total Cost (Consultation + Tests + Meds)
-- Note: This is a bit complex for a function if it involves tables not yet linked easily, 
-- but we can sum consultation fee for now.
CREATE FUNCTION GetConsultationFee(doc_id INT)
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE fee DECIMAL(10,2);
    SELECT consultation_fee INTO fee FROM doctors WHERE doctor_id = doc_id;
    RETURN IFNULL(fee, 0);
END //


-- =============================================
-- STORED PROCEDURES
-- =============================================

-- 1. Book Appointment (Transactional)
CREATE PROCEDURE BookAppointment(
    IN p_patient_id INT,
    IN p_doctor_id INT,
    IN p_date DATETIME,
    IN p_reason TEXT,
    OUT p_status VARCHAR(50)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        ROLLBACK;
        SET p_status = CONCAT('Error: ', @text);
    END;

    START TRANSACTION;

    -- Validations
    IF NOT IsDoctorAvailable(p_doctor_id, p_date) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Doctor not available at this time';
    END IF;

    -- Insert
    INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, status)
    VALUES (p_patient_id, p_doctor_id, p_date, p_reason, 'Scheduled');

    COMMIT;
    SET p_status = 'Success';
END //

-- 2. Generate Full Invoice (Complex Logic)
-- Aggregates Consultation Fee + Prescribed Medicines + Lab Tests
CREATE PROCEDURE GenerateInvoice(
    IN p_appointment_id INT
)
BEGIN
    DECLARE v_doc_fee DECIMAL(10,2);
    DECLARE v_med_total DECIMAL(10,2);
    DECLARE v_lab_total DECIMAL(10,2);
    DECLARE v_total DECIMAL(10,2);
    DECLARE v_doctor_id INT;
    DECLARE v_record_id INT;

    -- Get Doctor Fee
    SELECT doctor_id INTO v_doctor_id FROM appointments WHERE appointment_id = p_appointment_id;
    SET v_doc_fee = GetConsultationFee(v_doctor_id);

    -- Get Medical Record ID
    SELECT record_id INTO v_record_id FROM medical_records WHERE appointment_id = p_appointment_id;

    -- Sum Medicines Cost
    -- Join Prescriptions -> PrescriptionItems -> Medicines
    SELECT IFNULL(SUM(m.unit_price * pi.duration_days * 1), 0) -- Simplified calc based on dosage assumption or just unit price
    INTO v_med_total
    FROM prescriptions p
    JOIN prescription_items pi ON p.prescription_id = pi.prescription_id
    JOIN medicines m ON pi.medicine_id = m.medicine_id
    WHERE p.record_id = v_record_id;

    -- Sum Lab Tests Cost
    SELECT IFNULL(SUM(lt.base_price), 0)
    INTO v_lab_total
    FROM lab_results lr
    JOIN lab_tests lt ON lr.test_id = lt.test_id
    WHERE lr.record_id = v_record_id;

    SET v_total = v_doc_fee + v_med_total + v_lab_total;

    INSERT INTO invoices (appointment_id, total_amount, net_amount, status)
    VALUES (p_appointment_id, v_total, v_total, 'Unpaid');
    
END //

-- 3. Admit Patient (Optional or Update Status Procedure)
CREATE PROCEDURE UpdateAppointmentStatus(
    IN p_appt_id INT,
    IN p_status VARCHAR(20)
)
BEGIN
    UPDATE appointments SET status = p_status WHERE appointment_id = p_appt_id;
END //

-- =============================================
-- TRIGGERS
-- =============================================

-- 1. Check Medicine Stock BEFORE Prescription Insert (Validation)
CREATE TRIGGER trg_check_med_stock
BEFORE INSERT ON prescription_items
FOR EACH ROW
BEGIN
    DECLARE current_stock INT;
    SELECT stock_quantity INTO current_stock FROM medicines WHERE medicine_id = NEW.medicine_id;
    
    IF current_stock < 1 THEN -- Check if at least 1 is available (simplified logic)
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Medicine Out of Stock';
    END IF;
END //

-- 2. Audit Log Trigger AFTER Update on Appointments
CREATE TRIGGER trg_audit_appointment_update
AFTER UPDATE ON appointments
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (table_name, action_type, record_id, old_value, new_value, performed_at)
    VALUES (
        'appointments', 
        'UPDATE', 
        NEW.appointment_id, 
        JSON_OBJECT('status', OLD.status, 'date', OLD.appointment_date),
        JSON_OBJECT('status', NEW.status, 'date', NEW.appointment_date),
        NOW()
    );
END //

-- 3. Update Invoice Status AFTER full payment
CREATE TRIGGER trg_update_invoice_paid
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
    DECLARE v_total DECIMAL(10,2);
    DECLARE v_paid DECIMAL(10,2);
    
    SELECT total_amount INTO v_total FROM invoices WHERE invoice_id = NEW.invoice_id;
    SELECT SUM(amount) INTO v_paid FROM payments WHERE invoice_id = NEW.invoice_id;
    
    IF v_paid >= v_total THEN
        UPDATE invoices SET status = 'Paid' WHERE invoice_id = NEW.invoice_id;
    END IF;
END //


DELIMITER ;
