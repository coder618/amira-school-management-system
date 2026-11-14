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
        Schema::table('class_levels', function (Blueprint $table) {
            $table->unique(['school_id', 'name'], 'class_levels_school_id_name_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('class_levels', function (Blueprint $table) {
            $table->dropUnique('class_levels_school_id_name_unique');
        });
    }
};
