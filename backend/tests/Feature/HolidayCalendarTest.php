<?php

namespace Tests\Feature;

use App\Modules\Academic\Models\ClassLevel;
use App\Modules\Academic\Models\Section;
use App\Modules\Academic\Models\Student;
use App\Modules\Attendance\Models\Holiday;
use App\Modules\Core\Enums\Role;
use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use App\Modules\Core\Models\User;
use App\Modules\HR\Models\Teacher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HolidayCalendarTest extends TestCase
{
    use RefreshDatabase;

    protected School $school;
    protected AcademicYear $year;
    protected User $admin;
    protected User $teacherUser;
    protected User $studentUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = School::create([
            'name' => 'Future International School',
            'code' => 'FIS-001',
            'board' => 'Dhaka',
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

        $this->teacherUser = User::create([
            'school_id' => $this->school->id,
            'name' => 'Teacher User',
            'email' => 'teacher@fis.edu',
            'password' => bcrypt('password'),
            'role' => Role::Teacher->value,
            'is_active' => true,
        ]);

        Teacher::create([
            'school_id' => $this->school->id,
            'user_id' => $this->teacherUser->id,
            'employee_id' => 'EMP-001',
            'designation' => 'Instructor',
        ]);

        $this->studentUser = User::create([
            'school_id' => $this->school->id,
            'name' => 'Student User',
            'email' => 'student@fis.edu',
            'password' => bcrypt('password'),
            'role' => Role::Student->value,
            'is_active' => true,
        ]);
    }

    public function test_admin_can_add_holiday_with_title_and_date(): void
    {
        $payload = [
            'title' => 'Independence Day',
            'date' => '2026-03-26',
            'type' => 'National',
            'description' => 'National holiday commemorating Bangladesh independence',
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/attendance/holidays', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'Independence Day')
            ->assertJsonPath('data.date', '2026-03-26')
            ->assertJsonPath('data.type', 'National');

        $this->assertDatabaseHas('holidays', [
            'school_id' => $this->school->id,
            'title' => 'Independence Day',
            'date' => '2026-03-26',
        ]);
    }

    public function test_admin_can_add_multi_day_holiday_range(): void
    {
        $payload = [
            'title' => 'Eid-ul-Fitr Vacation',
            'date' => '2026-03-19',
            'end_date' => '2026-03-24',
            'type' => 'Religious',
            'description' => 'Extended vacation for Eid celebration',
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/attendance/holidays', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'Eid-ul-Fitr Vacation')
            ->assertJsonPath('data.end_date', '2026-03-24');

        $this->assertDatabaseHas('holidays', [
            'school_id' => $this->school->id,
            'title' => 'Eid-ul-Fitr Vacation',
            'date' => '2026-03-19',
            'end_date' => '2026-03-24',
        ]);
    }

    public function test_teacher_or_student_cannot_add_or_modify_holidays(): void
    {
        $payload = [
            'title' => 'Unauthorized Holiday',
            'date' => '2026-05-01',
        ];

        // Teacher attempt to add holiday
        $resTeacher = $this->actingAs($this->teacherUser, 'sanctum')
            ->postJson('/api/attendance/holidays', $payload);

        $resTeacher->assertStatus(403);

        // Student attempt to add holiday
        $resStudent = $this->actingAs($this->studentUser, 'sanctum')
            ->postJson('/api/attendance/holidays', $payload);

        $resStudent->assertStatus(403);
    }

    public function test_authenticated_users_can_list_and_filter_holidays(): void
    {
        Holiday::create([
            'school_id' => $this->school->id,
            'title' => 'Spring Break',
            'date' => '2026-04-10',
            'type' => 'Academic',
        ]);

        Holiday::create([
            'school_id' => $this->school->id,
            'title' => 'Winter Vacation',
            'date' => '2026-12-25',
            'end_date' => '2026-12-31',
            'type' => 'Academic',
        ]);

        // Teacher can list holidays
        $response = $this->actingAs($this->teacherUser, 'sanctum')
            ->getJson('/api/attendance/holidays?year=2026');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');

        // Filter by month
        $resMonth = $this->actingAs($this->studentUser, 'sanctum')
            ->getJson('/api/attendance/holidays?year=2026&month=4');

        $resMonth->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Spring Break');
    }

    public function test_check_date_endpoint_accurately_detects_holidays(): void
    {
        Holiday::create([
            'school_id' => $this->school->id,
            'title' => 'Victory Day',
            'date' => '2026-12-16',
            'type' => 'National',
        ]);

        Holiday::create([
            'school_id' => $this->school->id,
            'title' => 'Eid Vacation',
            'date' => '2026-03-20',
            'end_date' => '2026-03-25',
            'type' => 'Religious',
        ]);

        // Exact date check
        $res1 = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/attendance/holidays/check?date=2026-12-16');

        $res1->assertStatus(200)
            ->assertJsonPath('is_holiday', true)
            ->assertJsonPath('holiday.title', 'Victory Day');

        // Middle of date range check
        $res2 = $this->actingAs($this->teacherUser, 'sanctum')
            ->getJson('/api/attendance/holidays/check?date=2026-03-22');

        $res2->assertStatus(200)
            ->assertJsonPath('is_holiday', true)
            ->assertJsonPath('holiday.title', 'Eid Vacation');

        // Non-holiday check
        $res3 = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/attendance/holidays/check?date=2026-07-15');

        $res3->assertStatus(200)
            ->assertJsonPath('is_holiday', false)
            ->assertJsonPath('holiday', null);
    }

    public function test_admin_can_update_and_delete_holiday(): void
    {
        $holiday = Holiday::create([
            'school_id' => $this->school->id,
            'title' => 'Original Title',
            'date' => '2026-09-01',
            'type' => 'General',
        ]);

        // Update
        $updateRes = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/attendance/holidays/{$holiday->id}", [
                'title' => 'Updated Title',
                'type' => 'Special',
            ]);

        $updateRes->assertStatus(200)
            ->assertJsonPath('data.title', 'Updated Title')
            ->assertJsonPath('data.type', 'Special');

        // Delete
        $deleteRes = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/attendance/holidays/{$holiday->id}");

        $deleteRes->assertStatus(200);
        $this->assertDatabaseMissing('holidays', ['id' => $holiday->id]);
    }

    public function test_tenant_isolation_prevents_cross_school_access(): void
    {
        $otherSchool = School::create([
            'name' => 'Other Academy',
            'code' => 'OA-002',
            'is_active' => true,
        ]);

        $otherAdmin = User::create([
            'school_id' => $otherSchool->id,
            'name' => 'Other Admin',
            'email' => 'admin@other.edu',
            'password' => bcrypt('password'),
            'role' => Role::Admin->value,
            'is_active' => true,
        ]);

        $otherHoliday = Holiday::create([
            'school_id' => $otherSchool->id,
            'title' => 'Other School Holiday',
            'date' => '2026-05-15',
        ]);

        // Admin of first school cannot update or delete other school's holiday
        $res = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/attendance/holidays/{$otherHoliday->id}", [
                'title' => 'Hijacked Title',
            ]);

        $res->assertStatus(403);

        // First school listing does not leak other school's holiday
        $listRes = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/attendance/holidays');

        $listRes->assertStatus(200)
            ->assertJsonMissing(['title' => 'Other School Holiday']);
    }

    public function test_attendance_stats_endpoint_includes_holiday_status(): void
    {
        $classLevel = ClassLevel::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->year->id,
            'name' => 'Grade 8',
            'numeric_value' => 8,
        ]);

        $section = Section::create([
            'school_id' => $this->school->id,
            'class_level_id' => $classLevel->id,
            'name' => 'A',
            'capacity' => 40,
        ]);

        Holiday::create([
            'school_id' => $this->school->id,
            'title' => 'Special Holiday',
            'date' => '2026-11-20',
            'type' => 'Custom',
        ]);

        $res = $this->actingAs($this->teacherUser, 'sanctum')
            ->getJson("/api/attendances/stats?section_id={$section->id}&date=2026-11-20");

        $res->assertStatus(200)
            ->assertJsonPath('is_holiday', true)
            ->assertJsonPath('holiday.title', 'Special Holiday');
    }
}
