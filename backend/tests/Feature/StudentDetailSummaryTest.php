<?php

namespace Tests\Feature;

use App\Modules\Academic\Models\ClassLevel;
use App\Modules\Academic\Models\Section;
use App\Modules\Academic\Models\Student;
use App\Modules\Academic\Models\TeacherNote;
use App\Modules\Attendance\Models\Attendance;
use App\Modules\Attendance\Models\Holiday;
use App\Modules\Core\Enums\Role;
use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use App\Modules\Core\Models\User;
use App\Modules\Invoice\Models\Invoice;
use App\Modules\Payments\Models\Payment;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentDetailSummaryTest extends TestCase
{
    use RefreshDatabase;

    protected School $school;
    protected AcademicYear $year;
    protected User $admin;
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

        $classLevel = ClassLevel::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->year->id,
            'name' => 'Grade 9',
            'numeric_value' => 9,
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
            'first_name' => 'Tariqul',
            'last_name' => 'Islam',
            'father_name' => 'Mohammad Ali',
            'mother_name' => 'Fatema Begum',
            'phone_number' => '01711223344',
            'gender' => 'Male',
            'roll_number' => 1,
            'status' => 'active',
        ]);
    }

    public function test_attendance_history_marks_present_absent_and_respects_holiday(): void
    {
        $today = Carbon::today()->toDateString();
        $threeDaysAgo = Carbon::today()->subDays(3)->toDateString();
        $fiveDaysAgo = Carbon::today()->subDays(5)->toDateString();

        // 1. Student was Present today
        Attendance::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->year->id,
            'student_id' => $this->student->id,
            'section_id' => $this->student->section_id,
            'date' => $today,
            'status' => 'Present',
        ]);

        // 2. Three days ago was an institutional holiday
        Holiday::create([
            'school_id' => $this->school->id,
            'title' => 'Shaheed Day',
            'date' => $threeDaysAgo,
            'type' => 'National',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/students/{$this->student->id}/attendance-history?days=10");

        $response->assertStatus(200)
            ->assertJsonPath('days', 10)
            ->assertJsonCount(10, 'data');

        $data = collect($response->json('data'));

        // Today must be Present
        $todayRow = $data->firstWhere('date', $today);
        $this->assertEquals('Present', $todayRow['status']);

        // Three days ago must be Holiday with title
        $holidayRow = $data->firstWhere('date', $threeDaysAgo);
        $this->assertEquals('Holiday', $holidayRow['status']);
        $this->assertTrue($holidayRow['is_holiday']);

        // Five days ago had no attendance record and was not a holiday -> must be marked Absent
        $absentRow = $data->firstWhere('date', $fiveDaysAgo);
        $this->assertEquals('Absent', $absentRow['status']);
    }

    public function test_can_add_and_list_teacher_notes(): void
    {
        // Add note
        $postRes = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/students/{$this->student->id}/teacher-notes", [
                'title' => 'Math Olympiad Candidate',
                'category' => 'Academic',
                'note' => 'Exceptional talent in algebra and geometry.',
                'date' => '2026-11-10',
            ]);

        $postRes->assertStatus(201)
            ->assertJsonPath('data.title', 'Math Olympiad Candidate');

        // List notes
        $listRes = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/students/{$this->student->id}/teacher-notes");

        $listRes->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Math Olympiad Candidate');
    }

    public function test_full_summary_endpoint_returns_all_seven_profile_tables(): void
    {
        TeacherNote::create([
            'school_id' => $this->school->id,
            'student_id' => $this->student->id,
            'title' => 'General Conduct',
            'category' => 'Behavioral',
            'note' => 'Great discipline in class.',
            'date' => '2026-11-12',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/students/{$this->student->id}/full-summary");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'student',
                'attendance' => ['total', 'data'],
                'invoices' => ['total', 'data'],
                'payments' => ['total', 'data'],
                'teacher_notes' => ['total', 'data'],
                'library_rents' => ['total', 'data'],
                'exam_results' => ['total', 'data'],
                'documents' => ['total', 'data'],
            ]);

        $this->assertCount(10, $response->json('attendance.data'));
        $this->assertCount(1, $response->json('teacher_notes.data'));
    }
}
