-- =========================================================
-- 23_auto_financial_reports.sql
-- Ensure financial_reports is ALWAYS auto-updated:
--   1. Fix trg_update_financials_on_payment   (already exists — recreate cleanly)
--   2. Fix trg_update_financials_on_invoice   (extend to cover admissions too)
--   3. Add midnight scheduled recalculation   (full recalc nightly as safety net)
-- =========================================================

USE careconnect;

-- =========================================================
-- TRIGGER 1: On every payment insert → update all 3 periods
-- (Handles: consultations, pharmacy, admissions — anything paid via payments table)
-- =========================================================

DROP TRIGGER IF EXISTS trg_update_financials_on_payment;

DELIMITER //

CREATE TRIGGER trg_update_financials_on_payment
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
    -- Yearly
    INSERT INTO financial_reports (report_type, period_label, total_revenue)
    VALUES ('Yearly', DATE_FORMAT(NEW.payment_date, '%Y'), NEW.amount)
    ON DUPLICATE KEY UPDATE
        total_revenue = total_revenue + NEW.amount,
        last_updated  = NOW();

    -- Monthly
    INSERT INTO financial_reports (report_type, period_label, total_revenue)
    VALUES ('Monthly', DATE_FORMAT(NEW.payment_date, '%Y-%m'), NEW.amount)
    ON DUPLICATE KEY UPDATE
        total_revenue = total_revenue + NEW.amount,
        last_updated  = NOW();

    -- Weekly
    INSERT INTO financial_reports (report_type, period_label, total_revenue)
    VALUES ('Weekly', DATE_FORMAT(NEW.payment_date, '%x-W%v'), NEW.amount)
    ON DUPLICATE KEY UPDATE
        total_revenue = total_revenue + NEW.amount,
        last_updated  = NOW();
END //

DELIMITER ;

-- =========================================================
-- TRIGGER 2: On invoice marked Paid directly (lab tests + admissions)
-- (Covers cases where invoice is inserted/updated to 'Paid' without a payments row)
-- =========================================================

DROP TRIGGER IF EXISTS trg_update_financials_on_invoice;

DELIMITER //

CREATE TRIGGER trg_update_financials_on_invoice
AFTER INSERT ON invoices
FOR EACH ROW
BEGIN
    -- Only fires when invoice is created already Paid AND it is NOT a consultation
    -- (consultations go through payments table separately)
    IF NEW.status = 'Paid'
       AND NEW.appointment_id IS NULL  -- not a consultation
    THEN
        -- Yearly
        INSERT INTO financial_reports (report_type, period_label, total_revenue)
        VALUES ('Yearly', DATE_FORMAT(NEW.generated_at, '%Y'), NEW.net_amount)
        ON DUPLICATE KEY UPDATE
            total_revenue = total_revenue + NEW.net_amount,
            last_updated  = NOW();

        -- Monthly
        INSERT INTO financial_reports (report_type, period_label, total_revenue)
        VALUES ('Monthly', DATE_FORMAT(NEW.generated_at, '%Y-%m'), NEW.net_amount)
        ON DUPLICATE KEY UPDATE
            total_revenue = total_revenue + NEW.net_amount,
            last_updated  = NOW();

        -- Weekly
        INSERT INTO financial_reports (report_type, period_label, total_revenue)
        VALUES ('Weekly', DATE_FORMAT(NEW.generated_at, '%x-W%v'), NEW.net_amount)
        ON DUPLICATE KEY UPDATE
            total_revenue = total_revenue + NEW.net_amount,
            last_updated  = NOW();
    END IF;
END //

DELIMITER ;

-- =========================================================
-- TRIGGER 3: On expense insert → deduct from Pharmacy revenue
-- (Already existed — recreate cleanly with last_updated)
-- =========================================================

DROP TRIGGER IF EXISTS trg_update_financials_on_expense;

DELIMITER //

CREATE TRIGGER trg_update_financials_on_expense
AFTER INSERT ON hospital_expenses
FOR EACH ROW
BEGIN
    IF NEW.category = 'Pharmacy_Restock' THEN
        -- Yearly
        INSERT INTO financial_reports (report_type, period_label, total_revenue)
        VALUES ('Yearly', DATE_FORMAT(NEW.expense_date, '%Y'), -NEW.amount)
        ON DUPLICATE KEY UPDATE
            total_revenue = total_revenue - NEW.amount,
            last_updated  = NOW();

        -- Monthly
        INSERT INTO financial_reports (report_type, period_label, total_revenue)
        VALUES ('Monthly', DATE_FORMAT(NEW.expense_date, '%Y-%m'), -NEW.amount)
        ON DUPLICATE KEY UPDATE
            total_revenue = total_revenue - NEW.amount,
            last_updated  = NOW();

        -- Weekly
        INSERT INTO financial_reports (report_type, period_label, total_revenue)
        VALUES ('Weekly', DATE_FORMAT(NEW.expense_date, '%x-W%v'), -NEW.amount)
        ON DUPLICATE KEY UPDATE
            total_revenue = total_revenue - NEW.amount,
            last_updated  = NOW();
    END IF;
END //

DELIMITER ;

-- =========================================================
-- SCHEDULED EVENT: Full recalculation every night at midnight
-- Acts as a safety net in case any edge case was missed by triggers.
-- =========================================================

SET GLOBAL event_scheduler = ON;

DROP EVENT IF EXISTS evt_nightly_financial_recalc;

CREATE EVENT evt_nightly_financial_recalc
ON SCHEDULE EVERY 1 DAY
STARTS (DATE(NOW()) + INTERVAL 1 DAY + INTERVAL 0 HOUR)
DO
    CALL RecalculateFinancialReports();

-- =========================================================
-- Immediate full recalculation at setup time
-- so the table reflects all existing data right now
-- =========================================================
CALL RecalculateFinancialReports();
