-- Views and Indexing Strategies

USE careconnect;

-- =============================================
-- INDEXING STRATEGIES
-- =============================================
-- 1. Composite Index on Profiles for Fast Patient Search
-- Strategy: Queries often search by first and last name together.
CREATE INDEX idx_patient_name ON profiles(first_name, last_name);

-- 2. Index on Schedules for Day and Doctor
-- Strategy: Optimize `GetDoctorAvailability` queries.
CREATE INDEX idx_schedule_day ON schedules(doctor_id, day_of_week);

-- 3. Full text index on Medical Records diagnosis for search (Example)
-- CREATE FULLTEXT INDEX idx_diagnosis_search ON medical_records(diagnosis);


-- =============================================
-- VIEWS
-- =============================================

-- 1. Doctor Schedule View
-- Abstraction to list doctors with their meaningful names and schedules
CREATE OR REPLACE VIEW View_DoctorSchedule AS
SELECT 
    d.doctor_id,
    CONCAT(p.first_name, ' ', p.last_name) AS doctor_name,
    d.specialization,
    s.day_of_week,
    s.start_time,
    s.end_time,
    s.room_number
FROM doctors d
JOIN profiles p ON d.user_id = p.user_id
JOIN schedules s ON d.doctor_id = s.doctor_id;

-- 2. Patient Appointment History View
-- Reporting view for patients
CREATE OR REPLACE VIEW View_PatientHistory AS
SELECT 
    a.appointment_id,
    a.patient_id,
    CONCAT(pat_p.first_name, ' ', pat_p.last_name) AS patient_name,
    CONCAT(doc_p.first_name, ' ', doc_p.last_name) AS doctor_name,
    a.appointment_date,
    a.status,
    mr.diagnosis,
    i.total_amount,
    i.status AS payment_status
FROM appointments a
JOIN patients pat ON a.patient_id = pat.patient_id
JOIN profiles pat_p ON pat.user_id = pat_p.user_id
JOIN doctors d ON a.doctor_id = d.doctor_id
JOIN profiles doc_p ON d.user_id = doc_p.user_id
LEFT JOIN medical_records mr ON a.appointment_id = mr.appointment_id
LEFT JOIN invoices i ON a.appointment_id = i.appointment_id;

-- 3. Active Doctors Overview
-- Shows Doctor Name, Department, Specialization, and their Room Numbers
CREATE OR REPLACE VIEW View_ActiveDoctors AS
SELECT 
    d.doctor_id,
    CONCAT(p.first_name, ' ', p.last_name) AS doctor_name,
    dept.name AS department_name,
    d.specialization,
    -- Group their room numbers (e.g., "Rm-101, Rm-102") to avoid duplicates if they work multiple days in same room
    GROUP_CONCAT(DISTINCT COALESCE(r.room_number, s.room_number) ORDER BY r.room_number SEPARATOR ', ') AS room_numbers
FROM doctors d
JOIN profiles p ON d.user_id = p.user_id
JOIN departments dept ON d.dept_id = dept.dept_id
LEFT JOIN schedules s ON d.doctor_id = s.doctor_id
LEFT JOIN rooms r ON r.current_doctor_id = d.doctor_id
GROUP BY d.doctor_id, doctor_name, department_name, d.specialization;

-- 4. Available Rooms Overview (For Reception Desk)
CREATE OR REPLACE VIEW View_AvailableRooms AS
SELECT 
    room_number,
    type,
    charge_per_day,
    is_available
FROM rooms
WHERE is_available = TRUE;



-- Lab result summary view




-- added slot count per doctor to availability view


-- [F16: Extended Views — Farhana Uvro]
CREATE OR REPLACE VIEW vw_doctor_availability_summary AS
SELECT
    d.doctor_id,
    CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
    d.specialization, d.department,
    COUNT(CASE WHEN ds.is_available = 1 THEN 1 END)  AS open_slots,
    COUNT(CASE WHEN ds.is_available = 0 THEN 1 END)  AS booked_slots,
    COUNT(ds.slot_id)                                 AS total_slots,
    ROUND(
        COUNT(CASE WHEN ds.is_available=0 THEN 1 END)*100.0
        / NULLIF(COUNT(ds.slot_id),0), 2)              AS booking_rate_pct,
    MIN(CASE WHEN ds.is_available=1 THEN ds.slot_date END) AS next_available
