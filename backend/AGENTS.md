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

Create the migrations, models, API controllers, and React CRUD interfaces for the following 6 modules:

### 1. Core Module (Tenant & Auth)
*   **Entities:** `School` (or Branch), `User`, `AcademicYear`.
*   **Logic:** Every entity in the system must belong to a `school_id` and an `academic_year_id` to allow multi-tenant isolation.
*   **Roles:** SuperAdmin, Admin, Teacher, Student/Parent.

### 2. Academic Module (SIS)
*   **Entities:** `ClassLevel` (e.g., Class 6, Class 7), `Section`, `Shift` (Morning/Day), `Student`.
*   **Relationships:** 
    *   `Student` belongsTo `ClassLevel`, `Section`, `Shift`.
    *   `Student` must have fields for: `roll_number`, `student_id` (unique string), `father_name`, `mother_name`, `phone_number` (11 digits, regex: `^01[3-9]\d{8}$`).

### 3. HR Module (Teachers)
*   **Entities:** `Teacher`.
*   **Relationships:** `Teacher` belongsTo `User`. A `Section` can have one `Teacher` as a `class_teacher_id`.

### 4. Attendance Module
*   **Entities:** `Attendance` (student_id, date, status: Present/Absent/Late).
*   **Logic:** 
    *   Create a bulk-upsert endpoint for fast submission by teachers.
    *   Implement an Event/Listener structure (`AttendanceMarked`) that triggers an SMS job for students marked "Absent". Scaffold a dummy SMS Gateway service class that we can later connect to BulkSMSBD or SSL Wireless.

### 5. Finance Module
*   **Entities:** `FeeCategory` (Tuition, Exam, Admission), `Invoice`, `Payment`.
*   **Relationships:** `Invoice` belongsTo `Student`. `Payment` belongsTo `Invoice`.
*   **Logic:** `Payment` must include `payment_method` (Cash, bKash, Nagad) and a nullable `transaction_id`.

### 6. Examination Module (NCTB Grading)
*   **Entities:** `Exam`, `Subject`, `ExamMark` (student_id, exam_id, subject_id, subjective_mark, objective_mark, total_mark, is_4th_subject).
*   **Logic:** Implement a strict Service Class `NctbGradingService` to calculate GPA based on Bangladesh rules:
    *   80-100 = A+ (5.00), 70-79 = A (4.00), 60-69 = A- (3.50), 50-59 = B (3.00), 40-49 = C (2.00), 33-39 = D (1.00), 0-32 = F (0.00).
    *   4th Subject Rule: If `is_4th_subject` is true, subtract 2.00 from the subject's GPA. Add the remainder (if > 0) to the total grade points. Maximum final GPA cannot exceed 5.00.
    *   If any main subject is F (0.00), the final GPA is 0.00 (Failed).

# Execution Steps for Antigravity
1. Scaffold the backend directory structure (`app/Modules/`).
2. Generate all Laravel Migrations in proper dependency order (Core -> Academic -> HR -> Attendance -> Finance -> Exam).
3. Generate Eloquent Models with explicit `fillable` and `belongsTo`/`hasMany` relationships.
4. Generate the `NctbGradingService` class containing the BD GPA calculation logic.
5. Generate the Vite-React folder structure (`src/features/...`).
6. Create the React API integration hooks (e.g., using React Query or Axios) and a primary Data Table component for the Academic Student List.