<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->foreignId('class_level_id')->constrained('class_levels')->cascadeOnDelete();
            $table->string('name'); // Bangla 1st Paper, English, General Math, Higher Math, Biology
            $table->string('code')->nullable(); // 101, 107, 109, etc.
            $table->decimal('full_mark', 5, 2)->default(100.00);
            $table->decimal('pass_mark', 5, 2)->default(33.00);
            $table->boolean('is_optional')->default(false);
            $table->boolean('can_be_4th_subject')->default(false);
            $table->timestamps();

            $table->unique(['school_id', 'academic_year_id', 'class_level_id', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subjects');
    }
};

