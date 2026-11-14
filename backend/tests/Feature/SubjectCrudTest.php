<?php

namespace Tests\Feature;

use App\Modules\Academic\Models\ClassLevel;
use App\Modules\Academic\Models\Subject;
use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use App\Modules\Core\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubjectCrudTest extends TestCase
{
    use RefreshDatabase;

    protected School $schoolA;
    protected School $schoolB;
    protected AcademicYear $yearA;
    protected AcademicYear $yearB;
    protected User $adminA;
    protected ClassLevel $classA;
    protected ClassLevel $classB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->schoolA = School::create([
            'name' => 'Dhaka Ideal School',
            'code' => 'DIS-01',
            'email' => 'admin@dis.edu.bd',
            'is_active' => true,
        ]);

        $this->yearA = AcademicYear::create([
            'school_id' => $this->schoolA->id,
            'year' => 2026,
            'title' => 'Academic Year 2026',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'is_current' => true,
        ]);

        $this->adminA = User::create([
            'school_id' => $this->schoolA->id,
            'name' => 'Headmaster A',
            'email' => 'headmaster@dis.edu.bd',
            'password' => bcrypt('password'),
            'role' => 'Principal',
        ]);

        $this->classA = ClassLevel::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'name' => 'Class 9',
            'numeric_value' => 9,
            'code' => 'C9',
        ]);

        // School B (Tenant 2)
        $this->schoolB = School::create([
            'name' => 'Chittagong Collegiate School',
            'code' => 'CCS-02',
            'email' => 'admin@ccs.edu.bd',
            'is_active' => true,
        ]);

        $this->yearB = AcademicYear::create([
            'school_id' => $this->schoolB->id,
            'year' => 2026,
            'title' => 'Academic Year 2026',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'is_current' => true,
        ]);

        $this->classB = ClassLevel::create([
            'school_id' => $this->schoolB->id,
            'academic_year_id' => $this->yearB->id,
            'name' => 'Class 9 (CCS)',
            'numeric_value' => 9,
            'code' => 'C9B',
        ]);
    }

    public function test_can_list_and_create_subjects_scoped_to_tenant(): void
    {
        $response = $this->actingAs($this->adminA)
            ->withHeaders(['X-School-Id' => $this->schoolA->id])
            ->postJson('/api/subjects', [
                'class_level_id' => $this->classA->id,
                'name' => 'General Science',
                'code' => 'SCI-101',
                'full_mark' => 100,
                'pass_mark' => 33,
                'is_optional' => false,
                'can_be_4th_subject' => false,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('name', 'General Science')
            ->assertJsonPath('school_id', $this->schoolA->id);

        $this->assertDatabaseHas('subjects', [
            'name' => 'General Science',
            'school_id' => $this->schoolA->id,
            'class_level_id' => $this->classA->id,
        ]);

        // Verify index only returns tenant's subjects
        $listResponse = $this->actingAs($this->adminA)
            ->withHeaders(['X-School-Id' => $this->schoolA->id])
            ->getJson('/api/subjects');

        $listResponse->assertOk()
            ->assertJsonCount(1);
    }

    public function test_can_update_and_delete_subject(): void
    {
        $subject = Subject::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'class_level_id' => $this->classA->id,
            'name' => 'Higher Math',
            'code' => 'HM-126',
            'full_mark' => 100,
            'pass_mark' => 33,
            'is_optional' => true,
            'can_be_4th_subject' => true,
        ]);

        // Update
        $updateResponse = $this->actingAs($this->adminA)
            ->withHeaders(['X-School-Id' => $this->schoolA->id])
            ->putJson("/api/subjects/{$subject->id}", [
                'name' => 'Higher Mathematics',
                'full_mark' => 100,
            ]);

        $updateResponse->assertOk()
            ->assertJsonPath('name', 'Higher Mathematics');

        // Delete
        $deleteResponse = $this->actingAs($this->adminA)
            ->withHeaders(['X-School-Id' => $this->schoolA->id])
            ->deleteJson("/api/subjects/{$subject->id}");

        $deleteResponse->assertOk();
        $this->assertDatabaseMissing('subjects', ['id' => $subject->id]);
    }

    public function test_cannot_access_or_modify_other_tenant_subject(): void
    {
        $subjectB = Subject::create([
            'school_id' => $this->schoolB->id,
            'academic_year_id' => $this->yearB->id,
            'class_level_id' => $this->classB->id,
            'name' => 'Physics B',
            'code' => 'PHY-101',
            'full_mark' => 100,
            'pass_mark' => 33,
        ]);

        $response = $this->actingAs($this->adminA)
            ->withHeaders(['X-School-Id' => $this->schoolA->id])
            ->putJson("/api/subjects/{$subjectB->id}", [
                'name' => 'Hacked Physics',
            ]);

        $response->assertStatus(403);
    }
}
