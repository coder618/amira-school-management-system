---
name: build-bd-school-saas
description: Generates the core modules, migrations, controllers, and React components for a Bangladeshi School Management SaaS.
---

# Context & Stack
Build a School Management System for Bangladesh. 
- **Backend:** Laravel (API strictly JSON, use Domain-Driven folder structure in `app/Modules`).
- **Frontend:** React (Vite, Tailwind, feature-based folder structure).
- **Core Rules:** Keep the code modular. Always validate requests. Use Eloquent relationships properly. 

# Module Relationships & Schema Requirements

The architecture follows a strict Domain-Driven modular structure in `app/Modules`, where every tenant entity inherits `BelongsToTenant` (`school_id` and `academic_year_id`):

### 1. Core Module (Tenant & Auth)
*   **Location:** `app/Modules/Core`
*   **Entities:** `School` (or Branch), `User`, `AcademicYear`.
*   **Logic:** Every entity belongs to a `school_id` and an `academic_year_id` for multi-tenant isolation.
*   **Roles:** SuperAdmin, Admin, Teacher, Student/Parent.

### 2. Academic Module (SIS & Curriculum)
*   **Location:** `app/Modules/Academic`
*   **Entities:** `ClassLevel`, `Section`, `Shift` (Morning/Day), `Student`, `Subject`.
*   **Relationships:** 
    *   `Student` belongsTo `ClassLevel`, `Section`, `Shift`, `User`.
    *   `Student` has: `roll_number`, `student_id` (unique string), `father_name`, `mother_name`, `phone_number` (11 digits, regex: `^01[3-9]\d{8}$`), `status`.
    *   `Subject` belongsTo `ClassLevel` and has: `name`, `code`, `full_mark`, `pass_mark`, `is_optional`, `can_be_4th_subject`.

### 3. SchoolClass Module
*   **Location:** `app/Modules/SchoolClass`
*   **Entities:** `ClassLevel`.
*   **Logic:** Dedicated management for tenant-specific class levels, sections relationship, enrollment counts, and cascading validation.

### 4. HR Module (Teachers)
*   **Location:** `app/Modules/HR`
*   **Entities:** `Teacher`.
*   **Relationships:** `Teacher` belongsTo `User`. A `Section` can have one `Teacher` as `class_teacher_id`.

### 5. Attendance Module
*   **Location:** `app/Modules/Attendance`
*   **Entities:** `Attendance` (student_id, date, status: Present/Absent/Late).
*   **Logic:** 
    *   Bulk-upsert endpoint for rapid submission by teachers.
    *   Event/Listener structure (`AttendanceMarked`) triggering absent SMS notifications via `SmsGatewayService`.

### 6. FundCollectionName Module (Fee Categories & Collection Heads)
*   **Location:** `app/Modules/FundCollectionName`
*   **Entities:** `FundCollectionName` (name, interval: Monthly/Quarterly/6 Months/Yearly/One-Time, default_amount, description, is_active).
*   **Logic:**
    *   Managed by school admin to define collections (Monthly tuition, library fee, admission fee, laboratory fee, session fee).
    *   Interval flexibility: supports Monthly, Quarterly, 6 Months (Half-Yearly), Yearly, One-Time.
    *   Unique per tenant: `['school_id', 'name']`.
    *   Protected deletion: cannot delete collection name if payment records are attached.

### 7. Payments Module (Tenant Collections & Student Billing)
*   **Location:** `app/Modules/Payments`
*   **Entities:** `Payment` (student_id, fund_collection_name_id, receipt_no, amount, paid_amount, due_amount, status: paid/due/partially_paid/cancelled, payment_method: Cash/bKash/Nagad/Bank/Rocket, transaction_id, payment_date, due_date, received_by, notes).
*   **Logic:**
    *   Must strictly belong to a specific `FundCollectionName` entity.
    *   Automated status calculation: `paid` (full settlement), `partially_paid` (installments), `due` (unpaid).
    *   Settle endpoint (`/api/payments/{id}/settle`) for paying remaining dues.
    *   Multi-tenant isolated per school (`school_id`).

### 8. SchoolExams Module (Tenant Exams)
*   **Location:** `app/Modules/SchoolExams`
*   **Entities:** `Exam` (name, term, start_date, end_date, is_published).
*   **Logic:** 
    *   Multi-tenant exam lifecycle management (CRUD, publication toggling).
    *   Exam name unique per tenant school & academic year (`['school_id', 'academic_year_id', 'name']`).
    *   Protected deletion: cannot delete an exam with active student marks.

### 9. SchoolExamResults Module (NCTB Grading & Tabulation)
*   **Location:** `app/Modules/SchoolExamResults`
*   **Entities:** `ExamResult` (student_id, exam_id, subject_id, subjective_mark, objective_mark, practical_mark, total_mark, is_4th_subject, gpa, grade).
*   **Logic:**
    *   `NctbGradingService`: Standard Bangladesh grading scale (A+ to F, 80-100 = 5.00, etc.).
    *   4th Subject Rule: Subtract 2.00 from 4th subject GPA; positive remainder added as bonus to total grade points. Final GPA capped at 5.00 max.
    *   Fail Rule: If any main subject is F (0.00), composite GPA is 0.00 (Failed).
    *   Features: Individual mark entry, rapid bulk marks recording, official NCTB Student Report Cards, and full class Tabulation Sheets with automated merit rank ordering.

### 10. Notification Module (User-Pointed Notifications)
*   **Location:** `app/Modules/Notification`
*   **Entities:** `Notification` (`user_notifications` table with user_id, school_id, title, message, type, data, read_at, deleted_at).
*   **Logic:**
    *   Pointed directly to `User` for personal, role-based, or institutional alerts.
    *   User actions: View notifications, mark as read / unread, mark all as read.
    *   Soft deletes: User can soft delete their own notifications into trash, view archived, restore, or empty trash.
    *   Strict ownership authorization: A user can only inspect, read, unread, or soft delete notifications belonging to their own `user_id`.

# Execution Steps for Antigravity
1. Scaffold the backend directory structure (`app/Modules/`).
2. Generate all Laravel Migrations in proper dependency order (Core -> Academic -> HR -> Attendance -> Finance -> Exam).
3. Generate Eloquent Models with explicit `fillable` and `belongsTo`/`hasMany` relationships.
4. Generate the `NctbGradingService` class containing the BD GPA calculation logic.
5. Generate the Vite-React folder structure (`src/features/...`).
6. Create the React API integration hooks (e.g., using React Query or Axios) and a primary Data Table component for the Academic Student List.