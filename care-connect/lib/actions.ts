'use server';

import pool from './db';
import { revalidatePath } from 'next/cache';

// --- Patients ---

export async function addPatient(formData: FormData) {
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const dob = formData.get('dob') as string;
    const gender = formData.get('gender') as string;
    const address = formData.get('address') as string;
    const bloodGroup = formData.get('bloodGroup') as string;
    const emergencyContact = formData.get('emergencyContact') as string;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Create User
        const [userRes] = await connection.execute(
            `INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'Patient')`,
            [email, 'temp_hash'] // simplified
        );
        const userId = (userRes as any).insertId;

        // 2. Create Profile
        await connection.execute(
            `INSERT INTO profiles (user_id, first_name, last_name, date_of_birth, gender, phone_number, address) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, firstName, lastName, dob, gender, phone, address]
        );

        // 3. Create Patient Record
        await connection.execute(
            `INSERT INTO patients (user_id, blood_group, emergency_contact_name) VALUES (?, ?, ?)`,
            [userId, bloodGroup, emergencyContact]
        );

        await connection.commit();
        revalidatePath('/dashboard/patients');
        return { success: true };
    } catch (error: any) {
        await connection.rollback();
        console.error(error);
        return { success: false, error: error.message };
    } finally {
        connection.release();
    }
}

// --- Dashboard Stats ---

export async function getDashboardStats() {
    // Uses the Views and Queries we defined
    // 1. Total Patients
    const [patients] = await pool.query('SELECT COUNT(*) as count FROM patients');

    // 2. Today's Appointments
    const [appointments] = await pool.query(`
        SELECT COUNT(*) as count FROM appointments 
        WHERE DATE(appointment_date) = CURDATE()
    `);

    // 3. Pending Invoices (Revenue)
    const [revenue] = await pool.query(`
        SELECT SUM(net_amount) as total FROM invoices WHERE status = 'Unpaid'
    `);

    // 4. Doctors Count
    const [doctors] = await pool.query('SELECT COUNT(*) as count FROM doctors');

    return {
        totalPatients: (patients as any)[0].count,
        todayAppointments: (appointments as any)[0].count,
        pendingRevenue: (revenue as any)[0].total || 0,
        activeDoctors: (doctors as any)[0].count
    };
}

export async function getRecentAppointments() {
    const [rows] = await pool.query(`
        SELECT * FROM View_PatientHistory 
        ORDER BY appointment_date DESC 
        LIMIT 5
    `);
    return rows;
}

// --- Appointments ---

export async function bookAppointment(formData: FormData) {
    const patientId = formData.get('patientId');
    const doctorId = formData.get('doctorId');
    const date = formData.get('date'); // '2025-01-01T10:00'
    const reason = formData.get('reason');

    try {
        // Call the Stored Procedure
        await pool.query(
            `CALL BookAppointment(?, ?, ?, ?, @status)`,
            [patientId, doctorId, date, reason]
        );
        const [rows] = await pool.query('SELECT @status as status');
        const status = (rows as any)[0].status;

        if (status === 'Success') {
            revalidatePath('/dashboard');
            return { success: true };
        } else {
            return { success: false, error: status };
        }
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getDoctors() {
    const [rows] = await pool.query(`
        SELECT d.doctor_id, CONCAT(p.first_name, ' ', p.last_name) as name, d.specialization
        FROM doctors d
        JOIN profiles p ON d.user_id = p.user_id
    `);
    return rows;
}

export async function getPatients() {
    const [rows] = await pool.query(`
        SELECT pat.patient_id, CONCAT(p.first_name, ' ', p.last_name) as name
        FROM patients pat
        JOIN profiles p ON pat.user_id = p.user_id
    `);
    return rows;
}

// --- New Invoice Action ---

export async function generateInvoice(appointmentId: number) {
    try {
        await pool.query('CALL GenerateInvoice(?)', [appointmentId]);
        revalidatePath('/dashboard/billing');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function processPayment(invoiceId: number, amount: number, method: string) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await connection.execute(
            `INSERT INTO payments (invoice_id, amount, payment_method) VALUES (?, ?, ?)`,
            [invoiceId, amount, method]
        );

        // Trigger automatically updates Invoice Status to 'Paid' if full amount

        await connection.commit();
        revalidatePath('/dashboard/billing');
        return { success: true };
    } catch (e: any) {
        await connection.rollback();
        return { success: false, error: e.message };
    } finally {
        connection.release();
    }
}

export async function getUnpaidInvoices() {
    // Joining multiple tables for a rich view
    const [rows] = await pool.query(`
        SELECT 
            i.invoice_id,
            i.total_amount,
            i.status,
            p.first_name as patient_name,
            d.first_name as doctor_name,
            a.appointment_date
        FROM invoices i
        JOIN appointments a ON i.appointment_id = a.appointment_id
        JOIN patients pat ON a.patient_id = pat.patient_id
        JOIN profiles p ON pat.user_id = p.user_id
        JOIN doctors doc ON a.doctor_id = doc.doctor_id
        JOIN profiles d ON doc.user_id = d.user_id
        WHERE i.status = 'Unpaid'
    `);
    return rows;
}

export async function getAllAppointments() {
    const [rows] = await pool.query(`SELECT * FROM View_PatientHistory ORDER BY appointment_date DESC`);
    return rows;
}

export async function getAllPatients() {
    const [rows] = await pool.query(`
        SELECT 
            p.patient_id,
            prof.first_name,
            prof.last_name,
            prof.phone_number,
            prof.gender,
            TIMESTAMPDIFF(YEAR, prof.date_of_birth, CURDATE()) as age,
            p.blood_group,
            p.emergency_contact_name,
            u.email
        FROM patients p
        JOIN users u ON p.user_id = u.user_id
        JOIN profiles prof ON u.user_id = prof.user_id
        ORDER BY p.patient_id DESC
    `);
    return rows;
}
