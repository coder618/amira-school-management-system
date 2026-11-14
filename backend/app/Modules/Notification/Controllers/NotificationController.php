<?php

namespace App\Modules\Notification\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Notification\Models\Notification;
use App\Modules\Notification\Requests\StoreNotificationRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * List all notifications for the current authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $filter = $request->query('filter', 'all'); // all, unread, read, archived

        if ($filter === 'archived') {
            $query = Notification::onlyTrashed()->forUser($userId);
        } else {
            $query = Notification::forUser($userId);

            if ($filter === 'unread') {
                $query->unread();
            } elseif ($filter === 'read') {
                $query->read();
            }
        }

        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        if ($request->filled('search')) {
            $search = '%' . $request->query('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', $search)
                    ->orWhere('message', 'like', $search);
            });
        }

        $unreadCount = Notification::forUser($userId)->unread()->count();
        $archivedCount = Notification::onlyTrashed()->forUser($userId)->count();

        $notifications = $query->latest()->get();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
            'archived_count' => $archivedCount,
            'total_count' => $notifications->count(),
        ]);
    }

    /**
     * Get unread notifications count for badges.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $unreadCount = Notification::forUser($request->user()->id)->unread()->count();

        return response()->json([
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Store / Send a notification to a specific user (or self).
     */
    public function store(StoreNotificationRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $targetUserId = $validated['user_id'] ?? $request->user()->id;
        $schoolId = $validated['school_id'] ?? $request->user()->school_id;

        $notification = Notification::create([
            'user_id' => $targetUserId,
            'school_id' => $schoolId,
            'title' => $validated['title'],
            'message' => $validated['message'],
            'type' => $validated['type'] ?? 'info',
            'data' => $validated['data'] ?? null,
            'read_at' => null,
        ]);

        return response()->json($notification, 201);
    }

    /**
     * Show a single notification owned by user.
     */
    public function show(Notification $notification): JsonResponse
    {
        $this->authorizeOwner($notification);

        return response()->json($notification);
    }

    /**
     * Mark single notification as read.
     */
    public function markAsRead(Notification $notification): JsonResponse
    {
        $this->authorizeOwner($notification);

        $notification->markAsRead();

        return response()->json([
            'message' => 'Notification marked as read',
            'notification' => $notification,
        ]);
    }

    /**
     * Mark single notification as unread.
     */
    public function markAsUnread(Notification $notification): JsonResponse
    {
        $this->authorizeOwner($notification);

        $notification->markAsUnread();

        return response()->json([
            'message' => 'Notification marked as unread',
            'notification' => $notification,
        ]);
    }

    /**
     * Mark all active notifications for the current user as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        Notification::forUser($userId)
            ->unread()
            ->update(['read_at' => now()]);

        return response()->json([
            'message' => 'All notifications marked as read',
            'unread_count' => 0,
        ]);
    }

    /**
     * Soft delete notification owned by user.
     */
    public function destroy(Notification $notification): JsonResponse
    {
        $this->authorizeOwner($notification);

        $notification->delete();

        return response()->json([
            'message' => 'Notification moved to trash (soft deleted)',
            'notification_id' => $notification->id,
        ]);
    }

    /**
     * Restore a soft-deleted notification.
     */
    public function restore(int $id): JsonResponse
    {
        $notification = Notification::onlyTrashed()
            ->where('user_id', auth()->id())
            ->findOrFail($id);

        $notification->restore();

        return response()->json([
            'message' => 'Notification restored successfully',
            'notification' => $notification,
        ]);
    }

    /**
     * Permanently delete a notification.
     */
    public function forceDestroy(int $id): JsonResponse
    {
        $notification = Notification::withTrashed()
            ->where('user_id', auth()->id())
            ->findOrFail($id);

        $notification->forceDelete();

        return response()->json([
            'message' => 'Notification permanently deleted',
        ]);
    }

    /**
     * Empty all soft-deleted notifications for the current user.
     */
    public function emptyTrash(): JsonResponse
    {
        Notification::onlyTrashed()
            ->where('user_id', auth()->id())
            ->forceDelete();

        return response()->json([
            'message' => 'Trash emptied successfully',
        ]);
    }

    /**
     * Authorize that the notification belongs to the authenticated user.
     */
    protected function authorizeOwner(Notification $notification): void
    {
        if ($notification->user_id !== auth()->id()) {
            abort(403, 'Unauthorized. You can only manage your own notifications.');
        }
    }
}
