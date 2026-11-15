<?php

namespace Tests\Feature;

use App\Modules\Core\Enums\Role;
use App\Modules\Core\Models\School;
use App\Modules\Core\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfilePictureTest extends TestCase
{
    use RefreshDatabase;

    protected School $school;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $this->school = School::create([
            'name' => 'Dhaka Model School',
            'code' => 'DMS-01',
            'board' => 'Dhaka',
            'is_active' => true,
        ]);

        $this->user = User::create([
            'school_id' => $this->school->id,
            'name' => 'Test User',
            'email' => 'user@school.com',
            'password' => bcrypt('password'),
            'role' => Role::Admin->value,
            'is_active' => true,
        ]);
    }

    public function test_user_can_upload_profile_picture(): void
    {
        $file = UploadedFile::fake()->image('avatar.png', 200, 200);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/user/profile-picture', [
                'profile_picture' => $file,
            ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'message',
            'user' => ['id', 'name', 'profile_picture', 'profile_picture_url'],
            'profile_picture_url',
        ]);

        $this->user->refresh();
        $this->assertNotNull($this->user->profile_picture);
        Storage::disk('public')->assertExists($this->user->profile_picture);

        // Verify media table has the record
        $this->assertDatabaseHas('media', [
            'user_id' => $this->user->id,
            'collection_name' => 'profile_pictures',
            'file_path' => $this->user->profile_picture,
        ]);
    }

    public function test_uploading_new_picture_deletes_previous_one(): void
    {
        $file1 = UploadedFile::fake()->image('old_avatar.png');
        $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/user/profile-picture', ['profile_picture' => $file1]);

        $this->user->refresh();
        $oldPath = $this->user->profile_picture;
        Storage::disk('public')->assertExists($oldPath);

        // Upload new one
        $file2 = UploadedFile::fake()->image('new_avatar.jpg');
        $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/user/profile-picture', ['profile_picture' => $file2]);

        $this->user->refresh();
        $newPath = $this->user->profile_picture;
        $this->assertNotEquals($oldPath, $newPath);
        Storage::disk('public')->assertExists($newPath);
        Storage::disk('public')->assertMissing($oldPath);
    }

    public function test_user_can_delete_profile_picture(): void
    {
        $file = UploadedFile::fake()->image('avatar.png');
        $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/user/profile-picture', ['profile_picture' => $file]);

        $this->user->refresh();
        $path = $this->user->profile_picture;
        Storage::disk('public')->assertExists($path);

        $delRes = $this->actingAs($this->user, 'sanctum')
            ->deleteJson('/api/user/profile-picture');

        $delRes->assertStatus(200);
        $this->user->refresh();
        $this->assertNull($this->user->profile_picture);
        $this->assertNull($this->user->profile_picture_url);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_non_image_file_is_rejected(): void
    {
        $pdf = UploadedFile::fake()->create('document.pdf', 500, 'application/pdf');

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/user/profile-picture', [
                'profile_picture' => $pdf,
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['profile_picture']);
    }

    public function test_unauthenticated_user_cannot_upload_profile_picture(): void
    {
        $file = UploadedFile::fake()->image('avatar.png');

        $response = $this->postJson('/api/user/profile-picture', [
            'profile_picture' => $file,
        ]);

        $response->assertStatus(401);
    }

    public function test_media_module_retrieves_user_profile_pictures(): void
    {
        $file = UploadedFile::fake()->image('avatar_media.jpg', 300, 300);

        $uploadRes = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/user/profile-picture', ['file' => $file]);

        $uploadRes->assertStatus(200);

        // Retrieve via Media Module endpoint
        $mediaRes = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/media?collection_name=profile_pictures&user_id=' . $this->user->id);

        $mediaRes->assertStatus(200);
        $mediaRes->assertJsonFragment(['collection_name' => 'profile_pictures']);
        $this->assertEquals(1, $mediaRes->json('total'));
    }

    public function test_user_can_set_profile_picture_from_existing_media_id(): void
    {
        // 1. Upload via Media Module directly
        $file = UploadedFile::fake()->image('direct_media.png');
        $mediaUploadRes = $this->actingAs($this->user, 'sanctum')
            ->post('/api/media/upload', [
                'file' => $file,
                'collection_name' => 'profile_pictures',
            ]);

        $mediaUploadRes->assertStatus(201);
        $mediaId = $mediaUploadRes->json('data.id');
        $mediaPath = $mediaUploadRes->json('data.file_path');

        // 2. Set profile picture using media_id
        $setRes = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/user/profile-picture', [
                'media_id' => $mediaId,
            ]);

        $setRes->assertStatus(200);
        $this->user->refresh();
        $this->assertEquals($mediaPath, $this->user->profile_picture);
    }

    public function test_user_profile_endpoint_returns_user_details(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/users/{$this->user->id}");

        $response->assertStatus(200)
            ->assertJsonPath('user.id', $this->user->id)
            ->assertJsonPath('user.email', $this->user->email);
    }
}
