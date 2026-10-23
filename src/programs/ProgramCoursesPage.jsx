import React from 'react';
import { useParams } from 'react-router-dom';
import { Spinner, Alert } from '@openedx/paragon';
import { useConfig, USER_ROLE } from '@edly-io/frontend-component-fbr';
import CourseCard from './CourseCard';
import { useProgramCourses, useProgram, useLearnerCourseMap } from '../app/hooks';

const ProgramCoursesPage = () => {
  const { programId } = useParams();
  const { courses, loading, error } = useProgramCourses(programId);
  const { program } = useProgram(programId);
  const { data: config } = useConfig();
  const { courseMap } = useLearnerCourseMap();
  const isInstructor = config?.user_role === USER_ROLE.INSTRUCTOR;

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" screenReaderText="Loading courses" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div>
      {program?.description && (
        <p className="program-courses__description">{program.description}</p>
      )}

      <h2 className="program-courses__heading">
        Courses
        {courses.length > 0 && (
          <span className="program-courses__count">({courses.length})</span>
        )}
      </h2>

      {isInstructor && courses.length > 0 && (
        <p className="program-courses__instructor-note">
          Showing courses you are assigned to teach.
        </p>
      )}

      {!courses.length ? (
        <div className="program-courses__empty">
          {isInstructor
            ? "You haven't been assigned to any courses in this program yet. Contact your administrator."
            : 'No courses in this program yet.'}
        </div>
      ) : (
        courses.map((course) => (
          <CourseCard
            key={course.course_key}
            course={course}
            isInstructor={isInstructor}
            learnerData={courseMap[course.course_key] || null}
          />
        ))
      )}
    </div>
  );
};

export default ProgramCoursesPage;
