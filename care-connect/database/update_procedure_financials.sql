USE careconnect;

DROP PROCEDURE IF EXISTS GetFinancialSummary;

DELIMITER //

CREATE PROCEDURE GetFinancialSummary()
BEGIN
    SELECT 
        -- Lifetime
        (SELECT COALESCE(SUM(amount), 0) FROM payments) + 
        (SELECT COALESCE(SUM(net_amount), 0) FROM invoices WHERE status = 'Paid' AND invoice_id NOT IN (SELECT invoice_id FROM payments)) -
        (SELECT COALESCE(SUM(amount), 0) FROM hospital_expenses WHERE category = 'Pharmacy_Restock') as total_all_time,
        
        -- Last Year
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_date >= DATE_SUB(NOW(), INTERVAL 1 YEAR)) +
        (SELECT COALESCE(SUM(net_amount), 0) FROM invoices WHERE status = 'Paid' AND generated_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR) AND invoice_id NOT IN (SELECT invoice_id FROM payments)) -
        (SELECT COALESCE(SUM(amount), 0) FROM hospital_expenses WHERE category = 'Pharmacy_Restock' AND expense_date >= DATE_SUB(NOW(), INTERVAL 1 YEAR)) as total_last_year,
        
        -- Last Month
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_date >= DATE_SUB(NOW(), INTERVAL 1 MONTH)) +
        (SELECT COALESCE(SUM(net_amount), 0) FROM invoices WHERE status = 'Paid' AND generated_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH) AND invoice_id NOT IN (SELECT invoice_id FROM payments)) -
        (SELECT COALESCE(SUM(amount), 0) FROM hospital_expenses WHERE category = 'Pharmacy_Restock' AND expense_date >= DATE_SUB(NOW(), INTERVAL 1 MONTH)) as total_last_month,
        
        -- Last Week
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_date >= DATE_SUB(NOW(), INTERVAL 1 WEEK)) +
        (SELECT COALESCE(SUM(net_amount), 0) FROM invoices WHERE status = 'Paid' AND generated_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK) AND invoice_id NOT IN (SELECT invoice_id FROM payments)) -
        (SELECT COALESCE(SUM(amount), 0) FROM hospital_expenses WHERE category = 'Pharmacy_Restock' AND expense_date >= DATE_SUB(NOW(), INTERVAL 1 WEEK)) as total_last_week;
END //

DELIMITER ;
