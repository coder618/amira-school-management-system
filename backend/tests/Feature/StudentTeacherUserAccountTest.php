<?php

namespace Tests\Feature;

use App\Modules\Academic\Models\ClassLevel;
use App\Modules\Academic\Models\Section;
use App\Modules\Academic\Models\Shift;
use App\Modules\Academic\Models\Student;
use App\Modules\Core\Enums\Role;
use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use App\Modules\Core\Models\User;
use App\Modules\HR\Models\Teacher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentTeacherUserAccountTest extends TestCase
{
    use RefreshDatabase;

    protected School $school;
    protected User $adminUser;
    protected AcademicYear $year;
    protected ClassLevel $classLevel;
    protected Section $section;
    protected Shift $shift;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = School::create([
            'name' => 'Dhaka Ideal School',
            'code' => 'DIS-101',
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

        $this->adminUser = User::create([
            'school_id' => $this->school->id,
            'name' => 'Headmaster Admin',
            'email' => 'admin@school.com',
            'password' => bcrypt('password'),
            'role' => Role::Admin->value,
            'is_active' => true,
        ]);

        $this->classLevel = ClassLevel::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->year->id,
            'name' => 'Class 9',
            'numeric_value' => 9,
        ]);

        $this->section = Section::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->year->id,
            'class_level_id' => $this->classLevel->id,
            'name' => 'Padma',
            'capacity' => 45,
        ]);

        $this->shift = Shift::create([
            'school_id' => $this->school->id,
            'name' => 'Day Shift',
            'is_active' => true,
        ]);
    }

    public function test_enrolling_student_creates_user_with_student_role(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/students', [
                'class_level_id' => $this->classLevel->id,
                'section_id' => $this->section->id,
                'shift_id' => $this->shift->id,
                'student_id' => 'STU-TEST-999',
                'roll_number' => 15,
                'first_name' => 'Kamrul',
                'last_name' => 'Hasan',
                'father_name' => 'Abul Hasan',
                'mother_name' => 'Rasheda Begum',
                'phone_number' => '01711223344',
                'email' => 'kamrul.hasan@test.com',
                'gender' => 'Male',
                'status' => 'active',
            ]);

        $response->assertStatus(201);
        $studentData = $response->json('data');

        $this->assertNotNull($studentData['user_id']);
        $this->assertEquals('kamrul.hasan@test.com', $studentData['email']);

        // Check user record in database
        $user = User::find($studentData['user_id']);
        $this->assertNotNull($user);
        $this->assertEquals('Kamrul Hasan', $user->name);
        $this->assertEquals('kamrul.hasan@test.com', $user->email);
        $this->assertEquals(Role::Student->value, $user->role);
        $this->assertEquals($this->school->id, $user->school_id);
    }

    public function test_enrolling_student_without_email_auto_generates_student_email_and_user(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/students', [
                'class_level_id' => $this->classLevel->id,
                'section_id' => $this->section->id,
                'shift_id' => $this->shift->id,
                'student_id' => 'STU-2026-7788',
                'roll_number' => 20,
                'first_name' => 'Nabila',
                'last_name' => 'Sultana',
                'father_name' => 'Nurul Islam',
                'mother_name' => 'Fatema Begum',
                'phone_number' => '01811223344',
                'gender' => 'Female',
                'status' => 'active',
            ]);

        $response->assertStatus(201);
        $studentData = $response->json('data');

        $this->assertNotNull($studentData['user_id']);
        $this->assertStringContainsString('stu20267788', $studentData['email']);

        $user = User::find($studentData['user_id']);
        $this->assertEquals(Role::Student->value, $user->role);
    }

    public function test_recruiting_teacher_creates_user_with_teacher_role(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/teachers', [
                'name' => 'Md. Rafiqul Islam',
                'email' => 'rafiqul.math@school.edu.bd',
                'employee_id' => 'EMP-777',
                'designation' => 'Senior Mathematics Teacher',
                'department' => 'Science',
                'qualification' => 'M.Sc (DU)',
                'phone_number' => '01799887766',
            ]);

        $response->assertStatus(201);
        $teacherData = $response->json('data');

        $this->assertNotNull($teacherData['user_id']);
        $user = User::find($teacherData['user_id']);
        $this->assertNotNull($user);
        $this->assertEquals('Md. Rafiqul Islam', $user->name);
        $this->assertEquals(Role::Teacher->value, $user->role);
        $this->assertEquals($this->school->id, $user->school_id);
    }

    public function test_deleting_student_removes_student_user(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/students', [
                'class_level_id' => $this->classLevel->id,
                'section_id' => $this->section->id,
                'shift_id' => $this->shift->id,
                'student_id' => 'STU-DELETE-ME',
                'roll_number' => 30,
                'first_name' => 'Temporary',
                'last_name' => 'Student',
                'father_name' => 'Temp Father',
                'mother_name' => 'Temp Mother',
                'phone_number' => '01755443322',
                'gender' => 'Male',
                'status' => 'active',
            ]);

        $studentId = $response->json('data.id');
        $userId = $response->json('data.user_id');

        $this->assertDatabaseHas('students', ['id' => $studentId]);
        $this->assertDatabaseHas('users', ['id' => $userId]);

        // Delete student
        $delResponse = $this->actingAs($this->adminUser, 'sanctum')
            ->deleteJson("/api/students/{$studentId}");
        $delResponse->assertStatus(200);

        $this->assertDatabaseMissing('students', ['id' => $studentId]);
        $this->assertDatabaseMissing('users', ['id' => $userId]);
    }
}

