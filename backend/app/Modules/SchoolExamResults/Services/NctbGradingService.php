<?php

namespace App\Modules\SchoolExamResults\Services;

class NctbGradingService
{
    /**
     * Calculate individual subject GPA and Grade based on NCTB scale (out of 100).
     *
     * @param float $totalMark Combined mark out of 100
     * @return array{gpa: float, grade: string}
     */
    public function calculateSubjectGrade(float $totalMark): array
    {
        $mark = round($totalMark, 2);

        if ($mark >= 80.00) {
            return ['gpa' => 5.00, 'grade' => 'A+'];
        } elseif ($mark >= 70.00) {
            return ['gpa' => 4.00, 'grade' => 'A'];
        } elseif ($mark >= 60.00) {
            return ['gpa' => 3.50, 'grade' => 'A-'];
        } elseif ($mark >= 50.00) {
            return ['gpa' => 3.00, 'grade' => 'B'];
        } elseif ($mark >= 40.00) {
            return ['gpa' => 2.00, 'grade' => 'C'];
        } elseif ($mark >= 33.00) {
            return ['gpa' => 1.00, 'grade' => 'D'];
        } else {
            return ['gpa' => 0.00, 'grade' => 'F'];
        }
    }

    /**
     * Map a final GPA back to the corresponding NCTB Letter Grade.
     */
    public function gpaToLetterGrade(float $gpa, bool $hasFailedMainSubject = false): string
    {
        if ($hasFailedMainSubject || $gpa < 1.00) {
            return 'F';
        }
        if ($gpa >= 5.00) {
            return 'A+';
        }
        if ($gpa >= 4.00) {
            return 'A';
        }
        if ($gpa >= 3.50) {
            return 'A-';
        }
        if ($gpa >= 3.00) {
            return 'B';
        }
        if ($gpa >= 2.00) {
            return 'C';
        }
        return 'D';
    }

    /**
     * Calculate final composite GPA applying Bangladesh 4th Subject rules.
     *
     * Rules:
     * - If any main subject is F (0.00), final GPA is 0.00 (Failed).
     * - 4th Subject Rule: Subtract 2.00 from 4th subject's GPA; add remainder (> 0) to total grade points.
     * - Average is taken over count of MAIN subjects only.
     * - Maximum GPA cannot exceed 5.00.
     *
     * @param array<int, array{gpa: float, is_4th_subject: bool}> $subjectGrades
     * @return array{
     *     final_gpa: float,
     *     final_grade: string,
     *     passed: bool,
     *     has_failed_main_subject: bool,
     *     fourth_subject_bonus: float,
     *     total_grade_points: float,
     *     main_subject_count: int
     * }
     */
    public function calculateFinalGpa(array $subjectGrades): array
    {
        $mainPoints = 0.00;
        $mainCount = 0;
        $hasFailedMain = false;
        $fourthSubjectBonus = 0.00;

        foreach ($subjectGrades as $sub) {
            $gpa = (float) $sub['gpa'];
            $is4th = (bool) ($sub['is_4th_subject'] ?? false);

            if ($is4th) {
                if ($gpa > 2.00) {
                    $fourthSubjectBonus += ($gpa - 2.00);
                }
            } else {
                $mainCount++;
                $mainPoints += $gpa;
                if ($gpa == 0.00) {
                    $hasFailedMain = true;
                }
            }
        }

        if ($mainCount === 0) {
            return [
                'final_gpa' => 0.00,
                'final_grade' => 'F',
                'passed' => false,
                'has_failed_main_subject' => true,
                'fourth_subject_bonus' => 0.00,
                'total_grade_points' => 0.00,
                'main_subject_count' => 0,
            ];
        }

        if ($hasFailedMain) {
            return [
                'final_gpa' => 0.00,
                'final_grade' => 'F',
                'passed' => false,
                'has_failed_main_subject' => true,
                'fourth_subject_bonus' => round($fourthSubjectBonus, 2),
                'total_grade_points' => round($mainPoints + $fourthSubjectBonus, 2),
                'main_subject_count' => $mainCount,
            ];
        }

        $totalPoints = $mainPoints + $fourthSubjectBonus;
        $calculatedGpa = round($totalPoints / $mainCount, 2);

        $finalGpa = min(5.00, $calculatedGpa);
        $finalGrade = $this->gpaToLetterGrade($finalGpa, false);

        return [
            'final_gpa' => $finalGpa,
            'final_grade' => $finalGrade,
            'passed' => true,
            'has_failed_main_subject' => false,
            'fourth_subject_bonus' => round($fourthSubjectBonus, 2),
            'total_grade_points' => round($totalPoints, 2),
            'main_subject_count' => $mainCount,
        ];
    }
}

