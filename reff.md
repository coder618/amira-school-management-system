Backend API: http://127.0.0.1:8000
Frontend SPA: http://localhost:5173

Start backend: npm run dev:backend (or cd backend && php artisan serve --port=8000)
Start frontend: npm run dev:frontend (or cd frontend && npm run dev)
Build static files: npm run build:frontend (or cd frontend && npm run build)
Reset & seed database: npm run seed:backend



| Entity | User Account Created? | Assigned Role | Linked Fields | Credentials Generated |
| --- | --- | --- | --- | --- |
| Teacher | Yes (Automated) | `Role::Teacher` (`'Teacher'`) | `school_id`, `user_id` | Email provided + password (`teacher123` default) |
| Student | Yes (Now Automated) | `Role::Student` (`'Student'`) | `school_id`, `user_id` | Custom email or institutional email (`stu<id>@student.school.edu.bd`) + password (`student123` default) |

