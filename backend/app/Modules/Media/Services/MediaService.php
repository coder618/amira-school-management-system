<?php

namespace App\Modules\Media\Services;

use App\Modules\Media\Models\Media;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaService
{
    /**
     * Store an uploaded file in a tenant-specific directory and record in Media table.
     */
    public function upload(
        UploadedFile $file,
        int $schoolId,
        string $collectionName = 'default',
        ?int $userId = null,
        ?Model $model = null,
        ?string $disk = null
    ): Media {
        $disk = $disk ?? config('filesystems.media_disk', 'public');

        // Sanitize collection name
        $cleanCollection = Str::slug($collectionName, '_');
        if (empty($cleanCollection)) {
            $cleanCollection = 'default';
        }

        // Original name and extension
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $extension = $file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'bin';
        $fileName = Str::uuid() . '.' . strtolower($extension);

        // Tenant-specific directory path: tenants/{school_id}/{collection}/{filename}
        $directory = "tenants/{$schoolId}/{$cleanCollection}";
        $filePath = $file->storeAs($directory, $fileName, $disk);

        return Media::create([
            'school_id' => $schoolId,
            'user_id' => $userId,
            'model_type' => $model ? get_class($model) : null,
            'model_id' => $model?->id,
            'collection_name' => $cleanCollection,
            'name' => $originalName,
            'file_name' => $fileName,
            'mime_type' => $file->getMimeType(),
            'disk' => $disk,
            'size' => $file->getSize() ?: 0,
            'file_path' => $filePath,
        ]);
    }

    /**
     * Delete a media asset from storage and database.
     */
    public function delete(Media $media): bool
    {
        if (! empty($media->file_path)) {
            $disk = $media->disk ?: 'public';
            if (Storage::disk($disk)->exists($media->file_path)) {
                Storage::disk($disk)->delete($media->file_path);
            }
        }

        return (bool) $media->delete();
    }
}
