/**
 * db-templates.ts
 *
 * Curriculum database templates for the in-browser PGlite instance.
 *
 * Each template is a self-contained SQL script (DDL + seed data) that can be
 * executed directly against a PGlite database. Templates are intentionally
 * idempotent — each one starts by dropping its own tables — so a template can
 * be safely re-loaded or swapped for another one without leaving stale
 * objects behind.
 *
 * Design notes for anyone editing the seed data below:
 *  - Primary keys are inserted explicitly (rather than relying purely on
 *    SERIAL) so that self-referencing / cross-referencing foreign keys
 *    (e.g. an employee's manager, a project's lead) can be wired up without
 *    needing multi-pass inserts.
 *  - Because explicit ids are inserted, every SERIAL sequence is fast-forwarded
 *    with `setval(pg_get_serial_sequence(...))` immediately after its table is
 *    seeded. Skipping this step is a classic gotcha: the next INSERT a student
 *    runs without specifying an id would collide with a seeded row and throw
 *    a duplicate key error. This has been verified end-to-end against a real
 *    PGlite instance, including round-tripping between templates.
 */

export type DbTemplateId = "university" | "company";

export interface DbTemplate {
  id: DbTemplateId;
  name: string;
  description: string;
  /** Raw SQL (DDL + seed data) executed as-is against the PGlite instance. */
  sql: string;
}

const UNIVERSITY_SQL = `
-- Drop in dependency order so this template can be re-run or swapped safely.
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS students CASCADE;

CREATE TABLE students (
  student_id SERIAL PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  major VARCHAR(60) NOT NULL,
  gpa NUMERIC(3,2) CHECK (gpa >= 0.0 AND gpa <= 4.0),
  enrollment_year INT NOT NULL
);

CREATE TABLE courses (
  course_id SERIAL PRIMARY KEY,
  course_code VARCHAR(10) UNIQUE NOT NULL,
  course_name VARCHAR(100) NOT NULL,
  credits INT NOT NULL CHECK (credits BETWEEN 1 AND 6),
  department VARCHAR(50) NOT NULL,
  instructor VARCHAR(100) NOT NULL
);

CREATE TABLE enrollments (
  enrollment_id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  semester VARCHAR(20) NOT NULL,
  grade VARCHAR(2),
  UNIQUE (student_id, course_id, semester)
);

INSERT INTO students (student_id, first_name, last_name, email, major, gpa, enrollment_year) VALUES
  (1, 'Ayesha', 'Khan', 'ayesha.khan@campus.edu', 'Computer Science', 3.82, 2023),
  (2, 'Bilal', 'Ahmed', 'bilal.ahmed@campus.edu', 'Computer Science', 3.10, 2022),
  (3, 'Sara', 'Malik', 'sara.malik@campus.edu', 'Mathematics', 3.95, 2023),
  (4, 'Usman', 'Farooq', 'usman.farooq@campus.edu', 'Electrical Engineering', 2.76, 2021),
  (5, 'Hina', 'Riaz', 'hina.riaz@campus.edu', 'Computer Science', 3.44, 2022),
  (6, 'Danish', 'Iqbal', 'danish.iqbal@campus.edu', 'Business Administration', 2.98, 2023),
  (7, 'Zainab', 'Hussain', 'zainab.hussain@campus.edu', 'Mathematics', 3.67, 2021),
  (8, 'Omar', 'Sheikh', 'omar.sheikh@campus.edu', 'Electrical Engineering', 3.21, 2022);

SELECT setval(pg_get_serial_sequence('students', 'student_id'), (SELECT MAX(student_id) FROM students));

INSERT INTO courses (course_id, course_code, course_name, credits, department, instructor) VALUES
  (1, 'CS101', 'Introduction to Programming', 3, 'Computer Science', 'Dr. Farah Zaidi'),
  (2, 'CS201', 'Data Structures & Algorithms', 4, 'Computer Science', 'Dr. Imran Latif'),
  (3, 'CS305', 'Database Systems', 3, 'Computer Science', 'Dr. Nadia Aslam'),
  (4, 'MATH210', 'Linear Algebra', 3, 'Mathematics', 'Dr. Kamran Yousaf'),
  (5, 'EE150', 'Circuit Analysis', 4, 'Electrical Engineering', 'Dr. Adeel Chaudhry'),
  (6, 'BUS110', 'Principles of Management', 3, 'Business Administration', 'Dr. Sana Tariq');

SELECT setval(pg_get_serial_sequence('courses', 'course_id'), (SELECT MAX(course_id) FROM courses));

INSERT INTO enrollments (student_id, course_id, semester, grade) VALUES
  (1, 1, 'Fall 2023', 'A'),
  (1, 2, 'Spring 2024', 'A-'),
  (1, 3, 'Fall 2024', 'B+'),
  (2, 1, 'Fall 2022', 'B'),
  (2, 2, 'Spring 2023', 'C+'),
  (2, 5, 'Fall 2023', 'B-'),
  (3, 4, 'Fall 2023', 'A'),
  (3, 2, 'Spring 2024', 'A'),
  (4, 5, 'Fall 2021', 'B'),
  (4, 4, 'Spring 2022', 'C'),
  (5, 1, 'Fall 2022', 'A-'),
  (5, 3, 'Spring 2024', 'B+'),
  (6, 6, 'Fall 2023', 'B'),
  (6, 4, 'Spring 2024', 'C+'),
  (7, 4, 'Fall 2021', 'A'),
  (7, 2, 'Spring 2022', 'A-'),
  (8, 5, 'Fall 2022', 'B+'),
  (8, 1, 'Spring 2023', 'B');
`;

