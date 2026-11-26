/** The program sections shown as tabs under the program header. */
const SECTIONS = [
  { slug: 'courses', label: 'Courses' },
  { slug: 'calendar', label: 'Calendar' },
  { slug: 'requests', label: 'Requests' },
  { slug: 'attendance', label: 'Attendance', hideForInstructor: true },
  { slug: 'certificate', label: 'Certificate', learnerOnly: true },
];

export default SECTIONS;
