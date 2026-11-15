<?php

namespace App\Modules\Library\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Library\Models\Book;
use App\Modules\Library\Models\BookIssue;
use App\Modules\Library\Requests\IssueBookRequest;
use App\Modules\Library\Requests\ReturnBookRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookIssueController extends Controller
{
    /**
     * Display a listing of book issues with filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = BookIssue::forTenant()
            ->with(['book', 'student.classLevel', 'student.section', 'issuer', 'receiver'])
            ->status($request->query('status'))
            ->search($request->query('search'));

        if ($request->filled('student_id')) {
            $query->where('student_id', (int) $request->query('student_id'));
        }

        if ($request->filled('book_id')) {
            $query->where('book_id', (int) $request->query('book_id'));
        }

        $sortField = $request->query('sort_by', 'created_at');
        $sortOrder = $request->query('sort_order', 'desc');

        $allowedSorts = ['issue_date', 'due_date', 'return_date', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortOrder === 'asc' ? 'asc' : 'desc');
        } else {
            $query->latest();
        }

        $perPage = (int) $request->query('per_page', 15);
        $issues = $query->paginate($perPage);

        return response()->json($issues);
    }

    /**
     * Issue a book to a student.
     */
    public function store(IssueBookRequest $request): JsonResponse
    {
        $book = Book::findOrFail($request->book_id);

        if ($book->available_copies < 1) {
            return response()->json([
                'message' => 'No copies of "' . $book->title . '" are currently available for issue.',
            ], 422);
        }

        if ($book->status !== 'available') {
            return response()->json([
                'message' => 'This book is marked as ' . $book->status . ' and cannot be issued.',
            ], 422);
        }

        $schoolId = auth()->user()?->school_id
            ?? ($request->header('X-School-Id') ? (int) $request->header('X-School-Id') : null)
            ?? $book->school_id;

        $issue = DB::transaction(function () use ($request, $book, $schoolId) {
            $book->decrement('available_copies');

            return BookIssue::create([
                'school_id' => $schoolId,
                'book_id' => $book->id,
                'student_id' => $request->student_id,
                'issued_by' => auth()->id(),
                'issue_date' => $request->issue_date,
                'due_date' => $request->due_date,
                'status' => 'issued',
                'fine_amount' => 0.00,
                'fine_status' => 'unpaid',
                'notes' => $request->notes,
            ]);
        });

        $issue->load(['book', 'student.classLevel', 'student.section', 'issuer']);

        return response()->json([
            'message' => 'Book issued successfully to student.',
            'data' => $issue,
        ], 201);
    }

    /**
     * Display the specified issue details.
     */
    public function show(BookIssue $issue): JsonResponse
    {
        $this->authorizeAccess($issue);

        $issue->load(['book', 'student.classLevel', 'student.section', 'issuer', 'receiver']);

        return response()->json([
            'data' => $issue,
        ]);
    }

    /**
     * Process return of an issued book from a student.
     */
    public function returnBook(ReturnBookRequest $request, BookIssue $issue): JsonResponse
    {
        $this->authorizeAccess($issue);

        if ($issue->status === 'returned') {
            return response()->json([
                'message' => 'This book has already been marked as returned.',
            ], 422);
        }

        $newStatus = $request->input('status', 'returned');
        $returnDate = $request->input('return_date', now()->toDateString());
        $fineAmount = (float) $request->input('fine_amount', 0.00);
        $fineStatus = $request->input('fine_status', $fineAmount > 0 ? 'paid' : 'unpaid');
        $notes = $request->filled('notes') ? $request->notes : $issue->notes;

        DB::transaction(function () use ($issue, $newStatus, $returnDate, $fineAmount, $fineStatus, $notes) {
            // If the book is returned safely, restore the available copy
            if ($newStatus === 'returned') {
                $issue->book()->increment('available_copies');
            }

            $issue->update([
                'status' => $newStatus,
                'return_date' => $returnDate,
                'fine_amount' => $fineAmount,
                'fine_status' => $fineStatus,
                'notes' => $notes,
                'received_by' => auth()->id(),
            ]);
        });

        $issue->load(['book', 'student.classLevel', 'student.section', 'issuer', 'receiver']);

        return response()->json([
            'message' => 'Book returned successfully.',
            'data' => $issue->fresh(['book', 'student.classLevel', 'student.section', 'issuer', 'receiver']),
        ]);
    }

    /**
     * Delete an issue record.
     */
    public function destroy(BookIssue $issue): JsonResponse
    {
        $this->authorizeAccess($issue);

        DB::transaction(function () use ($issue) {
            // If it was still checked out, restore available count
            if ($issue->status === 'issued') {
                $issue->book()->increment('available_copies');
            }
            $issue->delete();
        });

        return response()->json([
            'message' => 'Book issue record removed successfully.',
        ]);
    }

    /**
     * Authorize access for tenant issue.
     */
    protected function authorizeAccess(BookIssue $issue): void
    {
        $user = auth()->user();
        if ($user && $user->role !== 'SuperAdmin' && $user->school_id && $issue->school_id !== $user->school_id) {
            abort(403, 'Unauthorized access to library issue in another tenant school.');
        }
    }
}
