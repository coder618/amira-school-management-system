<?php

namespace App\Modules\Media\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Core\Models\School;
use App\Modules\Media\Models\Media;
use App\Modules\Media\Requests\UploadMediaRequest;
use App\Modules\Media\Services\MediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MediaController extends Controller
{
    protected MediaService $mediaService;

    public function __construct(MediaService $mediaService)
    {
        $this->mediaService = $mediaService;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Media::forTenant()->latest();

        if ($request->filled('collection_name')) {
            $query->where('collection_name', $request->query('collection_name'));
        }

        if ($request->filled('model_type') && $request->filled('model_id')) {
            $query->where('model_type', $request->query('model_type'))
                  ->where('model_id', $request->query('model_id'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }

        $media = $query->paginate($request->query('per_page', 20));

        return response()->json($media);
    }

    public function upload(UploadMediaRequest $request): JsonResponse
    {
        $schoolId = auth()->user()?->school_id
            ?? ($request->header('X-School-Id') ? (int) $request->header('X-School-Id') : null)
            ?? School::first()?->id;

        if (! $schoolId) {
            return response()->json([
                'message' => 'Cannot upload media without a valid school tenant context.',
            ], 422);
        }

        $collection = $request->input('collection_name', 'default');
        $userId = auth()->id();

        $model = null;
        if ($request->filled('model_type') && $request->filled('model_id')) {
            $modelClass = $request->input('model_type');
            if (class_exists($modelClass)) {
                $model = $modelClass::find($request->input('model_id'));
            }
        } elseif ($collection === 'profile_pictures' && auth()->user()) {
            $model = auth()->user();
        }

        $media = $this->mediaService->upload(
            file: $request->file('file'),
            schoolId: $schoolId,
            collectionName: $collection,
            userId: $userId,
            model: $model
        );

        if ($collection === 'profile_pictures' && auth()->user()) {
            auth()->user()->update([
                'profile_picture' => $media->file_path,
            ]);
        }

        return response()->json([
            'message' => 'File uploaded successfully',
            'data' => $media,
            'url' => $media->url,
            'file_path' => $media->file_path,
        ], 201);
    }

    public function destroy(Request $request, Media $media): JsonResponse
    {
        $schoolId = auth()->user()?->school_id
            ?? ($request->header('X-School-Id') ? (int) $request->header('X-School-Id') : null);

        if ($schoolId && $media->school_id !== $schoolId) {
            return response()->json(['message' => 'Unauthorized access to tenant media.'], 403);
        }

        $this->mediaService->delete($media);

        return response()->json([
            'message' => 'Media file removed successfully',
        ]);
    }
}
