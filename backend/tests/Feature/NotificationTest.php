<?php

namespace Tests\Feature;

use App\Modules\Core\Enums\Role;
use App\Modules\Core\Models\School;
use App\Modules\Core\Models\User;
use App\Modules\Notification\Models\Notification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    protected School $school;
    protected User $user1;
    protected User $user2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = School::create([
            'name' => 'Dhaka Model School',
            'code' => 'DMS-01',
            'board' => 'Dhaka',
            'is_active' => true,
        ]);

        $this->user1 = User::create([
            'school_id' => $this->school->id,
            'name' => 'User One',
            'email' => 'user1@school.com',
            'password' => bcrypt('password'),
            'role' => Role::Admin->value,
            'is_active' => true,
        ]);

        $this->user2 = User::create([
            'school_id' => $this->school->id,
            'name' => 'User Two',
            'email' => 'user2@school.com',
            'password' => bcrypt('password'),
            'role' => Role::Teacher->value,
            'is_active' => true,
        ]);
    }

    public function test_user_can_list_only_own_notifications(): void
    {
        Notification::create([
            'user_id' => $this->user1->id,
            'school_id' => $this->school->id,
            'title' => 'User 1 Notification',
            'message' => 'Message for user 1',
            'type' => 'info',
        ]);

        Notification::create([
            'user_id' => $this->user2->id,
            'school_id' => $this->school->id,
            'title' => 'User 2 Notification',
            'message' => 'Message for user 2',
            'type' => 'warning',
        ]);

        $response = $this->actingAs($this->user1, 'sanctum')
            ->getJson('/api/notifications');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'notifications');
        $this->assertEquals('User 1 Notification', $response->json('notifications.0.title'));
        $this->assertEquals(1, $response->json('unread_count'));
    }

    public function test_user_can_mark_notification_as_read_and_unread(): void
    {
        $notif = Notification::create([
            'user_id' => $this->user1->id,
            'school_id' => $this->school->id,
            'title' => 'Fee Reminder',
            'message' => 'Please pay term fee',
            'type' => 'finance',
            'read_at' => null,
        ]);

        $this->assertNull($notif->read_at);

        // Mark as read
        $readRes = $this->actingAs($this->user1, 'sanctum')
            ->patchJson("/api/notifications/{$notif->id}/read");

        $readRes->assertStatus(200);
        $this->assertNotNull($notif->fresh()->read_at);

        // Mark as unread
        $unreadRes = $this->actingAs($this->user1, 'sanctum')
            ->patchJson("/api/notifications/{$notif->id}/unread");

        $unreadRes->assertStatus(200);
        $this->assertNull($notif->fresh()->read_at);
    }

    public function test_user_cannot_read_or_unread_another_users_notification(): void
    {
        $notif = Notification::create([
            'user_id' => $this->user1->id,
            'school_id' => $this->school->id,
            'title' => 'Confidential',
            'message' => 'Admin only message',
            'type' => 'urgent',
        ]);

        $response = $this->actingAs($this->user2, 'sanctum')
            ->patchJson("/api/notifications/{$notif->id}/read");

        $response->assertStatus(403);
    }

    public function test_user_can_soft_delete_own_notification(): void
    {
        $notif = Notification::create([
            'user_id' => $this->user1->id,
            'school_id' => $this->school->id,
            'title' => 'To be deleted',
            'message' => 'Temporary alert',
            'type' => 'info',
        ]);

        $delRes = $this->actingAs($this->user1, 'sanctum')
            ->deleteJson("/api/notifications/{$notif->id}");

        $delRes->assertStatus(200);

        // Assert soft deleted in database
        $this->assertSoftDeleted('user_notifications', ['id' => $notif->id]);

        // Active listing does not show it
        $listRes = $this->actingAs($this->user1, 'sanctum')
            ->getJson('/api/notifications');
        $listRes->assertJsonCount(0, 'notifications');

        // Archived listing shows it
        $archiveRes = $this->actingAs($this->user1, 'sanctum')
            ->getJson('/api/notifications?filter=archived');
        $archiveRes->assertJsonCount(1, 'notifications');
        $this->assertEquals($notif->id, $archiveRes->json('notifications.0.id'));
    }

    public function test_user_cannot_soft_delete_another_users_notification(): void
    {
        $notif = Notification::create([
            'user_id' => $this->user1->id,
            'school_id' => $this->school->id,
            'title' => 'User 1 Note',
            'message' => 'Hello',
        ]);

        $response = $this->actingAs($this->user2, 'sanctum')
            ->deleteJson("/api/notifications/{$notif->id}");

        $response->assertStatus(403);
        $this->assertNotSoftDeleted('user_notifications', ['id' => $notif->id]);
    }

    public function test_user_can_restore_soft_deleted_notification(): void
    {
        $notif = Notification::create([
            'user_id' => $this->user1->id,
            'school_id' => $this->school->id,
            'title' => 'Restorable Note',
            'message' => 'Will be restored',
        ]);
        $notif->delete();
        $this->assertSoftDeleted('user_notifications', ['id' => $notif->id]);

        $restoreRes = $this->actingAs($this->user1, 'sanctum')
            ->postJson("/api/notifications/{$notif->id}/restore");

        $restoreRes->assertStatus(200);
        $this->assertNotSoftDeleted('user_notifications', ['id' => $notif->id]);
    }

    public function test_user_can_mark_all_notifications_as_read(): void
    {
        Notification::create([
            'user_id' => $this->user1->id,
            'school_id' => $this->school->id,
            'title' => 'Notif 1',
            'message' => 'Message 1',
            'read_at' => null,
        ]);
        Notification::create([
            'user_id' => $this->user1->id,
            'school_id' => $this->school->id,
            'title' => 'Notif 2',
            'message' => 'Message 2',
            'read_at' => null,
        ]);

        $this->assertEquals(2, Notification::forUser($this->user1->id)->unread()->count());

        $response = $this->actingAs($this->user1, 'sanctum')
            ->postJson('/api/notifications/mark-all-read');

        $response->assertStatus(200);
        $this->assertEquals(0, Notification::forUser($this->user1->id)->unread()->count());
    }

    public function test_unread_count_endpoint(): void
    {
        Notification::create([
            'user_id' => $this->user1->id,
            'title' => 'Notif 1',
            'message' => 'Message 1',
            'read_at' => null,
        ]);

        $response = $this->actingAs($this->user1, 'sanctum')
            ->getJson('/api/notifications/unread-count');

        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('unread_count'));
    }
}
