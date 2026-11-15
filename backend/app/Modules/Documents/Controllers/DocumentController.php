<?php

namespace App\Modules\Documents\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Core\Models\School;
use App\Modules\Documents\Models\Document;
use App\Modules\Documents\Requests\StoreDocumentRequest;
use App\Modules\Documents\Requests\UpdateDocumentRequest;
use App\Modules\Documents\Services\DocumentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    protected DocumentService $documentService;

    public function __construct(DocumentService $documentService)
    {
        $this->documentService = $documentService;
    }

    /**
     * Display a listing of documents for the tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Document::forTenant()
            ->with(['user', 'student.classLevel', 'student.section', 'uploader', 'media'])
            ->search($request->query('search'))
            ->ofType($request->query('document_type'))
            ->forUser($request->query('user_id') ? (int) $request->query('user_id') : null)
            ->forStudent($request->query('student_id') ? (int) $request->query('student_id') : null);

        if ($request->filled('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }

        $sortField = $request->query('sort_by', 'created_at');
        $sortOrder = $request->query('sort_order', 'desc');

        if (in_array($sortField, ['created_at', 'title', 'document_type', 'file_size'])) {
            $query->orderBy($sortField, $sortOrder === 'asc' ? 'asc' : 'desc');
        } else {
            $query->latest();
        }

        $perPage = (int) $request->query('per_page', 15);
        $documents = $query->paginate($perPage);

        return response()->json($documents);
    }

    /**
     * Store a new document (with file uploaded via Media module).
     */
    public function store(StoreDocumentRequest $request): JsonResponse
    {
        $schoolId = auth()->user()?->school_id
            ?? ($request->header('X-School-Id') ? (int) $request->header('X-School-Id') : null)
            ?? School::first()?->id;

        if (! $schoolId) {
            return response()->json([
                'message' => 'Cannot upload documents without a valid school tenant context.',
            ], 422);
        }

        $document = $this->documentService->store(
            data: $request->validated(),
            file: $request->file('file'),
            schoolId: $schoolId,
            uploaderId: auth()->id()
        );

        return response()->json([
            'message' => 'Document uploaded and archived successfully via Media module.',
            'data' => $document,
        ], 201);
    }

    /**
     * Display the specified document.
     */
    public function show(Document $document): JsonResponse
    {
        $this->authorizeDocumentAccess($document);

        $document->load(['user', 'student.classLevel', 'student.section', 'uploader', 'media']);

        return response()->json([
            'data' => $document,
        ]);
    }

    /**
     * Update the specified document metadata or replace attached file.
     */
    public function update(UpdateDocumentRequest $request, Document $document): JsonResponse
    {
        $this->authorizeDocumentAccess($document);

        $updated = $this->documentService->update(
            document: $document,
            data: $request->validated(),
            file: $request->file('file')
        );

        return response()->json([
            'message' => 'Document updated successfully.',
            'data' => $updated,
        ]);
    }

    /**
     * Remove the specified document and purge media asset from disk.
     */
    public function destroy(Document $document): JsonResponse
    {
        $this->authorizeDocumentAccess($document);

        $this->documentService->delete($document);

        return response()->json([
            'message' => 'Document and underlying media file removed successfully.',
        ]);
    }

    /**
     * Download or stream the document file.
     */
    public function download(Document $document): mixed
    {
        $this->authorizeDocumentAccess($document);

        $media = $document->media;

        if (! $media || empty($media->file_path)) {
            return response()->json(['message' => 'Document file not found in media storage.'], 404);
        }

        $disk = $media->disk ?: 'public';

        if (! Storage::disk($disk)->exists($media->file_path)) {
            return response()->json(['message' => 'File missing from underlying media storage disk.'], 404);
        }

        $extension = pathinfo($media->file_path, PATHINFO_EXTENSION);
        $cleanTitle = preg_replace('/[^A-Za-z0-9_\-]/', '_', $document->title);
        $downloadFilename = "{$cleanTitle}.{$extension}";

        return Storage::disk($disk)->download($media->file_path, $downloadFilename);
    }

    /**
     * Summary metrics and analytics for Documents module.
     */
    public function stats(Request $request): JsonResponse
    {
        $schoolId = auth()->user()?->school_id
            ?? ($request->header('X-School-Id') ? (int) $request->header('X-School-Id') : null);

        $baseQuery = Document::forTenant($schoolId);

        $totalDocuments = (clone $baseQuery)->count();
        $userDocumentsCount = (clone $baseQuery)->whereNotNull('user_id')->count();
        $studentDocumentsCount = (clone $baseQuery)->whereNotNull('student_id')->count();
        $totalBytes = (clone $baseQuery)->sum('file_size');

        $byType = (clone $baseQuery)
            ->selectRaw('document_type, count(*) as count')
            ->groupBy('document_type')
            ->pluck('count', 'document_type');

        $byStatus = (clone $baseQuery)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $formattedTotalBytes = $this->formatBytes((float) $totalBytes);

        return response()->json([
            'total_documents' => $totalDocuments,
            'user_documents_count' => $userDocumentsCount,
            'student_documents_count' => $studentDocumentsCount,
            'unassigned_documents_count' => $totalDocuments - $userDocumentsCount,
            'total_bytes' => $totalBytes,
            'formatted_total_size' => $formattedTotalBytes,
            'by_type' => $byType,
            'by_status' => $byStatus,
        ]);
    }

    /**
     * Check tenant scope permission.
     */
    protected function authorizeDocumentAccess(Document $document): void
    {
        $schoolId = auth()->user()?->school_id
            ?? (request()->header('X-School-Id') ? (int) request()->header('X-School-Id') : null);

        if ($schoolId && $document->school_id !== $schoolId) {
            abort(403, 'Unauthorized access to tenant document.');
        }
    }

    /**
     * Helper to format bytes into readable string.
     */
    protected function formatBytes(float $bytes): string
    {
        if ($bytes <= 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $power = floor(log($bytes, 1024));

        return round($bytes / (1024 ** $power), 2) . ' ' . ($units[$power] ?? 'B');
    }
}
