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
        Schema::create('exam_marks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();

            $table->decimal('subjective_mark', 5, 2)->default(0.00); // CQ (Creative Question)
            $table->decimal('objective_mark', 5, 2)->default(0.00);  // MCQ
            $table->decimal('practical_mark', 5, 2)->default(0.00);  // Practical / Lab
            $table->decimal('total_mark', 5, 2)->default(0.00);      // Combined sum

            $table->boolean('is_4th_subject')->default(false);       // Bangladesh 4th Subject Rule flag
            $table->decimal('gpa', 3, 2)->default(0.00);             // 0.00 - 5.00
            $table->string('grade', 3)->default('F');                // A+, A, A-, B, C, D, F
            $table->timestamps();

            $table->unique(['school_id', 'academic_year_id', 'student_id', 'exam_id', 'subject_id'], 'unique_student_exam_subject');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_marks');
    }
};