FROM doctors d
LEFT JOIN doctor_slots ds ON d.doctor_id = ds.doctor_id
    AND ds.slot_date >= CURDATE()
GROUP BY d.doctor_id, d.first_name, d.last_name,
         d.specialization, d.department;

CREATE OR REPLACE VIEW vw_doctor_weekly_load AS
SELECT
    d.doctor_id,
    CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
    d.specialization,
    YEARWEEK(a.appointment_date, 1)   AS year_week,
    COUNT(a.appointment_id)           AS appointment_count,
    COUNT(DISTINCT a.patient_id)      AS unique_patients,
    SUM(a.status = 'completed')       AS completed,
    SUM(a.status = 'cancelled')       AS cancelled,
    SUM(a.status = 'no_show')         AS no_shows
FROM doctors d
LEFT JOIN appointments a ON d.doctor_id = a.doctor_id
GROUP BY d.doctor_id, d.first_name, d.last_name,
         d.specialization, YEARWEEK(a.appointment_date, 1);

CREATE OR REPLACE VIEW vw_patient_visit_summary AS
SELECT
    p.patient_id,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    p.date_of_birth, p.blood_group,
    COUNT(a.appointment_id)                      AS total_visits,
    COUNT(DISTINCT a.doctor_id)                  AS doctors_seen,
    MIN(a.appointment_date)                      AS first_visit,
    MAX(a.appointment_date)                      AS latest_visit,
    SUM(a.status = 'completed')                  AS completed_visits,
    COALESCE(SUM(b.total_amount), 0)             AS total_billed,
    COALESCE(SUM(b.paid_amount), 0)              AS total_paid,
    COALESCE(SUM(b.total_amount-b.paid_amount),0) AS outstanding_balance
FROM patients p
LEFT JOIN appointments a ON p.patient_id = a.patient_id
LEFT JOIN billing       b ON a.appointment_id = b.appointment_id
GROUP BY p.patient_id, p.first_name, p.last_name,
         p.date_of_birth, p.blood_group;

CREATE OR REPLACE VIEW vw_department_load_summary AS
SELECT
    dept.department_id,
    dept.department_name,
    COUNT(DISTINCT d.doctor_id)      AS doctor_count,
    COUNT(DISTINCT a.appointment_id) AS total_appointments,
    COUNT(DISTINCT a.patient_id)     AS unique_patients,
    SUM(a.status = 'completed')      AS completed_appts,
    SUM(a.status = 'cancelled')      AS cancelled_appts,
    ROUND(SUM(a.status='cancelled')*100.0
          / NULLIF(COUNT(a.appointment_id),0),2) AS cancellation_rate
FROM departments dept
LEFT JOIN doctors d ON dept.department_id = d.department_id
LEFT JOIN appointments a ON d.doctor_id = a.doctor_id
GROUP BY dept.department_id, dept.department_name;

