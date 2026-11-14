<?php

namespace Tests\Feature;

use App\Modules\Academic\Models\ClassLevel;
use App\Modules\Academic\Models\Section;
use App\Modules\Academic\Models\Student;
use App\Modules\Core\Enums\Role;
use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use App\Modules\Core\Models\User;
use App\Modules\Academic\Models\Subject;
use App\Modules\SchoolExamResults\Models\ExamResult;
use App\Modules\SchoolExams\Models\Exam;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SchoolExamsAndResultsTest extends TestCase
{
    use RefreshDatabase;

    protected School $schoolA;
    protected School $schoolB;
    protected User $adminA;
    protected User $adminB;
    protected AcademicYear $yearA;
    protected AcademicYear $yearB;
    protected ClassLevel $classA;
    protected Section $sectionA;
    protected Subject $mathA;
    protected Subject $bioA;
    protected Student $studentA;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup Tenant School A
        $this->schoolA = School::create([
            'name' => 'Motijheel Ideal School & College',
            'code' => 'MISC-01',
            'board' => 'Dhaka',
            'is_active' => true,
        ]);

        $this->yearA = AcademicYear::create([
            'school_id' => $this->schoolA->id,
            'title' => '2026-2027',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'is_current' => true,
        ]);

        $this->adminA = User::create([
            'school_id' => $this->schoolA->id,
            'name' => 'Admin School A',
            'email' => 'admin.a@school.com',
            'password' => bcrypt('password'),
            'role' => Role::Admin->value,
            'is_active' => true,
        ]);

        $this->classA = ClassLevel::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'name' => 'Class 10',
            'numeric_value' => 10,
        ]);

        $this->sectionA = Section::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'class_level_id' => $this->classA->id,
            'name' => 'Section A (Padma)',
            'capacity' => 50,
        ]);

        $this->studentA = Student::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'class_level_id' => $this->classA->id,
            'section_id' => $this->sectionA->id,
            'student_id' => 'STU-MISC-001',
            'roll_number' => 1,
            'first_name' => 'Tanvir',
            'last_name' => 'Ahmed',
            'father_name' => 'Rafiq Ahmed',
            'mother_name' => 'Nasima Begum',
            'gender' => 'Male',
            'phone_number' => '01711223344',
            'status' => 'active',
            'enrollment_date' => '2026-01-01',
        ]);

        $this->mathA = Subject::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'class_level_id' => $this->classA->id,
            'name' => 'General Mathematics',
            'code' => 'MATH-109',
            'full_mark' => 100,
            'pass_mark' => 33,
            'is_optional' => false,
            'can_be_4th_subject' => false,
        ]);

        $this->bioA = Subject::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'class_level_id' => $this->classA->id,
            'name' => 'Higher Biology',
            'code' => 'BIO-138',
            'full_mark' => 100,
            'pass_mark' => 33,
            'is_optional' => true,
            'can_be_4th_subject' => true,
        ]);

        // Setup Tenant School B
        $this->schoolB = School::create([
            'name' => 'Chittagong Collegiate School',
            'code' => 'CCS-02',
            'board' => 'Chittagong',
            'is_active' => true,
        ]);

        $this->yearB = AcademicYear::create([
            'school_id' => $this->schoolB->id,
            'title' => '2026-2027',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'is_current' => true,
        ]);

        $this->adminB = User::create([
            'school_id' => $this->schoolB->id,
            'name' => 'Admin School B',
            'email' => 'admin.b@school.com',
            'password' => bcrypt('password'),
            'role' => Role::Admin->value,
            'is_active' => true,
        ]);
    }

    // ==========================================
    // SchoolExams Module Tests
    // ==========================================

    public function test_tenant_can_create_and_list_their_exams(): void
    {
        $response = $this->actingAs($this->adminA, 'sanctum')
            ->postJson('/api/school-exams', [
                'name' => 'Half-Yearly Examination 2026',
                'term' => 'Half-Yearly',
                'start_date' => '2026-06-01',
                'end_date' => '2026-06-15',
                'is_published' => false,
            ]);

        $response->assertStatus(201);
        $response->assertJsonFragment([
            'name' => 'Half-Yearly Examination 2026',
            'school_id' => $this->schoolA->id,
        ]);

        $listResponse = $this->actingAs($this->adminA, 'sanctum')
            ->getJson('/api/school-exams');

        $listResponse->assertStatus(200);
        $listResponse->assertJsonCount(1);
    }

    public function test_cannot_create_duplicate_exam_name_in_same_tenant_school(): void
    {
        Exam::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'name' => 'Annual Examination 2026',
            'term' => 'Annual',
        ]);

        $response = $this->actingAs($this->adminA, 'sanctum')
            ->postJson('/api/school-exams', [
                'name' => 'Annual Examination 2026',
                'term' => 'Annual',
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_different_schools_can_have_same_exam_name(): void
    {
        Exam::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'name' => 'Annual Examination 2026',
            'term' => 'Annual',
        ]);

        $response = $this->actingAs($this->adminB, 'sanctum')
            ->postJson('/api/school-exams', [
                'name' => 'Annual Examination 2026',
                'term' => 'Annual',
            ]);

        $response->assertStatus(201);
        $response->assertJsonFragment([
            'name' => 'Annual Examination 2026',
            'school_id' => $this->schoolB->id,
        ]);
    }

    public function test_tenant_cannot_view_or_modify_other_tenant_exam(): void
    {
        $examA = Exam::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'name' => 'Pre-Test Examination 2026',
            'term' => 'Pre-Test',
        ]);

        // School B tries to view School A's exam -> 403
        $showResponse = $this->actingAs($this->adminB, 'sanctum')
            ->getJson("/api/school-exams/{$examA->id}");
        $showResponse->assertStatus(403);

        // School B tries to update School A's exam -> 403
        $updateResponse = $this->actingAs($this->adminB, 'sanctum')
            ->putJson("/api/school-exams/{$examA->id}", [
                'name' => 'Hacked Exam',
                'term' => 'Hacked',
            ]);
        $updateResponse->assertStatus(403);

        // School B tries to delete School A's exam -> 403
        $deleteResponse = $this->actingAs($this->adminB, 'sanctum')
            ->deleteJson("/api/school-exams/{$examA->id}");
        $deleteResponse->assertStatus(403);
    }

    public function test_tenant_can_toggle_publish_status(): void
    {
        $exam = Exam::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'name' => 'First Term Exam',
            'term' => 'Term 1',
            'is_published' => false,
        ]);

        $response = $this->actingAs($this->adminA, 'sanctum')
            ->patchJson("/api/school-exams/{$exam->id}/publish");

        $response->assertStatus(200);
        $response->assertJsonFragment(['is_published' => true]);
        $this->assertTrue($exam->fresh()->is_published);
    }

    // ==========================================
    // SchoolExamResults Module Tests
    // ==========================================

    public function test_tenant_can_store_and_calculate_exam_result(): void
    {
        $exam = Exam::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'name' => 'Annual Exam 2026',
            'term' => 'Annual',
        ]);

        // Student gets 50 (CQ) + 25 (MCQ) + 10 (Practical) = 85 (A+, GPA 5.00)
        $response = $this->actingAs($this->adminA, 'sanctum')
            ->postJson('/api/school-exam-results', [
                'exam_id' => $exam->id,
                'subject_id' => $this->mathA->id,
                'student_id' => $this->studentA->id,
                'subjective_mark' => 50,
                'objective_mark' => 25,
                'practical_mark' => 10,
                'is_4th_subject' => false,
            ]);

        $response->assertStatus(201);
        $response->assertJsonFragment([
            'total_mark' => '85.00',
            'gpa' => '5.00',
            'grade' => 'A+',
        ]);
    }

    public function test_tenant_can_bulk_store_marks(): void
    {
        $exam = Exam::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'name' => 'Final Exam 2026',
            'term' => 'Final',
        ]);

        $response = $this->actingAs($this->adminA, 'sanctum')
            ->postJson('/api/school-exam-results/bulk', [
                'exam_id' => $exam->id,
                'subject_id' => $this->mathA->id,
                'marks' => [
                    [
                        'student_id' => $this->studentA->id,
                        'subjective_mark' => 45,
                        'objective_mark' => 20,
                        'practical_mark' => 0,
                        'is_4th_subject' => false,
                    ],
                ],
            ]);

        $response->assertStatus(201);
        $response->assertJsonFragment(['count' => 1]);

        $this->assertDatabaseHas('exam_marks', [
            'school_id' => $this->schoolA->id,
            'student_id' => $this->studentA->id,
            'total_mark' => 65.00,
            'grade' => 'A-',
            'gpa' => 3.50,
        ]);
    }

    public function test_tenant_cannot_record_marks_for_other_tenant_student_or_exam(): void
    {
        $examB = Exam::create([
            'school_id' => $this->schoolB->id,
            'academic_year_id' => $this->yearB->id,
            'name' => 'School B Exam',
            'term' => 'Final',
        ]);

        // Admin A attempts to store mark using School B's exam
        $response = $this->actingAs($this->adminA, 'sanctum')
            ->postJson('/api/school-exam-results', [
                'exam_id' => $examB->id,
                'subject_id' => $this->mathA->id,
                'student_id' => $this->studentA->id,
                'subjective_mark' => 40,
                'objective_mark' => 20,
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['exam_id']);
    }

    public function test_report_card_calculates_bangladesh_gpa_with_4th_subject(): void
    {
        $exam = Exam::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'name' => 'Model Test 2026',
            'term' => 'Annual',
        ]);

        // Main Subject: Math (Total 75 -> A, GPA 4.00)
        ExamResult::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'student_id' => $this->studentA->id,
            'exam_id' => $exam->id,
            'subject_id' => $this->mathA->id,
            'subjective_mark' => 50,
            'objective_mark' => 25,
            'practical_mark' => 0,
            'total_mark' => 75,
            'is_4th_subject' => false,
            'gpa' => 4.00,
            'grade' => 'A',
        ]);

        // 4th Subject: Biology (Total 85 -> A+, GPA 5.00). 4th subject bonus = 5.00 - 2.00 = 3.00
        // Main points = 4.00. Bonus = 3.00. Total = 7.00 / 1 main subject = 7.00 -> capped at 5.00 (A+)
        ExamResult::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'student_id' => $this->studentA->id,
            'exam_id' => $exam->id,
            'subject_id' => $this->bioA->id,
            'subjective_mark' => 50,
            'objective_mark' => 20,
            'practical_mark' => 15,
            'total_mark' => 85,
            'is_4th_subject' => true,
            'gpa' => 5.00,
            'grade' => 'A+',
        ]);

        $response = $this->actingAs($this->adminA, 'sanctum')
            ->getJson("/api/school-exam-results/report-card/{$this->studentA->id}/exam/{$exam->id}");

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'final_gpa' => 5,
            'final_grade' => 'A+',
            'passed' => true,
            'fourth_subject_bonus' => 3,
            'total_marks_obtained' => 160,
        ]);
    }

    public function test_cannot_delete_exam_with_existing_marks(): void
    {
        $exam = Exam::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'name' => 'Protected Exam',
            'term' => 'Annual',
        ]);

        ExamResult::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'student_id' => $this->studentA->id,
            'exam_id' => $exam->id,
            'subject_id' => $this->mathA->id,
            'subjective_mark' => 40,
            'objective_mark' => 20,
            'practical_mark' => 0,
            'total_mark' => 60,
            'is_4th_subject' => false,
            'gpa' => 3.50,
            'grade' => 'A-',
        ]);

        $response = $this->actingAs($this->adminA, 'sanctum')
            ->deleteJson("/api/school-exams/{$exam->id}");

        $response->assertStatus(422);
        $this->assertDatabaseHas('exams', ['id' => $exam->id]);
    }

    public function test_tabulation_sheet_ranks_students_by_merit(): void
    {
        $exam = Exam::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'name' => 'Tabulation Exam',
            'term' => 'Annual',
        ]);

        ExamResult::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'student_id' => $this->studentA->id,
            'exam_id' => $exam->id,
            'subject_id' => $this->mathA->id,
            'subjective_mark' => 50,
            'objective_mark' => 35,
            'practical_mark' => 0,
            'total_mark' => 85,
            'is_4th_subject' => false,
            'gpa' => 5.00,
            'grade' => 'A+',
        ]);

        $response = $this->actingAs($this->adminA, 'sanctum')
            ->getJson("/api/school-exam-results/tabulation/{$exam->id}/class/{$this->classA->id}");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'exam',
            'class_level',
            'subjects',
            'tabulation' => [
                '*' => ['student_id', 'name', 'roll_number', 'total_marks', 'final_gpa', 'final_grade', 'passed', 'rank']
            ]
        ]);
        $response->assertJsonPath('tabulation.0.rank', 1);
        $response->assertJsonPath('tabulation.0.final_gpa', 5);
    }

    public function test_tenant_can_save_combined_student_result_across_multiple_subjects(): void
    {
        $exam = Exam::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'name' => 'Annual Test 2026',
            'term' => 'Annual',
            'is_published' => false,
        ]);

        $response = $this->actingAs($this->adminA)
            ->withHeaders(['X-School-Id' => $this->schoolA->id])
            ->postJson('/api/school-exam-results/student-result', [
                'student_id' => $this->studentA->id,
                'exam_id' => $exam->id,
                'marks' => [
                    [
                        'subject_id' => $this->mathA->id,
                        'subjective_mark' => 50,
                        'objective_mark' => 30,
                        'practical_mark' => 0,
                        'is_4th_subject' => false,
                    ],
                    [
                        'subject_id' => $this->bioA->id,
                        'subjective_mark' => 50,
                        'objective_mark' => 30,
                        'practical_mark' => 0,
                        'is_4th_subject' => true,
                    ],
                ],
            ]);

        $response->assertOk()
            ->assertJsonPath('student.id', $this->studentA->id)
            ->assertJsonPath('passed', true);

        $this->assertDatabaseHas('exam_marks', [
            'exam_id' => $exam->id,
            'student_id' => $this->studentA->id,
            'subject_id' => $this->mathA->id,
            'total_mark' => 80,
        ]);
        $this->assertDatabaseHas('exam_marks', [
            'exam_id' => $exam->id,
            'student_id' => $this->studentA->id,
            'subject_id' => $this->bioA->id,
            'total_mark' => 80,
        ]);
    }

    public function test_can_record_single_fractional_mark_with_note(): void
    {
        $exam = Exam::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'name' => 'Monthly Evaluation 2026',
            'term' => 'First Term',
            'is_published' => true,
        ]);

        $response = $this->actingAs($this->adminA)
            ->withHeaders(['X-School-Id' => $this->schoolA->id])
            ->postJson('/api/school-exam-results', [
                'exam_id' => $exam->id,
                'class_level_id' => $this->classA->id,
                'subject_id' => $this->mathA->id,
                'student_id' => $this->studentA->id,
                'mark' => 88.5,
                'note' => 'Excellent performance in calculus.',
            ]);

        $response->assertCreated()
            ->assertJsonPath('total_mark', '88.50')
            ->assertJsonPath('grade', 'A+')
            ->assertJsonPath('note', 'Excellent performance in calculus.');

        $this->assertDatabaseHas('exam_marks', [
            'exam_id' => $exam->id,
            'student_id' => $this->studentA->id,
            'subject_id' => $this->mathA->id,
            'total_mark' => 88.5,
            'note' => 'Excellent performance in calculus.',
        ]);

        // Test update with fractional mark and note
        $resultId = $response->json('id');
        $updateResponse = $this->actingAs($this->adminA)
            ->withHeaders(['X-School-Id' => $this->schoolA->id])
            ->putJson("/api/school-exam-results/{$resultId}", [
                'mark' => 92.75,
                'note' => 'Re-checked and bonus mark added.',
            ]);

        $updateResponse->assertOk()
            ->assertJsonPath('total_mark', '92.75')
            ->assertJsonPath('note', 'Re-checked and bonus mark added.');

        $this->assertDatabaseHas('exam_marks', [
            'id' => $resultId,
            'total_mark' => 92.75,
            'note' => 'Re-checked and bonus mark added.',
        ]);
    }
}
