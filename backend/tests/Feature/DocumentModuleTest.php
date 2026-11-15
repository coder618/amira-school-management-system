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
use App\Modules\Documents\Models\Document;
use App\Modules\Media\Models\Media;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DocumentModuleTest extends TestCase
{
    use RefreshDatabase;

    protected School $school;
    protected School $otherSchool;
    protected AcademicYear $academicYear;
    protected User $adminUser;
    protected User $otherSchoolAdmin;
    protected User $studentUser;
    protected Student $student;

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
            'name' => 'Lab School Admin',
            'email' => 'admin@glhs.edu.bd',
            'password' => bcrypt('password123'),
            'role' => Role::Admin->value,
            'is_active' => true,
        ]);

        $this->otherSchoolAdmin = User::create([
            'school_id' => $this->otherSchool->id,
            'name' => 'Motijheel Admin',
            'email' => 'admin@mgbhs.edu.bd',
            'password' => bcrypt('password123'),
            'role' => Role::Admin->value,
            'is_active' => true,
        ]);

        $this->studentUser = User::create([
            'school_id' => $this->school->id,
            'name' => 'Tahmid Rahman',
            'email' => 'tahmid@glhs.edu.bd',
            'password' => bcrypt('password123'),
            'role' => Role::Student->value,
            'is_active' => true,
        ]);

        $classLevel = ClassLevel::create([
            'school_id' => $this->school->id,
            'name' => 'Class 10',
            'numeric_value' => 10,
        ]);

        $section = Section::create([
            'school_id' => $this->school->id,
            'class_level_id' => $classLevel->id,
            'name' => 'A',
            'capacity' => 45,
        ]);

        $shift = Shift::create([
            'school_id' => $this->school->id,
            'name' => 'Morning',
            'start_time' => '08:00:00',
            'end_time' => '12:30:00',
        ]);

        $this->student = Student::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->academicYear->id,
            'class_level_id' => $classLevel->id,
            'section_id' => $section->id,
            'shift_id' => $shift->id,
            'user_id' => $this->studentUser->id,
            'student_id' => 'STU-2026-001',
            'roll_number' => 1,
            'first_name' => 'Tahmid',
            'last_name' => 'Rahman',
            'father_name' => 'Abdur Rahman',
            'mother_name' => 'Tahmina Begum',
            'email' => 'tahmid@glhs.edu.bd',
            'phone_number' => '01700000001',
            'gender' => 'Male',
            'status' => 'active',
        ]);
    }

    public function test_can_upload_document_pointing_to_user_via_media_module(): void
    {
        Sanctum::actingAs($this->adminUser);

        $fakePdf = UploadedFile::fake()->create('birth_certificate.pdf', 300, 'application/pdf');

        $response = $this->postJson('/api/documents', [
            'title' => 'Tahmid Birth Certificate',
            'document_type' => 'identification',
            'user_id' => $this->studentUser->id,
            'description' => 'Original birth registration certificate verified.',
            'file' => $fakePdf,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'Tahmid Birth Certificate')
            ->assertJsonPath('data.user_id', $this->studentUser->id)
            ->assertJsonPath('data.student_id', $this->student->id)
            ->assertJsonPath('data.document_type', 'identification');

        $documentId = $response->json('data.id');
        $mediaId = $response->json('data.media_id');

        // Check that a record was created in media table
        $this->assertDatabaseHas('media', [
            'id' => $mediaId,
            'school_id' => $this->school->id,
            'collection_name' => 'documents',
            'model_type' => Document::class,
            'model_id' => $documentId,
        ]);

        // Check that a record was created in documents table
        $this->assertDatabaseHas('documents', [
            'id' => $documentId,
            'school_id' => $this->school->id,
            'user_id' => $this->studentUser->id,
            'title' => 'Tahmid Birth Certificate',
            'media_id' => $mediaId,
        ]);

        $media = Media::find($mediaId);
        $this->assertNotNull($media);
        Storage::disk('public')->assertExists($media->file_path);
    }

    public function test_can_upload_document_without_user_optional(): void
    {
        Sanctum::actingAs($this->adminUser);

        $fakeDoc = UploadedFile::fake()->create('annual_academic_calendar.pdf', 150, 'application/pdf');

        $response = $this->postJson('/api/documents', [
            'title' => 'School Academic Calendar 2026',
            'document_type' => 'academic',
            'description' => 'Annual master academic schedule and holiday list',
            'file' => $fakeDoc,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'School Academic Calendar 2026')
            ->assertJsonPath('data.user_id', null)
            ->assertJsonPath('data.student_id', null);

        $documentId = $response->json('data.id');
        $this->assertDatabaseHas('documents', [
            'id' => $documentId,
            'school_id' => $this->school->id,
            'user_id' => null,
            'title' => 'School Academic Calendar 2026',
        ]);
    }

    public function test_can_filter_and_search_documents(): void
    {
        Sanctum::actingAs($this->adminUser);

        // Upload doc 1 for student
        $file1 = UploadedFile::fake()->create('passport.pdf', 100, 'application/pdf');
        $this->postJson('/api/documents', [
            'title' => 'Tahmid Passport Copy',
            'document_type' => 'identification',
            'user_id' => $this->studentUser->id,
            'file' => $file1,
        ]);

        // Upload doc 2 general
        $file2 = UploadedFile::fake()->create('syllabus.pdf', 200, 'application/pdf');
        $this->postJson('/api/documents', [
            'title' => 'General Class 10 Syllabus',
            'document_type' => 'academic',
            'file' => $file2,
        ]);

        // Filter by user_id
        $resUser = $this->getJson("/api/documents?user_id={$this->studentUser->id}");
        $resUser->assertStatus(200);
        $this->assertCount(1, $resUser->json('data'));
        $this->assertEquals('Tahmid Passport Copy', $resUser->json('data.0.title'));

        // Filter by document_type
        $resType = $this->getJson('/api/documents?document_type=academic');
        $resType->assertStatus(200);
        $this->assertCount(1, $resType->json('data'));
        $this->assertEquals('General Class 10 Syllabus', $resType->json('data.0.title'));

        // Search by keyword
        $resSearch = $this->getJson('/api/documents?search=Passport');
        $resSearch->assertStatus(200);
        $this->assertCount(1, $resSearch->json('data'));
    }

    public function test_can_get_documents_stats(): void
    {
        Sanctum::actingAs($this->adminUser);

        $file1 = UploadedFile::fake()->create('doc1.pdf', 100, 'application/pdf');
        $this->postJson('/api/documents', [
            'title' => 'Doc 1',
            'document_type' => 'identification',
            'user_id' => $this->studentUser->id,
            'file' => $file1,
        ]);

        $file2 = UploadedFile::fake()->create('doc2.pdf', 200, 'application/pdf');
        $this->postJson('/api/documents', [
            'title' => 'Doc 2',
            'document_type' => 'medical',
            'file' => $file2,
        ]);

        $res = $this->getJson('/api/documents/stats');
        $res->assertStatus(200)
            ->assertJsonPath('total_documents', 2)
            ->assertJsonPath('user_documents_count', 1)
            ->assertJsonPath('unassigned_documents_count', 1);
    }

    public function test_can_download_document_file(): void
    {
        Sanctum::actingAs($this->adminUser);

        $fakeFile = UploadedFile::fake()->create('transfer_cert.pdf', 120, 'application/pdf');
        $uploadRes = $this->postJson('/api/documents', [
            'title' => 'Transfer Certificate',
            'user_id' => $this->studentUser->id,
            'file' => $fakeFile,
        ]);

        $documentId = $uploadRes->json('data.id');

        $downloadRes = $this->get("/api/documents/{$documentId}/download");
        $downloadRes->assertStatus(200);
        $this->assertTrue(str_contains($downloadRes->headers->get('content-disposition'), 'Transfer_Certificate.pdf'));
    }

    public function test_can_delete_document_and_purges_media(): void
    {
        Sanctum::actingAs($this->adminUser);

        $fakeFile = UploadedFile::fake()->create('temp_doc.pdf', 80, 'application/pdf');
        $uploadRes = $this->postJson('/api/documents', [
            'title' => 'Temporary Document',
            'file' => $fakeFile,
        ]);

        $documentId = $uploadRes->json('data.id');
        $mediaId = $uploadRes->json('data.media_id');
        $media = Media::find($mediaId);

        $this->assertDatabaseHas('documents', ['id' => $documentId]);
        $this->assertDatabaseHas('media', ['id' => $mediaId]);
        Storage::disk('public')->assertExists($media->file_path);

        $delRes = $this->deleteJson("/api/documents/{$documentId}");
        $delRes->assertStatus(200);

        $this->assertDatabaseMissing('documents', ['id' => $documentId]);
        $this->assertDatabaseMissing('media', ['id' => $mediaId]);
        Storage::disk('public')->assertMissing($media->file_path);
    }

    public function test_tenant_isolation_prevents_unauthorized_cross_school_access(): void
    {
        Sanctum::actingAs($this->adminUser);

        $fakeFile = UploadedFile::fake()->create('confidential.pdf', 50, 'application/pdf');
        $uploadRes = $this->postJson('/api/documents', [
            'title' => 'School A Confidential Record',
            'file' => $fakeFile,
        ]);

        $docId = $uploadRes->json('data.id');

        // Switch to other school admin
        Sanctum::actingAs($this->otherSchoolAdmin);

        // Cannot view
        $viewRes = $this->getJson("/api/documents/{$docId}");
        $viewRes->assertStatus(403);

        // Cannot download
        $downloadRes = $this->get("/api/documents/{$docId}/download");
        $downloadRes->assertStatus(403);

        // Cannot delete
        $delRes = $this->deleteJson("/api/documents/{$docId}");
        $delRes->assertStatus(403);
    }
}
