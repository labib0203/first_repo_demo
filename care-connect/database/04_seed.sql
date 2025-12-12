-- Seed Data for CareConnect (Bangladesh Context)

USE careconnect;

-- Users (1 Admin, 2 Doctors, 2 Patients)
-- Passwords are 'password123' placeholder
INSERT INTO users (email, password_hash, role) VALUES 
('admin@careconnect.bd', 'hash_admin', 'Admin'),
('dr.rahman@careconnect.bd', 'hash_doc1', 'Doctor'),
('dr.nasreen@careconnect.bd', 'hash_doc2', 'Doctor'),
('rahim.mia@careconnect.bd', 'hash_pat1', 'Patient'),
('fatema.begum@careconnect.bd', 'hash_pat2', 'Patient');

-- Profiles
INSERT INTO profiles (user_id, first_name, last_name, phone_number, gender, date_of_birth, address) VALUES
(1, 'Tanvir', 'Ahmed', '01711000001', 'Male', '1980-01-01', 'Uttara, Dhaka'),
(2, 'Mahbubur', 'Rahman', '01711000002', 'Male', '1975-05-20', 'Dhanmondi, Dhaka'),
(3, 'Nasreen', 'Sultana', '01811000003', 'Female', '1982-08-15', 'Gulshan, Dhaka'),
(4, 'Rahim', 'Mia', '01911000004', 'Male', '1995-03-10', 'Mirpur, Dhaka'),
(5, 'Fatema', 'Begum', '01611000005', 'Female', '2000-07-25', 'Agrabad, Chattogram');

-- Departments
INSERT INTO departments (name, description, location) VALUES 
('Cardiology', 'Heart related diseases', 'Building A, Level 3 (Dhanmondi Branch)'),
('Orthopedics', 'Bone and joint care', 'Building B, Level 2 (Dhanmondi Branch)'),
('General Medicine', 'General health checkup', 'Building A, Level 1 (Dhanmondi Branch)');

-- Doctors
-- Fees in BDT
INSERT INTO doctors (user_id, dept_id, specialization, license_number, consultation_fee, joining_date) VALUES
(2, 1, 'Cardiologist', 'BMDC-A-12345', 1500.00, '2015-01-01'),
(3, 2, 'Orthopedic Surgeon', 'BMDC-A-67890', 2000.00, '2018-06-15');

-- Patients
INSERT INTO patients (user_id, blood_group, emergency_contact_name, emergency_contact_phone, insurance_provider) VALUES
(4, 'O+', 'Karim Mia (Brother)', '01911000999', 'MetLife Bangladesh'),
(5, 'A-', 'Abdul Malek (Father)', '01611000888', 'Pragati Life Insurance');

-- Schedules
-- Timings 
INSERT INTO schedules (doctor_id, day_of_week, start_time, end_time, room_number) VALUES
(1, 'Monday', '16:00:00', '20:00:00', 'Rm-301'), -- Evening practice common in BD
(1, 'Wednesday', '16:00:00', '20:00:00', 'Rm-301'),
(2, 'Sunday', '15:00:00', '19:00:00', 'Rm-205'), -- Week starts Sunday in BD (or mixed corporate/gov). Sunday is a working day.
(2, 'Tuesday', '15:00:00', '19:00:00', 'Rm-205'),
(2, 'Thursday', '15:00:00', '19:00:00', 'Rm-205');


-- Lab Tests
-- Prices in BDT
INSERT INTO lab_tests (test_name, base_price, unit) VALUES
('Complete Blood Count (CBC)', 600.00, 'cells/mcL'),
('X-Ray Chest P/A View', 800.00, 'image'),
('Lipid Profile', 1500.00, 'mg/dL'),
('Dengue NS1 Antigen', 1200.00, 'positive/negative');

-- Medicines
-- Prices in BDT
INSERT INTO medicines (name, manufacturer, unit_price, stock_quantity) VALUES
('Napa Extra', 'Beximco Pharma', 2.50, 5000),
('Seclo 20mg', 'Square Pharma', 7.00, 3000),
('Monas 10', 'Acme', 18.00, 2000),
('Sergel 20', 'Healthcare', 8.00, 3000);

-- Appointments (Some generated)
-- Note: In a real flow, 'BookAppointment' proc would be called.
INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, reason) VALUES
(1, 1, DATE_ADD(NOW(), INTERVAL 1 DAY), 'Scheduled', 'Chest pain heavily felt at night'),
(2, 2, DATE_ADD(NOW(), INTERVAL 2 DAY), 'Scheduled', 'Knee pain while praying');

-- Completed Appointment for History
INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, reason) VALUES
(1, 1, DATE_SUB(NOW(), INTERVAL 5 DAY), 'Completed', 'Routine Checkup');

-- Medical Record for Completed Appt
INSERT INTO medical_records (appointment_id, diagnosis, symptoms, vitals) VALUES
(3, 'Hypertension', 'Headache, High BP', '{"bp": "140/90", "heart_rate": "82", "temp": "98.4"}');

-- Prescriptions
INSERT INTO prescriptions (record_id, notes) VALUES (1, 'Avoid heavy meal at night. Walk 30 mins daily.');

-- Prescription Items
INSERT INTO prescription_items (prescription_id, medicine_id, dosage, frequency, duration_days) VALUES
(1, 1, '500mg', '1-0-1', 5), -- Napa
(1, 2, '20mg', '1-0-0', 15); -- Seclo

-- Invoice for Completed Appt
-- Manual calculation: Doc Fee 1500 + Meds ((2.5*15) + (7*15) = 142.5) ~ 1642.5
INSERT INTO invoices (appointment_id, total_amount, net_amount, status) VALUES
(3, 1642.50, 1642.50, 'Unpaid');

