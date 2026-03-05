USE careconnect;

DROP PROCEDURE IF EXISTS GetEarningsOverTime;

DELIMITER //

CREATE PROCEDURE GetEarningsOverTime(IN p_start_date DATETIME, IN p_end_date DATETIME)
BEGIN
    SELECT 
        DATE(calendar.dt) as date,
        (
            SELECT IFNULL(SUM(i.net_amount), 0)
            FROM invoices i
            WHERE i.status = 'Paid'
            AND i.generated_at BETWEEN p_start_date AND p_end_date
            AND DATE(i.generated_at) <= DATE(calendar.dt)
        ) 
        -
        (
            SELECT IFNULL(SUM(e.amount), 0)
            FROM hospital_expenses e
            WHERE e.category = 'Pharmacy_Restock'
            AND e.expense_date BETWEEN p_start_date AND p_end_date
            AND DATE(e.expense_date) <= DATE(calendar.dt)
        ) as cumulative_revenue
    FROM (
        WITH RECURSIVE dates AS (
            SELECT DATE(p_start_date) as dt
            UNION ALL
            SELECT DATE_ADD(dt, INTERVAL 1 DAY)
            FROM dates
            WHERE dt < DATE(p_end_date)
        )
        SELECT dt FROM dates
    ) calendar
    ORDER BY calendar.dt ASC;
END //

DELIMITER ;
USE careconnect;

DROP PROCEDURE IF EXISTS GetEarningsOverTime;

DELIMITER //

CREATE PROCEDURE GetEarningsOverTime(IN p_start_date DATETIME, IN p_end_date DATETIME)
BEGIN
    WITH RECURSIVE dates AS (
        SELECT DATE(p_start_date) as dt
        UNION ALL
        SELECT DATE_ADD(dt, INTERVAL 1 DAY)
        FROM dates
        WHERE dt < DATE(p_end_date)
    )
    SELECT 
        DATE(dates.dt) as date,
        (
            SELECT IFNULL(SUM(i.net_amount), 0)
            FROM invoices i
            WHERE i.status = 'Paid'
            AND i.generated_at BETWEEN p_start_date AND p_end_date
            AND DATE(i.generated_at) <= DATE(dates.dt)
        ) 
        -
        (
            SELECT IFNULL(SUM(e.amount), 0)
            FROM hospital_expenses e
            WHERE e.category = 'Pharmacy_Restock'
            AND e.expense_date BETWEEN p_start_date AND p_end_date
            AND DATE(e.expense_date) <= DATE(dates.dt)
        ) as cumulative_revenue
    FROM dates
    ORDER BY dates.dt ASC;
END //

DELIMITER ;
