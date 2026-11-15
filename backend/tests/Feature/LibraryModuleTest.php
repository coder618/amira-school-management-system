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
use App\Modules\Library\Models\Book;
use App\Modules\Library\Models\BookIssue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LibraryModuleTest extends TestCase
{
    use RefreshDatabase;

    protected School $school;
    protected AcademicYear $academicYear;
    protected User $adminUser;
    protected Student $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = School::create([
            'name' => 'Govt Laboratory High School',
            'code' => 'GLHS',
            'address' => 'Dhanmondi, Dhaka',
            'phone' => '01711111111',
            'is_active' => true,
        ]);

        $this->academicYear = AcademicYear::create([
            'school_id' => $this->school->id,
            'title' => '2026-2027',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'is_current' => true,
        ]);

        $this->adminUser = User::create([
            'name' => 'School Admin',
            'email' => 'admin@glhs.edu.bd',
            'password' => bcrypt('password'),
            'role' => Role::Admin->value,
            'school_id' => $this->school->id,
        ]);

        $shift = Shift::create([
            'school_id' => $this->school->id,
            'name' => 'Morning',
        ]);

        $classLevel = ClassLevel::create([
            'school_id' => $this->school->id,
            'name' => 'Class 9',
            'numeric_value' => 9,
        ]);

        $section = Section::create([
            'school_id' => $this->school->id,
            'class_level_id' => $classLevel->id,
            'name' => 'Section A',
            'capacity' => 40,
        ]);

        $this->student = Student::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->academicYear->id,
            'class_level_id' => $classLevel->id,
            'section_id' => $section->id,
            'shift_id' => $shift->id,
            'student_id' => 'STU-2026-001',
            'roll_number' => 1,
            'first_name' => 'Rahim',
            'last_name' => 'Uddin',
            'father_name' => 'Karim Uddin',
            'mother_name' => 'Fatema Begum',
            'phone_number' => '01712345678',
            'status' => 'active',
        ]);
    }

    public function test_can_create_a_new_book(): void
    {
        Sanctum::actingAs($this->adminUser);

        $payload = [
            'title' => 'Introduction to Algorithms',
            'author' => 'Thomas H. Cormen',
            'isbn' => '978-0262033848',
            'category' => 'Computer Science',
            'publisher' => 'MIT Press',
            'edition' => '3rd Edition',
            'publication_year' => '2009',
            'total_copies' => 5,
            'rack_number' => 'Rack CS-01',
            'description' => 'Comprehensive textbook on modern computer algorithms.',
        ];

        $response = $this->postJson('/api/library/books', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'Introduction to Algorithms')
            ->assertJsonPath('data.available_copies', 5)
            ->assertJsonPath('data.total_copies', 5)
            ->assertJsonPath('data.school_id', $this->school->id);

        $this->assertDatabaseHas('books', [
            'title' => 'Introduction to Algorithms',
            'total_copies' => 5,
            'available_copies' => 5,
            'school_id' => $this->school->id,
        ]);
    }

    public function test_can_list_books_with_filters(): void
    {
        Sanctum::actingAs($this->adminUser);

        Book::create([
            'school_id' => $this->school->id,
            'title' => 'A Brief History of Time',
            'author' => 'Stephen Hawking',
            'category' => 'Science',
            'total_copies' => 3,
            'available_copies' => 3,
            'status' => 'available',
        ]);

        Book::create([
            'school_id' => $this->school->id,
            'title' => 'Chader Pahar',
            'author' => 'Bibhutibhushan Bandyopadhyay',
            'category' => 'Bangla Literature',
            'total_copies' => 2,
            'available_copies' => 0,
            'status' => 'available',
        ]);

        // Filter by category
        $responseCategory = $this->getJson('/api/library/books?category=Science');
        $responseCategory->assertStatus(200);
        $this->assertCount(1, $responseCategory->json('data'));
        $this->assertEquals('A Brief History of Time', $responseCategory->json('data.0.title'));

        // Filter by availability: out_of_stock
        $responseOOS = $this->getJson('/api/library/books?availability=out_of_stock');
        $responseOOS->assertStatus(200);
        $this->assertCount(1, $responseOOS->json('data'));
        $this->assertEquals('Chader Pahar', $responseOOS->json('data.0.title'));

        // Search by author
        $responseSearch = $this->getJson('/api/library/books?search=Stephen');
        $responseSearch->assertStatus(200);
        $this->assertCount(1, $responseSearch->json('data'));
    }

    public function test_can_view_book_with_issue_history(): void
    {
        Sanctum::actingAs($this->adminUser);

        $book = Book::create([
            'school_id' => $this->school->id,
            'title' => 'Clean Code',
            'author' => 'Robert C. Martin',
            'category' => 'Computer Science',
            'total_copies' => 2,
            'available_copies' => 1,
            'status' => 'available',
        ]);

        BookIssue::create([
            'school_id' => $this->school->id,
            'book_id' => $book->id,
            'student_id' => $this->student->id,
            'issued_by' => $this->adminUser->id,
            'issue_date' => now()->subDays(5)->toDateString(),
            'due_date' => now()->addDays(5)->toDateString(),
            'status' => 'issued',
        ]);

        $response = $this->getJson("/api/library/books/{$book->id}");
        $response->assertStatus(200)
            ->assertJsonPath('data.title', 'Clean Code')
            ->assertJsonPath('data.borrowed_copies', 1);

        $this->assertNotEmpty($response->json('data.book_issues'));
    }

    public function test_can_issue_book_to_student(): void
    {
        Sanctum::actingAs($this->adminUser);

        $book = Book::create([
            'school_id' => $this->school->id,
            'title' => 'To Kill a Mockingbird',
            'author' => 'Harper Lee',
            'category' => 'Literature',
            'total_copies' => 2,
            'available_copies' => 2,
            'status' => 'available',
        ]);

        $payload = [
            'book_id' => $book->id,
            'student_id' => $this->student->id,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
            'notes' => 'Issued for literature coursework assignment',
        ];

        $response = $this->postJson('/api/library/issues', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.book_id', $book->id)
            ->assertJsonPath('data.student_id', $this->student->id)
            ->assertJsonPath('data.status', 'issued');

        // Verify available copies was decremented
        $this->assertEquals(1, $book->fresh()->available_copies);
    }

    public function test_cannot_issue_book_when_out_of_stock(): void
    {
        Sanctum::actingAs($this->adminUser);

        $book = Book::create([
            'school_id' => $this->school->id,
            'title' => 'Popular Physics',
            'author' => 'Richard Feynman',
            'category' => 'Physics',
            'total_copies' => 1,
            'available_copies' => 0,
            'status' => 'available',
        ]);

        $payload = [
            'book_id' => $book->id,
            'student_id' => $this->student->id,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
        ];

        $response = $this->postJson('/api/library/issues', $payload);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'No copies of "Popular Physics" are currently available for issue.']);
    }

    public function test_can_return_book_from_student(): void
    {
        Sanctum::actingAs($this->adminUser);

        $book = Book::create([
            'school_id' => $this->school->id,
            'title' => '1984',
            'author' => 'George Orwell',
            'category' => 'Literature',
            'total_copies' => 3,
            'available_copies' => 2,
            'status' => 'available',
        ]);

        $issue = BookIssue::create([
            'school_id' => $this->school->id,
            'book_id' => $book->id,
            'student_id' => $this->student->id,
            'issued_by' => $this->adminUser->id,
            'issue_date' => now()->subDays(10)->toDateString(),
            'due_date' => now()->subDays(2)->toDateString(),
            'status' => 'issued',
        ]);

        $returnPayload = [
            'return_date' => now()->toDateString(),
            'status' => 'returned',
            'fine_amount' => 20.00,
            'fine_status' => 'paid',
            'notes' => 'Returned 2 days late, 20 BDT fine received.',
        ];

        $response = $this->postJson("/api/library/issues/{$issue->id}/return", $returnPayload);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'returned')
            ->assertJsonPath('data.fine_amount', '20.00')
            ->assertJsonPath('data.fine_status', 'paid');

        // Verify available copies was restored
        $this->assertEquals(3, $book->fresh()->available_copies);
    }

    public function test_library_statistics(): void
    {
        Sanctum::actingAs($this->adminUser);

        $book1 = Book::create([
            'school_id' => $this->school->id,
            'title' => 'Book One',
            'author' => 'Author One',
            'total_copies' => 5,
            'available_copies' => 4,
            'status' => 'available',
        ]);

        $book2 = Book::create([
            'school_id' => $this->school->id,
            'title' => 'Book Two',
            'author' => 'Author Two',
            'total_copies' => 3,
            'available_copies' => 3,
            'status' => 'available',
        ]);

        // Active issue
        BookIssue::create([
            'school_id' => $this->school->id,
            'book_id' => $book1->id,
            'student_id' => $this->student->id,
            'issued_by' => $this->adminUser->id,
            'issue_date' => now()->subDays(5)->toDateString(),
            'due_date' => now()->subDays(1)->toDateString(), // Overdue
            'status' => 'issued',
        ]);

        $response = $this->getJson('/api/library/stats');

        $response->assertStatus(200)
            ->assertJson([
                'total_books' => 2,
                'total_copies' => 8,
                'available_copies' => 7,
                'borrowed_copies' => 1,
                'active_issues' => 1,
                'overdue_issues' => 1,
            ]);
    }
}
