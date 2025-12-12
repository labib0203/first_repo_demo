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
