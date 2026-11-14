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
use App\Modules\Media\Models\Media;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MediaAndStudentImageTest extends TestCase
{
    use RefreshDatabase;

    protected School $school;
    protected School $otherSchool;
    protected AcademicYear $academicYear;
    protected User $adminUser;
    protected User $otherSchoolAdmin;
    protected ClassLevel $classLevel;
    protected Section $section;
    protected Shift $shift;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        $this->school = School::create([
            'name' => 'Govt Laboratory High School',
            'code' => 'GLHS',
            'address' => 'Dhanmondi, Dhaka',
            'phone' => '01711111111',
            'is_active' => true,
        ]);

        $this->otherSchool = School::create([
            'name' => 'Motijheel Govt Boys High School',
            'code' => 'MGBHS',
            'address' => 'Motijheel, Dhaka',
            'phone' => '01822222222',
            'is_active' => true,
        ]);

        $this->academicYear = AcademicYear::create([
            'school_id' => $this->school->id,
            'title' => '2026',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'is_current' => true,
        ]);

        $this->adminUser = User::create([
            'school_id' => $this->school->id,
            'name' => 'Principal Kabir',
            'email' => 'principal@glhs.edu.bd',
            'password' => bcrypt('secret123'),
            'role' => Role::Admin->value,
            'phone_number' => '01700000001',
            'is_active' => true,
        ]);

        $this->otherSchoolAdmin = User::create([
            'school_id' => $this->otherSchool->id,
            'name' => 'Principal Motijheel',
            'email' => 'admin@motijheel.edu.bd',
            'password' => bcrypt('secret123'),
            'role' => Role::Admin->value,
            'phone_number' => '01800000002',
            'is_active' => true,
        ]);

        $this->classLevel = ClassLevel::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->academicYear->id,
            'name' => 'Class 9',
            'numeric_value' => 9,
        ]);

        $this->section = Section::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->academicYear->id,
            'class_level_id' => $this->classLevel->id,
            'name' => 'Padma',
            'capacity' => 40,
        ]);

        $this->shift = Shift::create([
            'school_id' => $this->school->id,
            'name' => 'Morning',
            'is_active' => true,
        ]);
    }

    public function test_tenant_can_upload_media_scoped_to_school(): void
    {
        Sanctum::actingAs($this->adminUser);

        $file = UploadedFile::fake()->image('student_avatar.jpg', 300, 300);

        $response = $this->withHeader('X-School-Id', (string) $this->school->id)
            ->post('/api/media/upload', [
                'file' => $file,
                'collection_name' => 'student_images',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => ['id', 'school_id', 'collection_name', 'file_name', 'file_path', 'url'],
            ]);

        $mediaId = $response->json('data.id');
        $filePath = $response->json('data.file_path');

        $this->assertStringStartsWith("tenants/{$this->school->id}/student_images/", $filePath);
        Storage::disk('public')->assertExists($filePath);

        $media = Media::find($mediaId);
        $this->assertEquals($this->school->id, $media->school_id);
    }

    public function test_tenant_cannot_delete_another_tenant_media(): void
    {
        Sanctum::actingAs($this->adminUser);

        $file = UploadedFile::fake()->image('other_school.jpg');
        $uploadRes = $this->withHeader('X-School-Id', (string) $this->school->id)
            ->post('/api/media/upload', ['file' => $file]);
        $mediaId = $uploadRes->json('data.id');

        // Switch to other school admin
        Sanctum::actingAs($this->otherSchoolAdmin);
        $deleteRes = $this->withHeader('X-School-Id', (string) $this->otherSchool->id)
            ->delete("/api/media/{$mediaId}");

        $deleteRes->assertStatus(403);
    }

    public function test_student_enrollment_with_uploaded_images_and_parents(): void
    {
        Sanctum::actingAs($this->adminUser);

        $studentImg = UploadedFile::fake()->image('student.png', 400, 400);
        $parentImg = UploadedFile::fake()->image('parent.jpg', 400, 400);

        $response = $this->withHeaders([
            'X-School-Id' => (string) $this->school->id,
            'X-Academic-Year-Id' => (string) $this->academicYear->id,
        ])->post('/api/students', [
            'class_level_id' => $this->classLevel->id,
            'section_id' => $this->section->id,
            'shift_id' => $this->shift->id,
            'student_id' => 'STU-2026-9001',
            'roll_number' => 1,
            'first_name' => 'Naimur',
            'last_name' => 'Rahman',
            'father_name' => 'Mustafizur Rahman',
            'mother_name' => 'Nasima Akter',
            'phone_number' => '01712345678',
            'gender' => 'Male',
            'status' => 'active',
            'student_image' => $studentImg,
            'parent_image' => $parentImg,
        ]);

        $response->assertStatus(201);
        $studentData = $response->json('data');

        $this->assertNotEmpty($studentData['student_image']);
        $this->assertNotEmpty($studentData['parent_image']);
        $this->assertNotEmpty($studentData['student_image_url']);
        $this->assertNotEmpty($studentData['parent_image_url']);

        Storage::disk('public')->assertExists($studentData['student_image']);
        Storage::disk('public')->assertExists($studentData['parent_image']);

        // Check user account created with student avatar
        $student = Student::where('student_id', 'STU-2026-9001')->first();
        $this->assertNotNull($student);
        $this->assertNotNull($student->user);
        $this->assertEquals($student->student_image, $student->user->profile_picture);
    }
}
