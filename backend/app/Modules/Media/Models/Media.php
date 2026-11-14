<?php

namespace App\Modules\Media\Models;

use App\Modules\Core\Models\School;
use App\Modules\Core\Models\User;
use App\Modules\Core\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Storage;

class Media extends Model
{
    use BelongsToTenant, HasFactory;

    protected $table = 'media';

    protected $fillable = [
        'school_id',
        'user_id',
        'model_type',
        'model_id',
        'collection_name',
        'name',
        'file_name',
        'mime_type',
        'disk',
        'size',
        'file_path',
        'custom_properties',
    ];

    protected $casts = [
        'size' => 'integer',
        'custom_properties' => 'array',
    ];

    protected $appends = [
        'url',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function model(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get accessible URL for the media asset.
     */
    public function getUrlAttribute(): ?string
    {
        if (empty($this->file_path)) {
            return null;
        }

        // If file_path is already an absolute external URL (e.g. S3 / R2 full public URL)
        if (str_starts_with($this->file_path, 'http://') || str_starts_with($this->file_path, 'https://')) {
            return $this->file_path;
        }

        if ($this->disk === 'public') {
            return url('storage/' . ltrim(preg_replace('#^/?storage/#', '', $this->file_path), '/'));
        }

        return Storage::disk($this->disk)->url($this->file_path);
    }
}
