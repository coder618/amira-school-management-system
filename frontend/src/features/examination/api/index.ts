import { apiClient } from '../../../shared/services/apiClient';
import { Exam, Subject, ExamMark, StudentReportCard } from '../types';

export const examinationApi = {
  getExams: async (): Promise<Exam[]> => {
    const res = await apiClient.get<Exam[]>('/exams');
    return res.data;
  },

  getSubjects: async (classLevelId?: number): Promise<Subject[]> => {
    const res = await apiClient.get<Subject[]>('/subjects', { params: { class_level_id: classLevelId } });
    return res.data;
  },

  submitExamMarks: async (marks: Partial<ExamMark>[]): Promise<{ message: string; count: number }> => {
    const res = await apiClient.post<{ message: string; count: number }>('/exam-marks/bulk', { marks });
    return res.data;
  },

  getStudentReportCard: async (studentId: number, examId: number): Promise<StudentReportCard> => {
    const res = await apiClient.get<StudentReportCard>(`/report-cards/${studentId}/exam/${examId}`);
    return res.data;
  },

  downloadStudentReportCardPdf: async (studentId: number, examId: number, filename?: string): Promise<void> => {
    const res = await apiClient.get(`/school-exam-results/report-card/${studentId}/exam/${examId}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || `Result-Slip-Student-${studentId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};