CREATE INDEX IF NOT EXISTS idx_appt_doctor_date
    ON appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appt_patient_status
    ON appointments(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_slots_avail_date
    ON doctor_slots(doctor_id, is_available, slot_date);
CREATE INDEX IF NOT EXISTS idx_billing_appt
    ON billing(appointment_id, paid_amount, total_amount);
CREATE INDEX IF NOT EXISTS idx_appt_status_date
    ON appointments(status, appointment_date);
CREATE INDEX IF NOT EXISTS idx_billing_patient
    ON billing(patient_id, payment_status);
-- [F16: end]


-- [F16: Extended Doctor & Patient Views — Farhana Uvro]

-- View 1: Doctor availability with booking rate and next open slot
CREATE OR REPLACE VIEW vw_doctor_availability_summary AS
SELECT
    d.doctor_id,
    CONCAT(d.first_name, ' ', d.last_name)            AS doctor_name,
    d.specialization,
    d.department,
    d.license_number,
    d.phone,
    COUNT(CASE WHEN ds.is_available = 1 THEN 1 END)   AS open_slots,
    COUNT(CASE WHEN ds.is_available = 0 THEN 1 END)   AS booked_slots,
    COUNT(ds.slot_id)                                  AS total_slots,
    ROUND(
        COUNT(CASE WHEN ds.is_available=0 THEN 1 END)*100.0
        / NULLIF(COUNT(ds.slot_id),0), 2)              AS booking_rate_pct,
    MIN(CASE WHEN ds.is_available=1
             THEN ds.slot_date END)                    AS next_available_date,
    MAX(ds.slot_date)                                  AS last_slot_date
FROM doctors d
LEFT JOIN doctor_slots ds
    ON d.doctor_id = ds.doctor_id
    AND ds.slot_date >= CURDATE()
GROUP BY d.doctor_id, d.first_name, d.last_name,
         d.specialization, d.department,
         d.license_number, d.phone;

-- View 2: Doctor weekly appointment load
CREATE OR REPLACE VIEW vw_doctor_weekly_load AS
SELECT
    d.doctor_id,
    CONCAT(d.first_name, ' ', d.last_name)  AS doctor_name,
    d.specialization,
    d.department,
    YEARWEEK(a.appointment_date, 1)          AS year_week,
    COUNT(a.appointment_id)                  AS appointment_count,
    COUNT(DISTINCT a.patient_id)             AS unique_patients,
    SUM(a.status = 'completed')              AS completed,
    SUM(a.status = 'cancelled')              AS cancelled,
    SUM(a.status = 'no_show')               AS no_shows,
    SUM(a.status = 'pending')                AS pending,
    COALESCE(SUM(b.total_amount), 0)         AS weekly_revenue
FROM doctors d
LEFT JOIN appointments a ON d.doctor_id = a.doctor_id
LEFT JOIN billing       b ON a.appointment_id = b.appointment_id
GROUP BY d.doctor_id, d.first_name, d.last_name,
         d.specialization, d.department,
         YEARWEEK(a.appointment_date, 1);

-- View 3: Patient visit history and billing summary
CREATE OR REPLACE VIEW vw_patient_visit_summary AS
SELECT
    p.patient_id,
    CONCAT(p.first_name, ' ', p.last_name)       AS patient_name,
    p.date_of_birth,
    p.gender,
    p.blood_group,
    p.phone,
    COUNT(a.appointment_id)                       AS total_visits,
    COUNT(DISTINCT a.doctor_id)                   AS doctors_seen,
    MIN(a.appointment_date)                       AS first_visit,
    MAX(a.appointment_date)                       AS latest_visit,
    SUM(a.status = 'completed')                   AS completed_visits,
    SUM(a.status = 'cancelled')                   AS cancelled_visits,
    COALESCE(SUM(b.total_amount), 0)              AS total_billed,
    COALESCE(SUM(b.paid_amount), 0)               AS total_paid,
    COALESCE(SUM(b.total_amount - b.paid_amount), 0) AS outstanding_balance,
    MAX(b.created_at)                             AS last_billing_date
FROM patients p
LEFT JOIN appointments a ON p.patient_id = a.patient_id
LEFT JOIN billing       b ON a.appointment_id = b.appointment_id
GROUP BY p.patient_id, p.first_name, p.last_name,
         p.date_of_birth, p.gender, p.blood_group, p.phone;

-- View 4: Department load and performance summary
CREATE OR REPLACE VIEW vw_department_load_summary AS
SELECT
    dept.department_id,
    dept.department_name,
    dept.location,
    COUNT(DISTINCT d.doctor_id)       AS doctor_count,
    COUNT(DISTINCT a.appointment_id)  AS total_appointments,
    COUNT(DISTINCT a.patient_id)      AS unique_patients,
    SUM(a.status = 'completed')       AS completed_appts,
    SUM(a.status = 'cancelled')       AS cancelled_appts,
    ROUND(
        SUM(a.status='cancelled')*100.0
        / NULLIF(COUNT(a.appointment_id), 0), 2) AS cancellation_rate_pct,
    COALESCE(SUM(b.total_amount), 0)  AS total_revenue,
    COALESCE(SUM(b.paid_amount), 0)   AS collected_revenue
FROM departments dept
LEFT JOIN doctors       d    ON dept.department_id = d.department_id
LEFT JOIN appointments  a    ON d.doctor_id = a.doctor_id
LEFT JOIN billing       b    ON a.appointment_id = b.appointment_id
GROUP BY dept.department_id, dept.department_name, dept.location;

-- View 5: Today's appointment schedule across all doctors
CREATE OR REPLACE VIEW vw_todays_schedule AS
SELECT
    a.appointment_id,
    CONCAT(d.first_name, ' ', d.last_name)  AS doctor_name,
    d.specialization,
    CONCAT(p.first_name, ' ', p.last_name)  AS patient_name,
    p.phone                                 AS patient_phone,
    ds.start_time,
    ds.end_time,
    a.status,
    a.notes
FROM appointments a
JOIN doctors      d  ON a.doctor_id = d.doctor_id
JOIN patients     p  ON a.patient_id = p.patient_id
LEFT JOIN doctor_slots ds ON a.slot_id = ds.slot_id
WHERE a.appointment_date = CURDATE()
ORDER BY ds.start_time;

-- Performance indexes to support the views above
CREATE INDEX IF NOT EXISTS idx_appt_doctor_date
    ON appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appt_patient_status
    ON appointments(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_appt_status_date
    ON appointments(status, appointment_date);
CREATE INDEX IF NOT EXISTS idx_slots_avail_date
    ON doctor_slots(doctor_id, is_available, slot_date);
CREATE INDEX IF NOT EXISTS idx_billing_appt
    ON billing(appointment_id, paid_amount, total_amount);
CREATE INDEX IF NOT EXISTS idx_billing_patient
    ON billing(patient_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_billing_created
    ON billing(created_at, payment_status);
-- [F16: end]


-- [F16: Extended Doctor & Patient Views — Farhana Uvro]

-- View 1: Doctor availability with booking rate and next open slot
CREATE OR REPLACE VIEW vw_doctor_availability_summary AS
SELECT
    d.doctor_id,
    CONCAT(d.first_name, ' ', d.last_name)            AS doctor_name,
    d.specialization,
    d.department,
    d.license_number,
    d.phone,
    COUNT(CASE WHEN ds.is_available = 1 THEN 1 END)   AS open_slots,
    COUNT(CASE WHEN ds.is_available = 0 THEN 1 END)   AS booked_slots,
    COUNT(ds.slot_id)                                  AS total_slots,
    ROUND(
        COUNT(CASE WHEN ds.is_available=0 THEN 1 END)*100.0
        / NULLIF(COUNT(ds.slot_id),0), 2)              AS booking_rate_pct,
    MIN(CASE WHEN ds.is_available=1
             THEN ds.slot_date END)                    AS next_available_date,
    MAX(ds.slot_date)                                  AS last_slot_date
FROM doctors d
LEFT JOIN doctor_slots ds
    ON d.doctor_id = ds.doctor_id
    AND ds.slot_date >= CURDATE()
GROUP BY d.doctor_id, d.first_name, d.last_name,
         d.specialization, d.department,
         d.license_number, d.phone;

-- View 2: Doctor weekly appointment load
CREATE OR REPLACE VIEW vw_doctor_weekly_load AS
SELECT
    d.doctor_id,
    CONCAT(d.first_name, ' ', d.last_name)  AS doctor_name,
    d.specialization,
    d.department,
    YEARWEEK(a.appointment_date, 1)          AS year_week,
    COUNT(a.appointment_id)                  AS appointment_count,
    COUNT(DISTINCT a.patient_id)             AS unique_patients,
    SUM(a.status = 'completed')              AS completed,
    SUM(a.status = 'cancelled')              AS cancelled,
    SUM(a.status = 'no_show')               AS no_shows,
    SUM(a.status = 'pending')                AS pending,
    COALESCE(SUM(b.total_amount), 0)         AS weekly_revenue
FROM doctors d
LEFT JOIN appointments a ON d.doctor_id = a.doctor_id
LEFT JOIN billing       b ON a.appointment_id = b.appointment_id
GROUP BY d.doctor_id, d.first_name, d.last_name,
         d.specialization, d.department,
         YEARWEEK(a.appointment_date, 1);

-- View 3: Patient visit history and billing summary
CREATE OR REPLACE VIEW vw_patient_visit_summary AS
SELECT
    p.patient_id,
    CONCAT(p.first_name, ' ', p.last_name)       AS patient_name,
    p.date_of_birth,
    p.gender,
    p.blood_group,
    p.phone,
    COUNT(a.appointment_id)                       AS total_visits,
    COUNT(DISTINCT a.doctor_id)                   AS doctors_seen,
    MIN(a.appointment_date)                       AS first_visit,
    MAX(a.appointment_date)                       AS latest_visit,
    SUM(a.status = 'completed')                   AS completed_visits,
    SUM(a.status = 'cancelled')                   AS cancelled_visits,
    COALESCE(SUM(b.total_amount), 0)              AS total_billed,
    COALESCE(SUM(b.paid_amount), 0)               AS total_paid,
    COALESCE(SUM(b.total_amount - b.paid_amount), 0) AS outstanding_balance,
    MAX(b.created_at)                             AS last_billing_date
FROM patients p
LEFT JOIN appointments a ON p.patient_id = a.patient_id
LEFT JOIN billing       b ON a.appointment_id = b.appointment_id
GROUP BY p.patient_id, p.first_name, p.last_name,
         p.date_of_birth, p.gender, p.blood_group, p.phone;

-- View 4: Department load and performance summary
CREATE OR REPLACE VIEW vw_department_load_summary AS
SELECT
    dept.department_id,
    dept.department_name,
    dept.location,
    COUNT(DISTINCT d.doctor_id)       AS doctor_count,
    COUNT(DISTINCT a.appointment_id)  AS total_appointments,
    COUNT(DISTINCT a.patient_id)      AS unique_patients,
    SUM(a.status = 'completed')       AS completed_appts,
    SUM(a.status = 'cancelled')       AS cancelled_appts,
    ROUND(
        SUM(a.status='cancelled')*100.0
        / NULLIF(COUNT(a.appointment_id), 0), 2) AS cancellation_rate_pct,
    COALESCE(SUM(b.total_amount), 0)  AS total_revenue,
    COALESCE(SUM(b.paid_amount), 0)   AS collected_revenue
FROM departments dept
LEFT JOIN doctors       d    ON dept.department_id = d.department_id
LEFT JOIN appointments  a    ON d.doctor_id = a.doctor_id
LEFT JOIN billing       b    ON a.appointment_id = b.appointment_id
GROUP BY dept.department_id, dept.department_name, dept.location;

-- View 5: Today's appointment schedule across all doctors
CREATE OR REPLACE VIEW vw_todays_schedule AS
SELECT
    a.appointment_id,
    CONCAT(d.first_name, ' ', d.last_name)  AS doctor_name,
    d.specialization,
    CONCAT(p.first_name, ' ', p.last_name)  AS patient_name,
    p.phone                                 AS patient_phone,
    ds.start_time,
    ds.end_time,
    a.status,
    a.notes
FROM appointments a
JOIN doctors      d  ON a.doctor_id = d.doctor_id
JOIN patients     p  ON a.patient_id = p.patient_id
LEFT JOIN doctor_slots ds ON a.slot_id = ds.slot_id
WHERE a.appointment_date = CURDATE()
ORDER BY ds.start_time;

-- Performance indexes to support the views above
CREATE INDEX IF NOT EXISTS idx_appt_doctor_date
    ON appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appt_patient_status
    ON appointments(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_appt_status_date
    ON appointments(status, appointment_date);
CREATE INDEX IF NOT EXISTS idx_slots_avail_date
    ON doctor_slots(doctor_id, is_available, slot_date);
CREATE INDEX IF NOT EXISTS idx_billing_appt
    ON billing(appointment_id, paid_amount, total_amount);
CREATE INDEX IF NOT EXISTS idx_billing_patient
    ON billing(patient_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_billing_created
    ON billing(created_at, payment_status);
-- [F16: end]
