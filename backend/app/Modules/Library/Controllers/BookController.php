<?php

namespace App\Modules\Library\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Core\Models\School;
use App\Modules\Library\Models\Book;
use App\Modules\Library\Models\BookIssue;
use App\Modules\Library\Requests\StoreBookRequest;
use App\Modules\Library\Requests\UpdateBookRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookController extends Controller
{
    /**
     * Display a listing of books with search and filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Book::forTenant()
            ->search($request->query('search'))
            ->category($request->query('category'))
            ->availability($request->query('availability'));

        if ($request->filled('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }

        $sortField = $request->query('sort_by', 'created_at');
        $sortOrder = $request->query('sort_order', 'desc');

        $allowedSorts = ['title', 'author', 'total_copies', 'available_copies', 'category', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortOrder === 'asc' ? 'asc' : 'desc');
        } else {
            $query->latest();
        }

        $perPage = (int) $request->query('per_page', 15);
        $books = $query->paginate($perPage);

        return response()->json($books);
    }

    /**
     * Store a newly created book.
     */
    public function store(StoreBookRequest $request): JsonResponse
    {
        $schoolId = auth()->user()?->school_id
            ?? ($request->header('X-School-Id') ? (int) $request->header('X-School-Id') : null)
            ?? School::first()?->id;

        $data = $request->validated();
        $data['school_id'] = $schoolId;
        $data['available_copies'] = $data['total_copies'];
        $data['status'] = $data['status'] ?? 'available';

        $book = Book::create($data);

        return response()->json([
            'message' => 'Book created successfully.',
            'data' => $book,
        ], 201);
    }

    /**
     * Display the specified book with its active and past issues.
     */
    public function show(Book $book): JsonResponse
    {
        $this->authorizeAccess($book);

        $book->load([
            'bookIssues' => function ($query) {
                $query->with(['student.classLevel', 'student.section', 'issuer', 'receiver'])
                    ->latest();
            },
        ]);

        return response()->json([
            'data' => $book,
        ]);
    }

    /**
     * Update the specified book.
     */
    public function update(UpdateBookRequest $request, Book $book): JsonResponse
    {
        $this->authorizeAccess($book);

        $data = $request->validated();

        // If total_copies is updated and available_copies is not explicitly provided,
        // adjust available_copies by the delta
        if (isset($data['total_copies']) && ! isset($data['available_copies'])) {
            $delta = $data['total_copies'] - $book->total_copies;
            $newAvailable = max(0, $book->available_copies + $delta);
            $data['available_copies'] = $newAvailable;
        }

        $book->update($data);

        return response()->json([
            'message' => 'Book updated successfully.',
            'data' => $book->fresh(),
        ]);
    }

    /**
     * Remove the specified book from storage.
     */
    public function destroy(Book $book): JsonResponse
    {
        $this->authorizeAccess($book);

        $activeIssuesCount = $book->activeIssues()->count();
        if ($activeIssuesCount > 0) {
            return response()->json([
                'message' => "Cannot delete book. There are {$activeIssuesCount} copies currently issued to students.",
            ], 422);
        }

        $book->delete();

        return response()->json([
            'message' => 'Book deleted successfully.',
        ]);
    }

    /**
     * Get distinct book categories for tenant.
     */
    public function categories(): JsonResponse
    {
        $categories = Book::forTenant()
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return response()->json($categories);
    }

    /**
     * Get library summary statistics.
     */
    public function stats(): JsonResponse
    {
        $booksQuery = Book::forTenant();
        $totalTitles = (clone $booksQuery)->count();
        $totalCopies = (int) (clone $booksQuery)->sum('total_copies');
        $availableCopies = (int) (clone $booksQuery)->sum('available_copies');
        $borrowedCopies = max(0, $totalCopies - $availableCopies);

        $issuesQuery = BookIssue::forTenant();
        $activeIssuesCount = (clone $issuesQuery)->where('status', 'issued')->count();
        $overdueIssuesCount = (clone $issuesQuery)->where('status', 'issued')
            ->where('due_date', '<', now()->toDateString())
            ->count();
        $returnedCount = (clone $issuesQuery)->where('status', 'returned')->count();

        return response()->json([
            'total_books' => $totalTitles,
            'total_copies' => $totalCopies,
            'available_copies' => $availableCopies,
            'borrowed_copies' => $borrowedCopies,
            'active_issues' => $activeIssuesCount,
            'overdue_issues' => $overdueIssuesCount,
            'total_returned' => $returnedCount,
        ]);
    }

    /**
     * Authorize access for tenant book.
     */
    protected function authorizeAccess(Book $book): void
    {
        $user = auth()->user();
        if ($user && $user->role !== 'SuperAdmin' && $user->school_id && $book->school_id !== $user->school_id) {
            abort(403, 'Unauthorized access to book in another tenant school.');
        }
    }
}
