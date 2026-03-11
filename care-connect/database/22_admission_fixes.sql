USE careconnect;

-- =========================================================
-- FIX 1: Update Patient Medical History on Admission
-- Trigger fires AFTER a row is inserted into admissions,
-- and appends the admission event to the patient's
-- medical_history_summary field.
-- =========================================================

DROP TRIGGER IF EXISTS trg_update_history_on_admission;

DELIMITER //

CREATE TRIGGER trg_update_history_on_admission
AFTER INSERT ON admissions
FOR EACH ROW
BEGIN
    DECLARE v_room_type VARCHAR(50);

    -- Get room type for context
    SELECT type INTO v_room_type
    FROM rooms
    WHERE room_number = NEW.room_number;

    -- Append admission event to patient's history
    UPDATE patients
    SET medical_history_summary = CONCAT(
        COALESCE(medical_history_summary, ''),
        '\n[', DATE_FORMAT(NEW.admission_date, '%Y-%m-%d %H:%i'), ']: ',
        'ADMITTED to Room ', NEW.room_number,
        ' (', COALESCE(v_room_type, 'General'), ')'
    )
    WHERE patient_id = NEW.patient_id;
END //

-- =========================================================
-- FIX 2: Update Patient Medical History on Discharge
-- Trigger fires AFTER admissions row is UPDATED to 'Discharged'.
-- Appends the discharge event and total cost to history.
-- =========================================================

DROP TRIGGER IF EXISTS trg_update_history_on_discharge;

CREATE TRIGGER trg_update_history_on_discharge
AFTER UPDATE ON admissions
FOR EACH ROW
BEGIN
    IF OLD.status = 'Admitted' AND NEW.status = 'Discharged' THEN
        UPDATE patients
        SET medical_history_summary = CONCAT(
            COALESCE(medical_history_summary, ''),
            '\n[', DATE_FORMAT(NEW.discharge_date, '%Y-%m-%d %H:%i'), ']: ',
            'DISCHARGED from Room ', NEW.room_number,
            ' — Total Room Charge: BDT ', FORMAT(NEW.total_cost, 2)
        )
        WHERE patient_id = NEW.patient_id;
    END IF;
END //

DELIMITER ;


-- =========================================================
-- FIX 3: Update GetDepartmentEarnings to include
-- Room/Admission revenue via invoices (single source of truth)
-- Admission invoices are linked via invoices.admission_id
-- =========================================================

DROP PROCEDURE IF EXISTS GetDepartmentEarnings;

DELIMITER //

CREATE PROCEDURE GetDepartmentEarnings(IN p_start_date DATETIME, IN p_end_date DATETIME)
BEGIN
    SELECT department_name, SUM(revenue) AS total_revenue
    FROM (

        -- 1. Consultation Revenue (Appointment Invoices)
        SELECT
            d.name AS department_name,
            SUM(i.net_amount) AS revenue
        FROM invoices i
        JOIN appointments a ON i.appointment_id = a.appointment_id
        JOIN doctors doc ON a.doctor_id = doc.doctor_id
        JOIN departments d ON doc.dept_id = d.dept_id
        WHERE i.status = 'Paid'
          AND i.generated_at BETWEEN p_start_date AND p_end_date
        GROUP BY d.name

        UNION ALL

        -- 2. Lab Test Revenue
        SELECT
            'Laboratory & Diagnostics' AS department_name,
            SUM(i.net_amount) AS revenue
        FROM invoices i
        WHERE i.test_record_id IS NOT NULL
          AND i.appointment_id IS NULL
          AND i.status = 'Paid'
          AND i.generated_at BETWEEN p_start_date AND p_end_date

        UNION ALL

        -- 3. Pharmacy Revenue
        SELECT
            'Pharmacy' AS department_name,
            SUM(i.net_amount) AS revenue
        FROM invoices i
        WHERE i.pharmacy_order_id IS NOT NULL
          AND i.status = 'Paid'
          AND i.generated_at BETWEEN p_start_date AND p_end_date

        UNION ALL

        -- 4. Pharmacy Expenses (Restock Cost — deducted)
        SELECT
            'Pharmacy' AS department_name,
            -IFNULL(SUM(amount), 0) AS revenue
        FROM hospital_expenses
        WHERE category = 'Pharmacy_Restock'
          AND expense_date BETWEEN p_start_date AND p_end_date

        UNION ALL

        -- 5. ✅ Inpatient & Rooms — via invoices (single source of truth)
        SELECT
            'Inpatient & Rooms' AS department_name,
            SUM(i.net_amount) AS revenue
        FROM invoices i
        WHERE i.admission_id IS NOT NULL
          AND i.status = 'Paid'
          AND i.generated_at BETWEEN p_start_date AND p_end_date

    ) AS combined_data
    GROUP BY department_name
    HAVING total_revenue IS NOT NULL AND total_revenue <> 0
    ORDER BY total_revenue DESC;
END //

DELIMITER ;

-- =========================================================
-- Also fix GetTotalEarnings: invoices already includes
-- admission invoices via admission_id, so the SUM(invoices)
-- naturally covers all sources. Just make sure to exclude
-- double-counted Lab tests linked to appointments.
-- =========================================================

DROP PROCEDURE IF EXISTS GetTotalEarnings;

DELIMITER //

CREATE PROCEDURE GetTotalEarnings(IN p_start_date DATETIME, IN p_end_date DATETIME)
BEGIN
    SELECT
        (SELECT IFNULL(SUM(net_amount), 0)
         FROM invoices
         WHERE status = 'Paid'
           AND generated_at BETWEEN p_start_date AND p_end_date)
        -
        (SELECT IFNULL(SUM(amount), 0)
         FROM hospital_expenses
         WHERE category = 'Pharmacy_Restock'
           AND expense_date BETWEEN p_start_date AND p_end_date)
    AS total_earnings;
END //

DELIMITER ;

-- =========================================================
-- Backfill: Apply history to any EXISTING admissions
-- that were already in the database before this fix
-- =========================================================

UPDATE patients p
JOIN admissions a ON p.patient_id = a.patient_id
SET p.medical_history_summary = CONCAT(
    COALESCE(p.medical_history_summary, ''),
    '\n[', DATE_FORMAT(a.admission_date, '%Y-%m-%d %H:%i'), ']: ',
    'ADMITTED to Room ', a.room_number,
    CASE
        WHEN a.status = 'Discharged' THEN
            CONCAT(' — DISCHARGED on ', DATE_FORMAT(a.discharge_date, '%Y-%m-%d'),
                   ', Total Room Charge: BDT ', FORMAT(a.total_cost, 2))
        ELSE ' (Currently Admitted)'
    END
)
WHERE a.admission_id IS NOT NULL;
