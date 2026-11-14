<?php

namespace Database\Seeders;

use App\Modules\Academic\Models\ClassLevel;
use App\Modules\Academic\Models\Section;
use App\Modules\Academic\Models\Shift;
use App\Modules\Academic\Models\Student;
use App\Modules\Core\Enums\Role;
use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use App\Modules\Core\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. School Tenant
        $school = School::firstOrCreate(
            ['code' => 'DIHS-001'],
            [
                'name' => 'Dhaka Ideal High School & College',
                'eiin' => '108250',
                'board' => 'Dhaka',
                'division' => 'Dhaka',
                'district' => 'Dhaka',
                'thana' => 'Motijheel',
                'address' => 'Motijheel C/A, Dhaka-1000, Bangladesh',
                'phone' => '01711000000',
                'email' => 'info@dhaka-ideal.edu.bd',
                'is_active' => true,
            ]
        );

        // 2. Academic Year
        $year = AcademicYear::firstOrCreate(
            ['school_id' => $school->id, 'title' => '2026-2027'],
            [
                'start_date' => '2026-01-01',
                'end_date' => '2026-12-31',
                'is_current' => true,
            ]
        );

        // 3. Core Users
        User::firstOrCreate(
            ['email' => 'superadmin@school.com'],
            [
                'name' => 'System SuperAdmin',
                'password' => Hash::make('password'),
                'role' => Role::SuperAdmin->value,
                'school_id' => null, // Global multi-tenant access
                'phone_number' => '01700000001',
            ]
        );

        User::firstOrCreate(
            ['email' => 'admin@school.com'],
            [
                'name' => 'Headmaster / School Admin',
                'password' => Hash::make('password'),
                'role' => Role::Admin->value,
                'school_id' => $school->id,
                'phone_number' => '01700000002',
            ]
        );

        // 3b. HR Teachers
        $teacherUser1 = User::firstOrCreate(
            ['email' => 'anwar.h@school.edu.bd'],
            [
                'name' => 'Dr. Anwar Hossain',
                'password' => Hash::make('password'),
                'role' => Role::Teacher->value,
                'school_id' => $school->id,
                'phone_number' => '01715000001',
            ]
        );
        $teacher1 = \App\Modules\HR\Models\Teacher::firstOrCreate(
            ['school_id' => $school->id, 'employee_id' => 'EMP-101'],
            [
                'user_id' => $teacherUser1->id,
                'designation' => 'Senior Teacher (Mathematics)',
                'department' => 'Science',
                'qualification' => 'M.Sc (DU), B.Ed',
                'phone_number' => '01715000001',
                'joining_date' => '2020-01-15',
            ]
        );

        $teacherUser2 = User::firstOrCreate(
            ['email' => 'farhana.y@school.edu.bd'],
            [
                'name' => 'Ms. Farhana Yasmin',
                'password' => Hash::make('password'),
                'role' => Role::Teacher->value,
                'school_id' => $school->id,
                'phone_number' => '01815000002',
            ]
        );
        $teacher2 = \App\Modules\HR\Models\Teacher::firstOrCreate(
            ['school_id' => $school->id, 'employee_id' => 'EMP-102'],
            [
                'user_id' => $teacherUser2->id,
                'designation' => 'Assistant Teacher (English)',
                'department' => 'Humanities',
                'qualification' => 'M.A (JU) in English',
                'phone_number' => '01815000002',
                'joining_date' => '2022-03-01',
            ]
        );

        // 4. Shifts
        $morningShift = Shift::firstOrCreate(
            ['school_id' => $school->id, 'name' => 'Morning'],
            ['start_time' => '07:30:00', 'end_time' => '12:00:00', 'is_active' => true]
        );

        $dayShift = Shift::firstOrCreate(
            ['school_id' => $school->id, 'name' => 'Day'],
            ['start_time' => '12:30:00', 'end_time' => '17:00:00', 'is_active' => true]
        );

        // 5. Classes & Sections
        $classes = [
            ['name' => 'Class 6', 'numeric' => 6],
            ['name' => 'Class 7', 'numeric' => 7],
            ['name' => 'Class 8', 'numeric' => 8],
            ['name' => 'Class 9', 'numeric' => 9],
            ['name' => 'Class 10', 'numeric' => 10],
        ];

        foreach ($classes as $c) {
            $classLevel = ClassLevel::firstOrCreate(
                ['school_id' => $school->id, 'academic_year_id' => $year->id, 'name' => $c['name']],
                ['numeric_value' => $c['numeric'], 'code' => 'C'.$c['numeric']]
            );

            $sectionPadma = Section::firstOrCreate(
                ['school_id' => $school->id, 'academic_year_id' => $year->id, 'class_level_id' => $classLevel->id, 'name' => 'Padma'],
                ['capacity' => 50]
            );

            Section::firstOrCreate(
                ['school_id' => $school->id, 'academic_year_id' => $year->id, 'class_level_id' => $classLevel->id, 'name' => 'Meghna'],
                ['capacity' => 50]
            );

            // Seed sample students for Class 10 Padma
            if ($c['numeric'] === 10) {
                $sampleStudents = [
                    [
                        'student_id' => 'STU-2026-1001',
                        'roll_number' => 1,
                        'first_name' => 'Tahmid',
                        'last_name' => 'Rahman',
                        'father_name' => 'Khandakar M. Rahman',
                        'mother_name' => 'Begum Rokeya',
                        'phone_number' => '01712345678',
                        'gender' => 'Male',
                        'status' => 'active',
                        'shift_id' => $dayShift->id,
                    ],
                    [
                        'student_id' => 'STU-2026-1002',
                        'roll_number' => 2,
                        'first_name' => 'Nusrat',
                        'last_name' => 'Jahan',
                        'father_name' => 'Enamul Haque',
                        'mother_name' => 'Nazneen Akhter',
                        'phone_number' => '01819283746',
                        'gender' => 'Female',
                        'status' => 'active',
                        'shift_id' => $morningShift->id,
                    ],
                    [
                        'student_id' => 'STU-2026-1003',
                        'roll_number' => 3,
                        'first_name' => 'Farhan',
                        'last_name' => 'Tanvir',
                        'father_name' => 'Zillur Rahman',
                        'mother_name' => 'Farida Parveen',
                        'phone_number' => '01911223344',
                        'gender' => 'Male',
                        'status' => 'active',
                        'shift_id' => $dayShift->id,
                    ],
                    [
                        'student_id' => 'STU-2026-1004',
                        'roll_number' => 4,
                        'first_name' => 'Aysha',
                        'last_name' => 'Siddiqua',
                        'father_name' => 'Mohiuddin Siddique',
                        'mother_name' => 'Salma Khatun',
                        'phone_number' => '01678123456',
                        'gender' => 'Female',
                        'status' => 'active',
                        'shift_id' => $morningShift->id,
                    ],
                ];

                foreach ($sampleStudents as $stu) {
                    $stuEmail = $stu['email'] ?? strtolower(str_replace([' ', '-'], '', $stu['student_id'])) . '@student.school.edu.bd';
                    $studentUser = User::firstOrCreate(
                        ['email' => $stuEmail],
                        [
                            'school_id' => $school->id,
                            'name' => trim("{$stu['first_name']} " . ($stu['last_name'] ?? '')),
                            'password' => Hash::make('student123'),
                            'role' => Role::Student->value,
                            'phone_number' => $stu['phone_number'],
                            'is_active' => true,
                        ]
                    );

                    $studentModel = Student::firstOrCreate(
                        ['school_id' => $school->id, 'academic_year_id' => $year->id, 'student_id' => $stu['student_id']],
                        array_merge($stu, [
                            'school_id' => $school->id,
                            'academic_year_id' => $year->id,
                            'class_level_id' => $classLevel->id,
                            'section_id' => $sectionPadma->id,
                            'user_id' => $studentUser->id,
                            'email' => $stuEmail,
                        ])
                    );

                    if (!$studentModel->user_id) {
                        $studentModel->update(['user_id' => $studentUser->id, 'email' => $stuEmail]);
                    }
                }

                // 6. Fund Collection Names & Sample Payments
                $monthlyFee = \App\Modules\FundCollectionName\Models\FundCollectionName::firstOrCreate(
                    ['school_id' => $school->id, 'name' => 'Monthly Tuition Fee'],
                    [
                        'academic_year_id' => $year->id,
                        'interval' => 'Monthly',
                        'default_amount' => 2500.00,
                        'description' => 'Regular academic monthly tuition charge',
                        'is_active' => true,
                    ]
                );
                $examFee = \App\Modules\FundCollectionName\Models\FundCollectionName::firstOrCreate(
                    ['school_id' => $school->id, 'name' => 'Term Examination Fee'],
                    [
                        'academic_year_id' => $year->id,
                        'interval' => '6 Months',
                        'default_amount' => 1200.00,
                        'description' => 'Semester examination logistics & answer scripts',
                        'is_active' => true,
                    ]
                );
                \App\Modules\FundCollectionName\Models\FundCollectionName::firstOrCreate(
                    ['school_id' => $school->id, 'name' => 'Annual Admission & Session Fee'],
                    [
                        'academic_year_id' => $year->id,
                        'interval' => 'Yearly',
                        'default_amount' => 8000.00,
                        'description' => 'Annual institutional session and development fund',
                        'is_active' => true,
                    ]
                );

                $firstStudent = Student::where('student_id', 'STU-2026-1001')->first();
                if ($firstStudent) {
                    \App\Modules\Payments\Models\Payment::firstOrCreate(
                        ['school_id' => $school->id, 'transaction_id' => 'BKASH-9X82LA71'],
                        [
                            'academic_year_id' => $year->id,
                            'fund_collection_name_id' => $monthlyFee->id,
                            'student_id' => $firstStudent->id,
                            'receipt_no' => 'RCP-2026-0001',
                            'amount' => 2500.00,
                            'paid_amount' => 2500.00,
                            'due_amount' => 0.00,
                            'status' => 'paid',
                            'payment_method' => 'bKash',
                            'payment_date' => '2026-01-18',
                            'received_by' => 'bKash Merchant Gateway',
                            'notes' => 'Received via bKash checkout',
                        ]
                    );

                    \App\Modules\Payments\Models\Payment::firstOrCreate(
                        ['school_id' => $school->id, 'receipt_no' => 'RCP-2026-0002'],
                        [
                            'academic_year_id' => $year->id,
                            'fund_collection_name_id' => $examFee->id,
                            'student_id' => $firstStudent->id,
                            'amount' => 1200.00,
                            'paid_amount' => 500.00,
                            'due_amount' => 700.00,
                            'status' => 'partially_paid',
                            'payment_method' => 'Cash',
                            'payment_date' => '2026-03-10',
                            'received_by' => 'Cashier Desk',
                            'notes' => 'Partial installment paid at counter',
                        ]
                    );
                }

                    // 7. Examination Module Seeds (SchoolExams & SchoolExamResults)
                    $exam1 = \App\Modules\SchoolExams\Models\Exam::firstOrCreate(
                        ['school_id' => $school->id, 'name' => 'First Term Examination 2026'],
                        [
                            'academic_year_id' => $year->id,
                            'term' => 'First Term',
                            'start_date' => '2026-04-10',
                            'end_date' => '2026-04-25',
                            'is_published' => true,
                        ]
                    );

                    $class10 = ClassLevel::where('numeric_value', 10)->first();
                    if ($class10) {
                        $subBangla = \App\Modules\Academic\Models\Subject::firstOrCreate(
                            ['school_id' => $school->id, 'class_level_id' => $class10->id, 'name' => 'Bangla 1st Paper'],
                            ['code' => '101', 'full_mark' => 100, 'pass_mark' => 33, 'is_optional' => false, 'can_be_4th_subject' => false]
                        );
                        $subEnglish = \App\Modules\Academic\Models\Subject::firstOrCreate(
                            ['school_id' => $school->id, 'class_level_id' => $class10->id, 'name' => 'English 1st Paper'],
                            ['code' => '107', 'full_mark' => 100, 'pass_mark' => 33, 'is_optional' => false, 'can_be_4th_subject' => false]
                        );
                        $subMath = \App\Modules\Academic\Models\Subject::firstOrCreate(
                            ['school_id' => $school->id, 'class_level_id' => $class10->id, 'name' => 'General Mathematics'],
                            ['code' => '109', 'full_mark' => 100, 'pass_mark' => 33, 'is_optional' => false, 'can_be_4th_subject' => false]
                        );
                        $subHMath = \App\Modules\Academic\Models\Subject::firstOrCreate(
                            ['school_id' => $school->id, 'class_level_id' => $class10->id, 'name' => 'Higher Mathematics (4th Subject)'],
                            ['code' => '126', 'full_mark' => 100, 'pass_mark' => 33, 'is_optional' => true, 'can_be_4th_subject' => true]
                        );

                        // Seed sample marks for Tahmid
                        \App\Modules\SchoolExamResults\Models\ExamResult::firstOrCreate(
                            ['school_id' => $school->id, 'student_id' => $firstStudent->id, 'exam_id' => $exam1->id, 'subject_id' => $subBangla->id],
                            ['subjective_mark' => 58, 'objective_mark' => 26, 'practical_mark' => 0, 'total_mark' => 84, 'is_4th_subject' => false, 'gpa' => 5.00, 'grade' => 'A+']
                        );
                        \App\Modules\SchoolExamResults\Models\ExamResult::firstOrCreate(
                            ['school_id' => $school->id, 'student_id' => $firstStudent->id, 'exam_id' => $exam1->id, 'subject_id' => $subEnglish->id],
                            ['subjective_mark' => 52, 'objective_mark' => 24, 'practical_mark' => 0, 'total_mark' => 76, 'is_4th_subject' => false, 'gpa' => 4.00, 'grade' => 'A']
                        );
                        \App\Modules\SchoolExamResults\Models\ExamResult::firstOrCreate(
                            ['school_id' => $school->id, 'student_id' => $firstStudent->id, 'exam_id' => $exam1->id, 'subject_id' => $subMath->id],
                            ['subjective_mark' => 65, 'objective_mark' => 28, 'practical_mark' => 0, 'total_mark' => 93, 'is_4th_subject' => false, 'gpa' => 5.00, 'grade' => 'A+']
                        );
                        \App\Modules\SchoolExamResults\Models\ExamResult::firstOrCreate(
                            ['school_id' => $school->id, 'student_id' => $firstStudent->id, 'exam_id' => $exam1->id, 'subject_id' => $subHMath->id],
                            ['subjective_mark' => 50, 'objective_mark' => 20, 'practical_mark' => 22, 'total_mark' => 92, 'is_4th_subject' => true, 'gpa' => 5.00, 'grade' => 'A+']
                        );
                    }
                }
            }

        // 9. Seed Sample User Notifications
        $adminUser = User::where('email', 'admin@school.com')->first();
        if ($adminUser) {
            \App\Modules\Notification\Models\Notification::firstOrCreate(
                ['user_id' => $adminUser->id, 'title' => 'Term Final Examination Schedule Published'],
                [
                    'school_id' => $school->id,
                    'message' => 'The First Term Final Examination 2026 timetable has been reviewed and published for Class 6-10.',
                    'type' => 'exam',
                    'data' => ['link' => '/exams'],
                    'read_at' => null,
                ]
            );
            \App\Modules\Notification\Models\Notification::firstOrCreate(
                ['user_id' => $adminUser->id, 'title' => 'Monthly Tuition Fee Collections Generated'],
                [
                    'school_id' => $school->id,
                    'message' => 'Monthly school tuition and laboratory fee demands for November have been automatically queued.',
                    'type' => 'finance',
                    'data' => ['link' => '/finance'],
                    'read_at' => null,
                ]
            );
            \App\Modules\Notification\Models\Notification::firstOrCreate(
                ['user_id' => $adminUser->id, 'title' => 'Daily Attendance Summary Logged'],
                [
                    'school_id' => $school->id,
                    'message' => 'Morning shift student attendance submission completed with 98.4% attendance rate.',
                    'type' => 'attendance',
                    'data' => ['link' => '/attendance'],
                    'read_at' => now(),
                ]
            );
            \App\Modules\Notification\Models\Notification::firstOrCreate(
                ['user_id' => $adminUser->id, 'title' => 'Curriculum Syllabus Update'],
                [
                    'school_id' => $school->id,
                    'message' => 'National Curriculum and Textbook Board (NCTB) 2026 science textbook guidelines updated.',
                    'type' => 'info',
                    'data' => ['link' => '/classes'],
                    'read_at' => null,
                ]
            );
        }
    }
}
