USE careconnect;

-- Seed some lab tests for Pathologist testing
-- Assume patients 1, 2, 3 exist
-- Assume medical tests 1, 2, 3, 4 exist

-- Test 1: Paid and Scheduled
INSERT INTO patient_tests (patient_id, test_id, status, payment_status, scheduled_date, scheduled_end_time) 
VALUES (1, 1, 'SCHEDULED', 'PAID', DATE_SUB(NOW(), INTERVAL 1 HOUR), NOW());

SET @test_id_1 = LAST_INSERT_ID();

INSERT INTO invoices (test_record_id, total_amount, net_amount, status) 
VALUES (@test_id_1, 500.00, 500.00, 'Paid');

INSERT INTO payments (invoice_id, amount, payment_method) 
VALUES (LAST_INSERT_ID(), 500.00, 'Cash');

-- Test 2: Paid and Scheduled (Upcoming)
INSERT INTO patient_tests (patient_id, test_id, status, payment_status, scheduled_date, scheduled_end_time) 
VALUES (2, 2, 'SCHEDULED', 'PAID', DATE_ADD(NOW(), INTERVAL 2 HOUR), DATE_ADD(NOW(), INTERVAL 3 HOUR));

SET @test_id_2 = LAST_INSERT_ID();

INSERT INTO invoices (test_record_id, total_amount, net_amount, status) 
VALUES (@test_id_2, 800.00, 800.00, 'Paid');

INSERT INTO payments (invoice_id, amount, payment_method) 
VALUES (LAST_INSERT_ID(), 800.00, 'Cash');

-- Test 3: Previously Pending, now Paid and Scheduled
INSERT INTO patient_tests (patient_id, test_id, status, payment_status, scheduled_date, scheduled_end_time) 
VALUES (3, 3, 'SCHEDULED', 'PAID', DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR));

SET @test_id_3 = LAST_INSERT_ID();

INSERT INTO invoices (test_record_id, total_amount, net_amount, status) 
VALUES (@test_id_3, 5000.00, 5000.00, 'Paid');

INSERT INTO payments (invoice_id, amount, payment_method) 
VALUES (LAST_INSERT_ID(), 5000.00, 'Card');

-- Test 4: Completed
INSERT INTO patient_tests (patient_id, test_id, status, payment_status, scheduled_date, result_summary) 
VALUES (4, 4, 'COMPLETED', 'PAID', DATE_SUB(NOW(), INTERVAL 1 DAY), 'Normal blood counts. No abnormalities detected.');

SET @test_id_4 = LAST_INSERT_ID();

INSERT INTO invoices (test_record_id, total_amount, net_amount, status) 
VALUES (@test_id_4, 1200.00, 1200.00, 'Paid');

INSERT INTO payments (invoice_id, amount, payment_method) 
VALUES (LAST_INSERT_ID(), 1200.00, 'Online');

-- Additional scheduled lab test records
