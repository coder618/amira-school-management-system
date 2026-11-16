<?php

namespace Tests\Feature;

use App\Modules\Academic\Models\ClassLevel;
use App\Modules\Academic\Models\Section;
use App\Modules\Academic\Models\Student;
use App\Modules\Academic\Models\TeacherNote;
use App\Modules\Attendance\Models\AttendanceDeviceLog;
use App\Modules\Attendance\Models\Holiday;
use App\Modules\Core\Enums\Role;
use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use App\Modules\Core\Models\User;
use App\Modules\HR\Models\Teacher;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherDetailSummaryTest extends TestCase
{
    use RefreshDatabase;

    protected School $school;
    protected AcademicYear $year;
    protected User $admin;
    protected Teacher $teacher;
    protected Student $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = School::create([
            'name' => 'Future International School',
            'code' => 'FIS-001',
            'is_active' => true,
        ]);

        $this->year = AcademicYear::create([
            'school_id' => $this->school->id,
            'title' => '2026-2027',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'is_current' => true,
        ]);

        $this->admin = User::create([
            'school_id' => $this->school->id,
            'name' => 'Admin User',
            'email' => 'admin@fis.edu',
            'password' => bcrypt('password'),
            'role' => Role::Admin->value,
            'is_active' => true,
        ]);

        $teacherUser = User::create([
            'school_id' => $this->school->id,
            'name' => 'Professor John Doe',
            'email' => 'john.doe@fis.edu',
            'password' => bcrypt('password'),
            'role' => Role::Teacher->value,
            'phone_number' => '01811223344',
            'is_active' => true,
        ]);

        $this->teacher = Teacher::create([
            'school_id' => $this->school->id,
            'user_id' => $teacherUser->id,
            'employee_id' => 'EMP-1001',
            'designation' => 'Senior Lecturer',
            'department' => 'Science',
            'card_rfid' => 'TEACH-CARD-01',
            'phone_number' => '01811223344',
            'joining_date' => '2024-01-01',
        ]);

        $classLevel = ClassLevel::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->year->id,
            'name' => 'Grade 10',
            'numeric_value' => 10,
        ]);

        $section = Section::create([
            'school_id' => $this->school->id,
            'class_level_id' => $classLevel->id,
            'name' => 'A',
            'capacity' => 40,
        ]);

        $this->student = Student::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->year->id,
            'class_level_id' => $classLevel->id,
            'section_id' => $section->id,
            'student_id' => 'STU-001',
            'first_name' => 'Karim',
            'last_name' => 'Ahmed',
            'father_name' => 'Rafiq Ahmed',
            'mother_name' => 'Nasreen Ahmed',
            'phone_number' => '01711223344',
            'gender' => 'Male',
            'roll_number' => 1,
            'status' => 'active',
        ]);
    }

    public function test_teacher_full_summary_returns_last_10_days_attendance_with_punches_and_holidays(): void
    {
        $today = Carbon::today()->toDateString();
        $threeDaysAgo = Carbon::today()->subDays(3)->toDateString();
        $fiveDaysAgo = Carbon::today()->subDays(5)->toDateString();

        // 1. Teacher punched in and out today
        AttendanceDeviceLog::create([
            'school_id' => $this->school->id,
            'raw_identifier' => 'TEACH-CARD-01',
            'user_type' => 'teacher',
            'user_id' => $this->teacher->user_id,
            'teacher_id' => $this->teacher->id,
            'punched_at' => "{$today} 08:30:00",
            'punch_type' => 'check_in',
            'verification_method' => 'card',
            'status' => 'success',
        ]);
        AttendanceDeviceLog::create([
            'school_id' => $this->school->id,
            'raw_identifier' => 'TEACH-CARD-01',
            'user_type' => 'teacher',
            'user_id' => $this->teacher->user_id,
            'teacher_id' => $this->teacher->id,
            'punched_at' => "{$today} 16:30:00",
            'punch_type' => 'check_out',
            'verification_method' => 'card',
            'status' => 'success',
        ]);

        // 2. 3 days ago was a school holiday
        Holiday::create([
            'school_id' => $this->school->id,
            'title' => 'National Science Festival',
            'date' => $threeDaysAgo,
            'type' => 'Academic Holiday',
        ]);

        // 3. Teacher gave notes to the student
        TeacherNote::create([
            'school_id' => $this->school->id,
            'student_id' => $this->student->id,
            'teacher_id' => $this->teacher->id,
            'author_id' => $this->teacher->user_id,
            'author_name' => $this->teacher->user->name,
            'title' => 'Excellent Lab Report',
            'category' => 'Academic',
            'note' => 'Demonstrated great analytical depth in Physics experiments.',
            'date' => $today,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/teachers/{$this->teacher->id}/full-summary");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'teacher' => ['id', 'employee_id', 'designation'],
                'attendance' => ['total', 'data'],
                'teacher_notes' => ['total', 'data'],
            ]);

        $attendanceData = $response->json('attendance.data');
        $this->assertCount(10, $attendanceData);

        // Check Today's Attendance (Should be Present with In: 08:30 AM and Out: 04:30 PM)
        $todayAtt = collect($attendanceData)->firstWhere('date', $today);
        $this->assertNotNull($todayAtt);
        $this->assertEquals('Present', $todayAtt['status']);
        $this->assertEquals('08:30 AM', $todayAtt['in_time']);
        $this->assertEquals('04:30 PM', $todayAtt['out_time']);
        $this->assertEquals(2, $todayAtt['punch_count']);

        // Check 3 Days Ago (Should be Holiday)
        $holidayAtt = collect($attendanceData)->firstWhere('date', $threeDaysAgo);
        $this->assertNotNull($holidayAtt);
        $this->assertEquals('Holiday', $holidayAtt['status']);
        $this->assertTrue($holidayAtt['is_holiday']);
        $this->assertStringContainsString('National Science Festival', $holidayAtt['remarks']);

        // Check 5 Days Ago (No punch, not a holiday => Absent)
        $absentAtt = collect($attendanceData)->firstWhere('date', $fiveDaysAgo);
        $this->assertNotNull($absentAtt);
        $this->assertEquals('Absent', $absentAtt['status']);
        $this->assertNull($absentAtt['in_time']);
        $this->assertNull($absentAtt['out_time']);

        // Check Teacher Notes List
        $notes = $response->json('teacher_notes.data');
        $this->assertCount(1, $notes);
        $this->assertEquals('Excellent Lab Report', $notes[0]['title']);
        $this->assertEquals($this->student->id, $notes[0]['student']['id']);
        $this->assertEquals('Karim', $notes[0]['student']['first_name']);
    }
}
