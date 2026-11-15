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
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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

    public function test_recruiting_teacher_with_profile_picture_saves_media_and_picture_url(): void
    {
        Storage::fake('public');

        $image = UploadedFile::fake()->image('teacher_avatar.jpg', 300, 300);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->post('/api/teachers', [
                'name' => 'Nusrat Jahan',
                'email' => 'nusrat.jahan@school.edu.bd',
                'employee_id' => 'EMP-888',
                'designation' => 'Assistant Teacher (English)',
                'department' => 'Language',
                'qualification' => 'M.A in English (DU)',
                'phone_number' => '01811223399',
                'profile_picture' => $image,
            ]);

        $response->assertStatus(201);
        $teacherData = $response->json('data');

        $user = User::find($teacherData['user_id']);
        $this->assertNotNull($user->profile_picture);
        $this->assertNotNull($user->profile_picture_url);
        Storage::disk('public')->assertExists($user->profile_picture);
    }

    public function test_non_admin_cannot_perform_teacher_crud(): void
    {
        $teacherUser = User::create([
            'school_id' => $this->school->id,
            'name' => 'Regular Teacher',
            'email' => 'regular.teacher@school.edu.bd',
            'password' => 'password123',
            'role' => Role::Teacher->value,
            'is_active' => true,
        ]);

        $teacher = Teacher::create([
            'school_id' => $this->school->id,
            'user_id' => $teacherUser->id,
            'employee_id' => 'EMP-T1',
            'designation' => 'Assistant Teacher',
            'department' => 'Science',
        ]);

        // Attempt Create as Teacher -> 403
        $this->actingAs($teacherUser, 'sanctum')
            ->postJson('/api/teachers', [
                'name' => 'Illegal Faculty',
                'email' => 'illegal@school.edu.bd',
                'employee_id' => 'EMP-999',
                'designation' => 'Assistant Teacher',
            ])
            ->assertStatus(403);

        // Attempt Update as Teacher -> 403
        $this->actingAs($teacherUser, 'sanctum')
            ->putJson("/api/teachers/{$teacher->id}", [
                'name' => 'Hacked Name',
            ])
            ->assertStatus(403);

        // Attempt Delete as Teacher -> 403
        $this->actingAs($teacherUser, 'sanctum')
            ->deleteJson("/api/teachers/{$teacher->id}")
            ->assertStatus(403);
    }

    public function test_admin_can_update_teacher(): void
    {
        $teacherUser = User::create([
            'school_id' => $this->school->id,
            'name' => 'Original Name',
            'email' => 'orig.teacher@school.edu.bd',
            'password' => 'password123',
            'role' => Role::Teacher->value,
            'is_active' => true,
        ]);

        $teacher = Teacher::create([
            'school_id' => $this->school->id,
            'user_id' => $teacherUser->id,
            'employee_id' => 'EMP-ORIG',
            'designation' => 'Assistant Teacher',
            'department' => 'Science',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/teachers/{$teacher->id}", [
                'name' => 'Updated Faculty Name',
                'designation' => 'Head of Science',
                'department' => 'Science',
                'qualification' => 'Ph.D in Physics',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('Updated Faculty Name', $teacher->fresh()->user->name);
        $this->assertEquals('Head of Science', $teacher->fresh()->designation);
        $this->assertEquals('Ph.D in Physics', $teacher->fresh()->qualification);
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

