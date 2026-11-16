<?php

namespace App\Modules\Academic\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Academic\Models\Student;
use App\Modules\Academic\Models\TeacherNote;
use App\Modules\HR\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherNoteController extends Controller
{
    /**
     * List teacher notes for a specific student.
     */
    public function index(Request $request, Student $student): JsonResponse
    {
        $schoolId = auth()->user()?->school_id
            ?? ($request->header('X-School-Id') ? (int) $request->header('X-School-Id') : null)
            ?? $student->school_id;

        if ($schoolId && $student->school_id !== $schoolId && ! auth()->user()?->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized access to student notes.'], 403);
        }

        $perPage = (int) ($request->query('per_page', 10));
        if ($perPage < 1 || $perPage > 50) {
            $perPage = 10;
        }

        $notes = TeacherNote::with(['author:id,name,email', 'teacher:id,employee_id,designation'])
            ->where('student_id', $student->id)
            ->where('school_id', $student->school_id)
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($perPage);

        return response()->json($notes);
    }

    /**
     * Store a new teacher note for the student.
     */
    public function store(Request $request, Student $student): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'note' => 'required|string',
            'category' => 'nullable|string|max:50',
            'date' => 'nullable|date',
        ]);

        $user = $request->user();
        $schoolId = $user->school_id ?? $student->school_id;

        // Find linked teacher record if author is a teacher
        $teacherId = null;
        if ($user) {
            $teacher = Teacher::where('user_id', $user->id)->first();
            $teacherId = $teacher?->id;
        }

        $note = TeacherNote::create([
            'school_id' => $schoolId,
            'student_id' => $student->id,
            'teacher_id' => $teacherId,
            'author_id' => $user?->id,
            'author_name' => $user?->name ?? 'Teacher / School Staff',
            'title' => $validated['title'],
            'category' => $validated['category'] ?? 'General',
            'note' => $validated['note'],
            'date' => $validated['date'] ?? now()->toDateString(),
        ]);

        $note->load(['author:id,name,email', 'teacher:id,employee_id,designation']);

        return response()->json([
            'message' => 'Teacher note recorded successfully.',
            'data' => $note,
        ], 201);
    }

    /**
     * Delete a teacher note.
     */
    public function destroy(Request $request, Student $student, TeacherNote $note): JsonResponse
    {
        if ($note->student_id !== $student->id) {
            return response()->json(['message' => 'Note not found for this student.'], 404);
        }

        $user = $request->user();
        $isAuthor = $user && $note->author_id === $user->id;
        $isAdmin = $user && ($user->isAdmin() || $user->isSuperAdmin());

        if (! $isAuthor && ! $isAdmin) {
            return response()->json(['message' => 'Unauthorized to delete this note.'], 403);
        }

        $note->delete();

        return response()->json([
            'message' => 'Teacher note deleted successfully.',
        ]);
    }
}
