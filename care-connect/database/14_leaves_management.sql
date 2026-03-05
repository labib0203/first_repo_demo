USE careconnect;

-- 1. Create Staff Leaves Table
CREATE TABLE IF NOT EXISTS staff_leaves (
    leave_id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE CASCADE,
    CHECK (end_date >= start_date)
);

-- 2. Procedure to Add Staff Leave
DROP PROCEDURE IF EXISTS AddStaffLeave;

DELIMITER //

CREATE PROCEDURE AddStaffLeave(
    IN p_staff_id INT,
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_reason VARCHAR(255),
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_count INT;

    -- Check if staff exists
    SELECT COUNT(*) INTO v_count FROM staff WHERE staff_id = p_staff_id;
    
    IF v_count = 0 THEN
        SET p_success = FALSE;
        SET p_message = 'Staff member not found.';
    ELSEIF p_end_date < p_start_date THEN
        SET p_success = FALSE;
        SET p_message = 'End date must be on or after start date.';
    ELSE
        -- Check for overlapping leaves
        SELECT COUNT(*) INTO v_count 
        FROM staff_leaves 
        WHERE staff_id = p_staff_id 
          AND (
              (p_start_date BETWEEN start_date AND end_date) OR
              (p_end_date BETWEEN start_date AND end_date) OR
              (start_date BETWEEN p_start_date AND p_end_date)
          );
        
        IF v_count > 0 THEN
            SET p_success = FALSE;
            SET p_message = 'Leave period overlaps with existing leave.';
        ELSE
            -- Insert Leave Period
            INSERT INTO staff_leaves (staff_id, start_date, end_date, reason)
            VALUES (p_staff_id, p_start_date, p_end_date, p_reason);
            
            SET p_success = TRUE;
            SET p_message = 'Staff leave added successfully.';
        END IF;
    END IF;
END //

DELIMITER ;

-- 3. Update View_ActiveDoctors to exclude those on leave TODAY
CREATE OR REPLACE VIEW View_ActiveDoctors AS
SELECT 
    d.doctor_id,
    CONCAT(p.first_name, ' ', p.last_name) AS doctor_name,
    dept.name AS department_name,
    d.specialization,
    GROUP_CONCAT(DISTINCT COALESCE(r.room_number, s.room_number) ORDER BY r.room_number SEPARATOR ', ') AS room_numbers
FROM doctors d
JOIN profiles p ON d.user_id = p.user_id
JOIN departments dept ON d.dept_id = dept.dept_id
LEFT JOIN schedules s ON d.doctor_id = s.doctor_id
LEFT JOIN rooms r ON r.current_doctor_id = d.doctor_id
WHERE d.doctor_id NOT IN (
    SELECT doctor_id FROM doctor_leaves 
    WHERE CURDATE() BETWEEN start_date AND end_date
)
GROUP BY d.doctor_id, doctor_name, department_name, d.specialization;

-- 4. Create View_DoctorsOnLeave
CREATE OR REPLACE VIEW View_DoctorsOnLeave AS
SELECT 
    d.doctor_id,
    CONCAT(p.first_name, ' ', p.last_name) AS doctor_name,
    dept.name AS department_name,
    dl.start_date,
    dl.end_date,
    dl.reason
FROM doctor_leaves dl
JOIN doctors d ON dl.doctor_id = d.doctor_id
JOIN profiles p ON d.user_id = p.user_id
JOIN departments dept ON d.dept_id = dept.dept_id
WHERE CURDATE() BETWEEN dl.start_date AND dl.end_date;

-- 5. Create View_ActiveStaff (Excluding leaves)
CREATE OR REPLACE VIEW View_ActiveStaff AS
SELECT 
    s.staff_id,
    CONCAT(p.first_name, ' ', p.last_name) AS staff_name,
    s.job_title,
    dept.name AS department_name,
    s.shift
FROM staff s
JOIN profiles p ON s.user_id = p.user_id
LEFT JOIN departments dept ON s.dept_id = dept.dept_id
WHERE s.staff_id NOT IN (
    SELECT staff_id FROM staff_leaves 
    WHERE CURDATE() BETWEEN start_date AND end_date
);

-- 6. Create View_StaffOnLeave
CREATE OR REPLACE VIEW View_StaffOnLeave AS
SELECT 
    s.staff_id,
    CONCAT(p.first_name, ' ', p.last_name) AS staff_name,
    s.job_title,
    dept.name AS department_name,
    sl.start_date,
    sl.end_date,
    sl.reason
FROM staff_leaves sl
JOIN staff s ON sl.staff_id = s.staff_id
JOIN profiles p ON s.user_id = p.user_id
LEFT JOIN departments dept ON s.dept_id = dept.dept_id
WHERE CURDATE() BETWEEN sl.start_date AND sl.end_date;

-- Pathologist leave balance and quota


-- pathologist leave quota and balance tracking added


-- [F44: Pathologist Leave Quota System — Farhana Uvro]
CREATE TABLE IF NOT EXISTS pathologist_leave_quota (
    quota_id       INT AUTO_INCREMENT PRIMARY KEY,
    pathologist_id INT  NOT NULL,
    year           YEAR NOT NULL,
    total_days     INT  DEFAULT 20,
    used_days      INT  DEFAULT 0,
    remaining_days INT  GENERATED ALWAYS AS (total_days - used_days) STORED,
    created_at     DATETIME DEFAULT NOW(),
    updated_at     DATETIME DEFAULT NOW() ON UPDATE NOW(),
    UNIQUE KEY uq_path_year (pathologist_id, year),
    FOREIGN KEY (pathologist_id) REFERENCES staff(staff_id) ON DELETE CASCADE
);

DELIMITER $$

CREATE OR REPLACE PROCEDURE sp_request_pathologist_leave(
    IN p_pathologist_id INT,
    IN p_start_date     DATE,
    IN p_end_date       DATE,
    IN p_reason         VARCHAR(255))
BEGIN
    DECLARE v_days      INT;
    DECLARE v_remaining INT;
    DECLARE v_year      YEAR;

    SET v_days = DATEDIFF(p_end_date, p_start_date) + 1;
    SET v_year = YEAR(p_start_date);

    IF p_end_date < p_start_date THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'End date must be on or after start date';
    END IF;

    INSERT IGNORE INTO pathologist_leave_quota(pathologist_id, year)
    VALUES (p_pathologist_id, v_year);

    SELECT remaining_days INTO v_remaining
    FROM pathologist_leave_quota
    WHERE pathologist_id = p_pathologist_id AND year = v_year;

    IF v_days > v_remaining THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Insufficient leave balance for requested period';
    END IF;

    INSERT INTO leave_requests(staff_id, start_date, end_date,
                               reason, status, requested_at)
    VALUES (p_pathologist_id, p_start_date, p_end_date,
            p_reason, 'pending', NOW());

    UPDATE pathologist_leave_quota
    SET used_days = used_days + v_days
    WHERE pathologist_id = p_pathologist_id AND year = v_year;
END$$

CREATE OR REPLACE TRIGGER trg_pathologist_leave_reject
AFTER UPDATE ON leave_requests
FOR EACH ROW
BEGIN
    IF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
        UPDATE pathologist_leave_quota
        SET used_days = used_days -
                        (DATEDIFF(OLD.end_date, OLD.start_date) + 1)
        WHERE pathologist_id = OLD.staff_id
          AND year = YEAR(OLD.start_date);
    END IF;
END$$

CREATE OR REPLACE PROCEDURE sp_pathologist_leave_summary(
    IN p_year YEAR)
BEGIN
    SELECT
        s.staff_id,
        CONCAT(s.first_name, ' ', s.last_name) AS pathologist_name,
        q.total_days,
        q.used_days,
        q.remaining_days,
        COUNT(lr.request_id)                    AS total_requests,
        SUM(lr.status = 'approved')             AS approved_requests,
        SUM(lr.status = 'rejected')             AS rejected_requests,
        SUM(lr.status = 'pending')              AS pending_requests
    FROM staff s
    JOIN pathologist_leave_quota q
        ON s.staff_id = q.pathologist_id AND q.year = p_year
    LEFT JOIN leave_requests lr
        ON s.staff_id = lr.staff_id
        AND YEAR(lr.start_date) = p_year
    WHERE s.role = 'pathologist'
    GROUP BY s.staff_id, s.first_name, s.last_name,
             q.total_days, q.used_days, q.remaining_days;
END$$

DELIMITER ;
-- [F44: end]


-- [F44: Pathologist Leave Quota & Management System — Farhana Uvro]

-- Table: Annual leave quota per pathologist
CREATE TABLE IF NOT EXISTS pathologist_leave_quota (
    quota_id       INT AUTO_INCREMENT PRIMARY KEY,
    pathologist_id INT  NOT NULL,
    year           YEAR NOT NULL,
    total_days     INT  NOT NULL DEFAULT 20,
    used_days      INT  NOT NULL DEFAULT 0,
    remaining_days INT  GENERATED ALWAYS AS (total_days - used_days) STORED,
    carry_over     INT  NOT NULL DEFAULT 0,
    created_at     DATETIME NOT NULL DEFAULT NOW(),
    updated_at     DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    UNIQUE KEY uq_path_year (pathologist_id, year),
    CONSTRAINT chk_used_days CHECK (used_days >= 0),
    CONSTRAINT chk_total_days CHECK (total_days > 0),
    FOREIGN KEY (pathologist_id) REFERENCES staff(staff_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

DELIMITER $$

-- Procedure: Submit a leave request for a pathologist
CREATE OR REPLACE PROCEDURE sp_request_pathologist_leave(
    IN p_pathologist_id  INT,
    IN p_start_date      DATE,
    IN p_end_date        DATE,
    IN p_reason          VARCHAR(500),
    OUT p_request_id     INT)
BEGIN
    DECLARE v_days       INT;
    DECLARE v_remaining  INT DEFAULT 0;
    DECLARE v_year       YEAR;
    DECLARE v_is_path    INT DEFAULT 0;

    -- Validate the staff member is a pathologist
    SELECT COUNT(*) INTO v_is_path
    FROM staff
    WHERE staff_id = p_pathologist_id
      AND role = 'pathologist' AND is_active = 1;

    IF v_is_path = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Staff member is not an active pathologist';
    END IF;

    IF p_end_date < p_start_date THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Leave end date must be on or after start date';
    END IF;

    SET v_days = DATEDIFF(p_end_date, p_start_date) + 1;
    SET v_year = YEAR(p_start_date);

    -- Create quota row if this is the first request of the year
    INSERT IGNORE INTO pathologist_leave_quota(pathologist_id, year)
    VALUES (p_pathologist_id, v_year);

    SELECT remaining_days INTO v_remaining
    FROM pathologist_leave_quota
    WHERE pathologist_id = p_pathologist_id AND year = v_year;

    IF v_days > v_remaining THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Insufficient leave balance for the requested period';
    END IF;

    -- Insert the leave request
    INSERT INTO leave_requests(staff_id, start_date, end_date,
                               reason, status, requested_at)
    VALUES (p_pathologist_id, p_start_date, p_end_date,
            p_reason, 'pending', NOW());

    SET p_request_id = LAST_INSERT_ID();

    -- Deduct days from quota (will be restored if rejected)
    UPDATE pathologist_leave_quota
    SET used_days = used_days + v_days
    WHERE pathologist_id = p_pathologist_id AND year = v_year;
END$$

-- Trigger: Restore leave balance on rejection
CREATE OR REPLACE TRIGGER trg_pathologist_leave_reject
AFTER UPDATE ON leave_requests
FOR EACH ROW
BEGIN
    DECLARE v_days INT;
    IF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
        SET v_days = DATEDIFF(OLD.end_date, OLD.start_date) + 1;
        UPDATE pathologist_leave_quota
        SET used_days = GREATEST(0, used_days - v_days)
        WHERE pathologist_id = OLD.staff_id
          AND year = YEAR(OLD.start_date);
    END IF;
END$$

-- Procedure: Annual leave summary report for all pathologists
CREATE OR REPLACE PROCEDURE sp_pathologist_leave_summary(IN p_year YEAR)
BEGIN
    SELECT
        s.staff_id,
        CONCAT(s.first_name, ' ', s.last_name)  AS pathologist_name,
        s.phone,
        q.total_days,
        q.used_days,
        q.remaining_days,
        q.carry_over,
        COUNT(lr.request_id)                     AS total_requests,
        SUM(lr.status = 'approved')              AS approved,
        SUM(lr.status = 'rejected')              AS rejected,
        SUM(lr.status = 'pending')               AS pending
    FROM staff s
    JOIN pathologist_leave_quota q
        ON s.staff_id = q.pathologist_id AND q.year = p_year
    LEFT JOIN leave_requests lr
        ON s.staff_id = lr.staff_id
        AND YEAR(lr.start_date) = p_year
    WHERE s.role = 'pathologist'
    GROUP BY s.staff_id, s.first_name, s.last_name, s.phone,
             q.total_days, q.used_days, q.remaining_days, q.carry_over;
END$$

DELIMITER ;

-- Supporting index for quota lookups
CREATE INDEX IF NOT EXISTS idx_path_quota_year
    ON pathologist_leave_quota(pathologist_id, year);
-- [F44: end]


-- [F44: Pathologist Leave Quota & Management System — Farhana Uvro]

-- Table: Annual leave quota per pathologist
CREATE TABLE IF NOT EXISTS pathologist_leave_quota (
    quota_id       INT AUTO_INCREMENT PRIMARY KEY,
    pathologist_id INT  NOT NULL,
    year           YEAR NOT NULL,
    total_days     INT  NOT NULL DEFAULT 20,
    used_days      INT  NOT NULL DEFAULT 0,
    remaining_days INT  GENERATED ALWAYS AS (total_days - used_days) STORED,
    carry_over     INT  NOT NULL DEFAULT 0,
    created_at     DATETIME NOT NULL DEFAULT NOW(),
    updated_at     DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    UNIQUE KEY uq_path_year (pathologist_id, year),
    CONSTRAINT chk_used_days CHECK (used_days >= 0),
    CONSTRAINT chk_total_days CHECK (total_days > 0),
    FOREIGN KEY (pathologist_id) REFERENCES staff(staff_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

DELIMITER $$

-- Procedure: Submit a leave request for a pathologist
CREATE OR REPLACE PROCEDURE sp_request_pathologist_leave(
    IN p_pathologist_id  INT,
    IN p_start_date      DATE,
    IN p_end_date        DATE,
    IN p_reason          VARCHAR(500),
    OUT p_request_id     INT)
BEGIN
    DECLARE v_days       INT;
    DECLARE v_remaining  INT DEFAULT 0;
    DECLARE v_year       YEAR;
    DECLARE v_is_path    INT DEFAULT 0;

    -- Validate the staff member is a pathologist
    SELECT COUNT(*) INTO v_is_path
    FROM staff
    WHERE staff_id = p_pathologist_id
      AND role = 'pathologist' AND is_active = 1;

    IF v_is_path = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Staff member is not an active pathologist';
    END IF;

    IF p_end_date < p_start_date THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Leave end date must be on or after start date';
    END IF;

    SET v_days = DATEDIFF(p_end_date, p_start_date) + 1;
    SET v_year = YEAR(p_start_date);

    -- Create quota row if this is the first request of the year
    INSERT IGNORE INTO pathologist_leave_quota(pathologist_id, year)
    VALUES (p_pathologist_id, v_year);

    SELECT remaining_days INTO v_remaining
    FROM pathologist_leave_quota
    WHERE pathologist_id = p_pathologist_id AND year = v_year;

    IF v_days > v_remaining THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Insufficient leave balance for the requested period';
    END IF;

    -- Insert the leave request
    INSERT INTO leave_requests(staff_id, start_date, end_date,
                               reason, status, requested_at)
    VALUES (p_pathologist_id, p_start_date, p_end_date,
            p_reason, 'pending', NOW());

    SET p_request_id = LAST_INSERT_ID();

    -- Deduct days from quota (will be restored if rejected)
    UPDATE pathologist_leave_quota
    SET used_days = used_days + v_days
    WHERE pathologist_id = p_pathologist_id AND year = v_year;
END$$

-- Trigger: Restore leave balance on rejection
CREATE OR REPLACE TRIGGER trg_pathologist_leave_reject
AFTER UPDATE ON leave_requests
FOR EACH ROW
BEGIN
    DECLARE v_days INT;
    IF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
        SET v_days = DATEDIFF(OLD.end_date, OLD.start_date) + 1;
        UPDATE pathologist_leave_quota
        SET used_days = GREATEST(0, used_days - v_days)
        WHERE pathologist_id = OLD.staff_id
          AND year = YEAR(OLD.start_date);
    END IF;
END$$

-- Procedure: Annual leave summary report for all pathologists
CREATE OR REPLACE PROCEDURE sp_pathologist_leave_summary(IN p_year YEAR)
BEGIN
    SELECT
        s.staff_id,
        CONCAT(s.first_name, ' ', s.last_name)  AS pathologist_name,
        s.phone,
        q.total_days,
        q.used_days,
        q.remaining_days,
        q.carry_over,
        COUNT(lr.request_id)                     AS total_requests,
        SUM(lr.status = 'approved')              AS approved,
        SUM(lr.status = 'rejected')              AS rejected,
        SUM(lr.status = 'pending')               AS pending
    FROM staff s
    JOIN pathologist_leave_quota q
        ON s.staff_id = q.pathologist_id AND q.year = p_year
    LEFT JOIN leave_requests lr
        ON s.staff_id = lr.staff_id
        AND YEAR(lr.start_date) = p_year
    WHERE s.role = 'pathologist'
    GROUP BY s.staff_id, s.first_name, s.last_name, s.phone,
             q.total_days, q.used_days, q.remaining_days, q.carry_over;
END$$

DELIMITER ;

-- Supporting index for quota lookups
CREATE INDEX IF NOT EXISTS idx_path_quota_year
    ON pathologist_leave_quota(pathologist_id, year);
-- [F44: end]
