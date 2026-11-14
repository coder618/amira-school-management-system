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
}
