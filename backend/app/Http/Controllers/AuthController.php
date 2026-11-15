<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Modules\Media\Models\Media;
use App\Modules\Media\Services\MediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    protected MediaService $mediaService;

    public function __construct(MediaService $mediaService)
    {
        $this->mediaService = $mediaService;
    }
    /**
     * Register a new user.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'staff',
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * Log in an existing user.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        // Revoke prior tokens if desired or create a new active session
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Revoke token and log user out.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get the authenticated user.
     */
    public function user(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->loadMissing(['school']),
        ]);
    }

    /**
     * List all users scoped to the school tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $schoolId = auth()->user()?->school_id
            ?? ($request->header('X-School-Id') ? (int) $request->header('X-School-Id') : null);

        $query = User::query();
        if ($schoolId) {
            $query->where('school_id', $schoolId);
        }

        if ($request->filled('role')) {
            $query->where('role', $request->query('role'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy('name')->get(['id', 'name', 'email', 'role', 'phone_number', 'profile_picture']));
    }

    /**
     * Get specific user profile scoped to tenant.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $schoolId = auth()->user()?->school_id
            ?? ($request->header('X-School-Id') ? (int) $request->header('X-School-Id') : null);

        $query = User::with(['school', 'media']);
        if ($schoolId && ! auth()->user()?->isSuperAdmin()) {
            $query->where('school_id', $schoolId);
        }

        $user = $query->findOrFail($id);

        return response()->json([
            'user' => $user,
        ]);
    }

    /**
     * Upload or update the authenticated user's own profile picture via Media module.
     */
    public function updateProfilePicture(Request $request): JsonResponse
    {
        $request->validate([
            'profile_picture' => 'nullable|file|mimes:jpeg,png,jpg,webp,gif|max:5120',
            'file' => 'nullable|file|mimes:jpeg,png,jpg,webp,gif|max:5120',
            'media_id' => 'nullable|integer',
        ]);

        $user = $request->user();
        $schoolId = $user->school_id ?? 1;

        if ($request->hasFile('profile_picture') || $request->hasFile('file')) {
            $file = $request->file('profile_picture') ?? $request->file('file');

            // Delete previous media records in profile_pictures collection for this user
            $oldMedias = Media::where('user_id', $user->id)
                ->where('collection_name', 'profile_pictures')
                ->get();
            foreach ($oldMedias as $oldMedia) {
                $this->mediaService->delete($oldMedia);
            }

            // Also remove legacy file if exists
            if ($user->profile_picture && Storage::disk('public')->exists($user->profile_picture)) {
                Storage::disk('public')->delete($user->profile_picture);
            }

            // Upload using MediaService to enforce media module persistence
            $media = $this->mediaService->upload(
                file: $file,
                schoolId: $schoolId,
                collectionName: 'profile_pictures',
                userId: $user->id,
                model: $user
            );

            $user->update([
                'profile_picture' => $media->file_path,
            ]);

            return response()->json([
                'message' => 'Profile picture updated successfully',
                'user' => $user->fresh()->loadMissing('school'),
                'profile_picture_url' => $user->fresh()->profile_picture_url,
                'media' => $media,
            ]);
        }

        if ($request->filled('media_id')) {
            $media = Media::where('id', $request->input('media_id'))->firstOrFail();

            $user->update([
                'profile_picture' => $media->file_path,
            ]);

            return response()->json([
                'message' => 'Profile picture updated successfully',
                'user' => $user->fresh()->loadMissing('school'),
                'profile_picture_url' => $user->fresh()->profile_picture_url,
                'media' => $media,
            ]);
        }

        return response()->json(['message' => 'Please provide an image file or media_id.'], 422);
    }

    /**
     * Delete the authenticated user's profile picture from storage and media module.
     */
    public function deleteProfilePicture(Request $request): JsonResponse
    {
        $user = $request->user();

        // Delete from media module
        $mediaRecords = Media::where('user_id', $user->id)
            ->where(function ($q) use ($user) {
                $q->where('collection_name', 'profile_pictures')
                  ->orWhere('file_path', $user->profile_picture);
            })
            ->get();

        foreach ($mediaRecords as $media) {
            $this->mediaService->delete($media);
        }

        if ($user->profile_picture && Storage::disk('public')->exists($user->profile_picture)) {
            Storage::disk('public')->delete($user->profile_picture);
        }

        $user->update([
            'profile_picture' => null,
        ]);

        return response()->json([
            'message' => 'Profile picture removed successfully',
            'user' => $user->fresh()->loadMissing('school'),
        ]);
    }

    /**
     * Update user basic profile information (name, phone_number).
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone_number' => 'nullable|string|max:20',
        ]);

        $user = $request->user();
        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user->fresh(),
        ]);
    }
}

