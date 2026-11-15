<?php

namespace App\Modules\Documents\Services;

use App\Modules\Academic\Models\Student;
use App\Modules\Documents\Models\Document;
use App\Modules\Media\Models\Media;
use App\Modules\Media\Services\MediaService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class DocumentService
{
    protected MediaService $mediaService;

    public function __construct(MediaService $mediaService)
    {
        $this->mediaService = $mediaService;
    }

    /**
     * Store a new document and ensure physical file is uploaded via MediaService.
     */
    public function store(array $data, ?UploadedFile $file, int $schoolId, ?int $uploaderId): Document
    {
        return DB::transaction(function () use ($data, $file, $schoolId, $uploaderId) {
            $userId = $data['user_id'] ?? null;
            $studentId = $data['student_id'] ?? null;

            // Harmonize user_id and student_id
            if (! empty($studentId) && empty($userId)) {
                $student = Student::find($studentId);
                if ($student && $student->user_id) {
                    $userId = $student->user_id;
                }
            } elseif (! empty($userId) && empty($studentId)) {
                $student = Student::where('user_id', $userId)->first();
                if ($student) {
                    $studentId = $student->id;
                }
            }

            $media = null;
            $fileName = null;
            $fileSize = 0;
            $mimeType = null;

            if ($file instanceof UploadedFile) {
                // Upload via tenant-isolated Media module
                $media = $this->mediaService->upload(
                    file: $file,
                    schoolId: $schoolId,
                    collectionName: 'documents',
                    userId: $userId ?? $uploaderId
                );

                $fileName = $file->getClientOriginalName() ?: $media->file_name;
                $fileSize = $file->getSize() ?: $media->size;
                $mimeType = $file->getMimeType() ?: $media->mime_type;
            } elseif (! empty($data['media_id'])) {
                $media = Media::where('school_id', $schoolId)->findOrFail($data['media_id']);
                $fileName = $media->name ?: $media->file_name;
                $fileSize = $media->size;
                $mimeType = $media->mime_type;
            }

            if (! $media) {
                throw new \InvalidArgumentException('A valid file upload or existing media asset is required.');
            }

            $document = Document::create([
                'school_id' => $schoolId,
                'user_id' => $userId,
                'student_id' => $studentId,
                'media_id' => $media->id,
                'uploaded_by' => $uploaderId,
                'title' => $data['title'],
                'document_type' => $data['document_type'] ?? 'general',
                'description' => $data['description'] ?? null,
                'file_name' => $fileName,
                'file_size' => $fileSize,
                'mime_type' => $mimeType,
                'status' => $data['status'] ?? 'active',
            ]);

            // Link media morph back to document
            $media->update([
                'model_type' => Document::class,
                'model_id' => $document->id,
            ]);

            return $document->load(['user', 'student.classLevel', 'student.section', 'uploader', 'media']);
        });
    }

    /**
     * Update existing document metadata, and replace underlying media if a new file is uploaded.
     */
    public function update(Document $document, array $data, ?UploadedFile $file = null): Document
    {
        return DB::transaction(function () use ($document, $data, $file) {
            $userId = array_key_exists('user_id', $data) ? $data['user_id'] : $document->user_id;
            $studentId = array_key_exists('student_id', $data) ? $data['student_id'] : $document->student_id;

            if (! empty($studentId) && empty($userId)) {
                $student = Student::find($studentId);
                if ($student && $student->user_id) {
                    $userId = $student->user_id;
                }
            } elseif (! empty($userId) && empty($studentId)) {
                $student = Student::where('user_id', $userId)->first();
                if ($student) {
                    $studentId = $student->id;
                }
            }

            $data['user_id'] = $userId;
            $data['student_id'] = $studentId;

            // If a replacement file was provided, upload to media and delete old media
            if ($file instanceof UploadedFile) {
                $oldMedia = $document->media;

                $newMedia = $this->mediaService->upload(
                    file: $file,
                    schoolId: $document->school_id,
                    collectionName: 'documents',
                    userId: $userId ?? $document->uploaded_by,
                    model: $document
                );

                $data['media_id'] = $newMedia->id;
                $data['file_name'] = $file->getClientOriginalName() ?: $newMedia->file_name;
                $data['file_size'] = $file->getSize() ?: $newMedia->size;
                $data['mime_type'] = $file->getMimeType() ?: $newMedia->mime_type;

                if ($oldMedia && $oldMedia->id !== $newMedia->id) {
                    $this->mediaService->delete($oldMedia);
                }
            } elseif (! empty($data['media_id']) && $data['media_id'] !== $document->media_id) {
                $media = Media::where('school_id', $document->school_id)->findOrFail($data['media_id']);
                $data['file_name'] = $media->name ?: $media->file_name;
                $data['file_size'] = $media->size;
                $data['mime_type'] = $media->mime_type;
            }

            $document->update($data);

            return $document->fresh(['user', 'student.classLevel', 'student.section', 'uploader', 'media']);
        });
    }

    /**
     * Delete document and purge underlying file asset from disk & media table.
     */
    public function delete(Document $document): bool
    {
        return DB::transaction(function () use ($document) {
            if ($document->media) {
                $this->mediaService->delete($document->media);
            }

            return (bool) $document->delete();
        });
    }
}
