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
        Schema::table('students', function (Blueprint $table) {
            $table->string('student_image')->nullable()->after('address');
            $table->string('parent_image')->nullable()->after('student_image');
            $table->string('father_image')->nullable()->after('parent_image');
            $table->string('mother_image')->nullable()->after('father_image');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['student_image', 'parent_image', 'father_image', 'mother_image']);
        });
    }
};
