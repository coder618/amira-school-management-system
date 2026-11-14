<?php

namespace Tests\Feature;

use App\Modules\Core\Enums\Role;
use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use App\Modules\Core\Models\User;
use App\Modules\SchoolClass\Models\ClassLevel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClassLevelTest extends TestCase
{
    use RefreshDatabase;

    protected School $school;
    protected User $user;
    protected AcademicYear $year;

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

        $this->user = User::create([
            'school_id' => $this->school->id,
            'name' => 'Headmaster Admin',
            'email' => 'admin@school.com',
            'password' => bcrypt('password'),
            'role' => Role::Admin->value,
            'is_active' => true,
        ]);
    }

    public function test_tenant_can_list_their_classes(): void
    {
        ClassLevel::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->year->id,
            'name' => 'Class 6',
            'numeric_value' => 6,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/class-levels');

        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['name' => 'Class 6']);
    }

    public function test_cannot_create_duplicate_class_name_in_same_school(): void
    {
        ClassLevel::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->year->id,
            'name' => 'Class 6',
            'numeric_value' => 6,
        ]);

        // Attempt duplicate in same school
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/class-levels', [
                'name' => 'Class 6',
                'numeric_value' => 6,
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_different_schools_can_have_same_class_name(): void
    {
        // School 1 has Class 6
        ClassLevel::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->year->id,
            'name' => 'Class 6',
            'numeric_value' => 6,
        ]);

        // School 2
        $school2 = School::create([
            'name' => 'Chittagong High School',
            'code' => 'CHS-102',
            'board' => 'Chittagong',
            'is_active' => true,
        ]);
        $year2 = AcademicYear::create([
            'school_id' => $school2->id,
            'title' => '2026-2027',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'is_current' => true,
        ]);
        $user2 = User::create([
            'school_id' => $school2->id,
            'name' => 'Headmaster 2',
            'email' => 'admin2@school.com',
            'password' => bcrypt('password'),
            'role' => Role::Admin->value,
            'is_active' => true,
        ]);

        // School 2 should successfully create Class 6 (isolated per tenant)
        $response = $this->actingAs($user2, 'sanctum')
            ->postJson('/api/class-levels', [
                'name' => 'Class 6',
                'numeric_value' => 6,
            ]);

        $response->assertStatus(201);
        $this->assertEquals($school2->id, $response->json('school_id'));
    }

    public function test_can_create_edit_and_delete_class_level(): void
    {
        // Create
        $createRes = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/class-levels', [
                'name' => 'Class 11',
                'numeric_value' => 11,
                'code' => 'C11',
            ]);

        $createRes->assertStatus(201);
        $classId = $createRes->json('id');
        $this->assertEquals($this->school->id, $createRes->json('school_id'));

        // Update
        $updateRes = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/class-levels/{$classId}", [
                'name' => 'Class 11 (Science)',
                'numeric_value' => 11,
                'code' => 'C11-SCI',
            ]);
        $updateRes->assertStatus(200);
        $this->assertEquals('Class 11 (Science)', $updateRes->json('name'));

        // Delete
        $deleteRes = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/class-levels/{$classId}");
        $deleteRes->assertStatus(200);
    }
}

