<?php

namespace App\Modules\Documents\Models;

use App\Modules\Academic\Models\Student;
use App\Modules\Core\Models\User;
use App\Modules\Core\Traits\BelongsToTenant;
use App\Modules\Media\Models\Media;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    use BelongsToTenant, HasFactory;

    protected $table = 'documents';

    protected $fillable = [
        'school_id',
        'user_id',
        'student_id',
        'media_id',
        'uploaded_by',
        'title',
        'document_type',
        'file_name',
        'mime_type',
        'file_size',
        'description',
        'status',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    protected $appends = [
        'file_url',
        'formatted_file_size',
    ];

    /**
     * User / Student / Staff relationship (Optional).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Student record relationship (Optional).
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * User who uploaded the document.
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * Underlying Media asset relationship.
     */
    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }

    /**
     * Get accessible URL for the document through media.
     */
    public function getFileUrlAttribute(): ?string
    {
        return $this->media?->url;
    }

    /**
     * Human readable file size (e.g. 1.2 MB, 450 KB).
     */
    public function getFormattedFileSizeAttribute(): string
    {
        $bytes = $this->file_size ?: ($this->media?->size ?? 0);

        if ($bytes <= 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $power = floor(log($bytes, 1024));

        return round($bytes / (1024 ** $power), 2) . ' ' . ($units[$power] ?? 'B');
    }

    /**
     * Scope for searching document title, description, or file name.
     */
    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (empty($term)) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($term) {
            $q->where('title', 'like', "%{$term}%")
              ->orWhere('description', 'like', "%{$term}%")
              ->orWhere('file_name', 'like', "%{$term}%")
              ->orWhereHas('user', function (Builder $userQuery) use ($term) {
                  $userQuery->where('name', 'like', "%{$term}%")
                            ->orWhere('email', 'like', "%{$term}%");
              })
              ->orWhereHas('student', function (Builder $studentQuery) use ($term) {
                  $studentQuery->where('first_name', 'like', "%{$term}%")
                               ->orWhere('last_name', 'like', "%{$term}%")
                               ->orWhere('student_id', 'like', "%{$term}%");
              });
        });
    }

    /**
     * Scope for filtering by document type.
     */
    public function scopeOfType(Builder $query, ?string $type): Builder
    {
        if (empty($type) || $type === 'all') {
            return $query;
        }

        return $query->where('document_type', $type);
    }

    /**
     * Scope for filtering by user.
     */
    public function scopeForUser(Builder $query, ?int $userId): Builder
    {
        if (empty($userId)) {
            return $query;
        }

        return $query->where('user_id', $userId);
    }

    /**
     * Scope for filtering by student.
     */
    public function scopeForStudent(Builder $query, ?int $studentId): Builder
    {
        if (empty($studentId)) {
            return $query;
        }

        return $query->where('student_id', $studentId);
    }
}
