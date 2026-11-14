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
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->foreignId('class_level_id')->constrained('class_levels')->cascadeOnDelete();
            $table->foreignId('section_id')->constrained('sections')->cascadeOnDelete();
            $table->foreignId('shift_id')->nullable()->constrained('shifts')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('student_id')->index(); // unique string per school or system
            $table->integer('roll_number');
            $table->string('first_name');
            $table->string('last_name')->nullable();
            $table->string('father_name');
            $table->string('mother_name');
            $table->string('phone_number', 11); // 11 digits: ^01[3-9]\d{8}$
            $table->string('email')->nullable();
            $table->enum('gender', ['Male', 'Female', 'Other'])->default('Male');
            $table->date('date_of_birth')->nullable();
            $table->text('address')->nullable();
            $table->enum('status', ['active', 'inactive', 'graduated', 'suspended'])->default('active');
            $table->date('enrollment_date')->nullable();
            $table->timestamps();

            $table->unique(['school_id', 'academic_year_id', 'student_id']);
            $table->unique(['school_id', 'academic_year_id', 'class_level_id', 'section_id', 'roll_number'], 'unique_class_section_roll');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};