const COMPANY_SQL = `
-- Drop in dependency order so this template can be re-run or swapped safely.
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

CREATE TABLE departments (
  department_id SERIAL PRIMARY KEY,
  department_name VARCHAR(100) UNIQUE NOT NULL,
  location VARCHAR(100) NOT NULL,
  budget NUMERIC(12,2) NOT NULL
);

CREATE TABLE employees (
  employee_id SERIAL PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  job_title VARCHAR(100) NOT NULL,
  department_id INT REFERENCES departments(department_id) ON DELETE SET NULL,
  manager_id INT REFERENCES employees(employee_id) ON DELETE SET NULL,
  salary NUMERIC(10,2) NOT NULL,
  hire_date DATE NOT NULL
);

CREATE TABLE projects (
  project_id SERIAL PRIMARY KEY,
  project_name VARCHAR(150) NOT NULL,
  department_id INT REFERENCES departments(department_id) ON DELETE CASCADE,
  lead_employee_id INT REFERENCES employees(employee_id) ON DELETE SET NULL,
  budget NUMERIC(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','on-hold','cancelled')),
  start_date DATE NOT NULL,
  end_date DATE
);

INSERT INTO departments (department_id, department_name, location, budget) VALUES
  (1, 'Engineering', 'Lahore', 4500000.00),
  (2, 'Sales', 'Karachi', 2200000.00),
  (3, 'Marketing', 'Islamabad', 1300000.00),
  (4, 'Human Resources', 'Lahore', 650000.00);

SELECT setval(pg_get_serial_sequence('departments', 'department_id'), (SELECT MAX(department_id) FROM departments));

-- Managers are inserted first with manager_id = NULL, then their reports
-- reference them by id, so the self-referencing FK never points forward.
INSERT INTO employees (employee_id, first_name, last_name, email, job_title, department_id, manager_id, salary, hire_date) VALUES
  (1, 'Farhan', 'Qureshi', 'farhan.qureshi@company.com', 'VP of Engineering', 1, NULL, 380000.00, '2018-03-01'),
  (2, 'Mehwish', 'Aziz', 'mehwish.aziz@company.com', 'Sales Director', 2, NULL, 340000.00, '2019-01-15'),
  (3, 'Kashif', 'Nawaz', 'kashif.nawaz@company.com', 'Marketing Lead', 3, NULL, 250000.00, '2020-06-10'),
  (4, 'Rabia', 'Saeed', 'rabia.saeed@company.com', 'HR Manager', 4, NULL, 210000.00, '2019-09-01'),
  (5, 'Talha', 'Mirza', 'talha.mirza@company.com', 'Senior Software Engineer', 1, 1, 260000.00, '2020-02-11'),
  (6, 'Iqra', 'Bhatti', 'iqra.bhatti@company.com', 'Software Engineer', 1, 1, 190000.00, '2021-07-19'),
  (7, 'Noman', 'Yasin', 'noman.yasin@company.com', 'Software Engineer', 1, 5, 185000.00, '2022-04-04'),
  (8, 'Sadia', 'Chaudhry', 'sadia.chaudhry@company.com', 'Account Executive', 2, 2, 175000.00, '2021-11-23'),
  (9, 'Waqas', 'Anjum', 'waqas.anjum@company.com', 'Account Executive', 2, 2, 168000.00, '2022-08-15'),
  (10, 'Fatima', 'Siddiqui', 'fatima.siddiqui@company.com', 'Marketing Analyst', 3, 3, 150000.00, '2023-01-09');

SELECT setval(pg_get_serial_sequence('employees', 'employee_id'), (SELECT MAX(employee_id) FROM employees));

INSERT INTO projects (project_id, project_name, department_id, lead_employee_id, budget, status, start_date, end_date) VALUES
  (1, 'Checkout Revamp', 1, 5, 620000.00, 'active', '2024-01-08', NULL),
  (2, 'Mobile App Rewrite', 1, 1, 950000.00, 'active', '2023-09-01', NULL),
  (3, 'Q3 Sales Campaign', 2, 2, 310000.00, 'completed', '2023-06-01', '2023-09-30'),
  (4, 'Brand Refresh', 3, 3, 180000.00, 'on-hold', '2024-02-15', NULL),
  (5, 'Employee Onboarding Portal', 4, 4, 95000.00, 'completed', '2023-03-01', '2023-05-20');

SELECT setval(pg_get_serial_sequence('projects', 'project_id'), (SELECT MAX(project_id) FROM projects));
`;

export const DB_TEMPLATES: Record<DbTemplateId, DbTemplate> = {
  university: {
    id: "university",
    name: "University",
    description: "Students, Courses & Enrollments — joins, GROUP BY, and aggregate practice.",
    sql: UNIVERSITY_SQL,
  },
  company: {
    id: "company",
    name: "Company",
    description: "Employees, Departments & Projects — self-joins and hierarchy practice.",
    sql: COMPANY_SQL,
  },
};

export const DB_TEMPLATE_LIST: DbTemplate[] = Object.values(DB_TEMPLATES);
