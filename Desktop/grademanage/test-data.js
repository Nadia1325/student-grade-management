const mongoose = require('mongoose');
const User = require('./backend/models/User');
const Course = require('./backend/models/Course');

async function createTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/grade_management');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create test professor
    const professor = new User({
      firstName: 'John',
      lastName: 'Smith',
      email: 'professor@test.com',
      password: 'password123',
      role: 'professor',
      department: 'Computer Science',
      isActive: true,
      isVerified: true
    });
    await professor.save();
    console.log('👨‍🏫 Created professor:', professor.email);

    // Create test students
    const students = [];
    for (let i = 1; i <= 5; i++) {
      const student = new User({
        firstName: `Student${i}`,
        lastName: 'Test',
        email: `student${i}@test.com`,
        password: 'password123',
        role: 'student',
        studentId: `2024${i.toString().padStart(4, '0')}`,
        department: 'Computer Science',
        isActive: true,
        isVerified: true
      });
      await student.save();
      students.push(student);
      console.log('👨‍🎓 Created student:', student.email);
    }

    // Create test courses
    const courses = [
      {
        courseCode: 'CS101',
        name: 'Introduction to Computer Science',
        description: 'Basic concepts of computer science and programming',
        semester: 'Fall',
        academicYear: '2024-2025',
        credits: 3,
        professor: professor._id,
        maxStudents: 30,
        isActive: true,
        isPublished: true,
        schedule: {
          days: ['Monday', 'Wednesday'],
          startTime: '10:00',
          endTime: '11:30',
          room: 'CS-101',
          building: 'Computer Science Building'
        }
      },
      {
        courseCode: 'CS201',
        name: 'Data Structures and Algorithms',
        description: 'Advanced data structures and algorithm design',
        semester: 'Fall',
        academicYear: '2024-2025',
        credits: 4,
        professor: professor._id,
        maxStudents: 25,
        isActive: true,
        isPublished: true,
        schedule: {
          days: ['Tuesday', 'Thursday'],
          startTime: '14:00',
          endTime: '15:30',
          room: 'CS-201',
          building: 'Computer Science Building'
        }
      },
      {
        courseCode: 'MATH101',
        name: 'Calculus I',
        description: 'Introduction to differential and integral calculus',
        semester: 'Spring',
        academicYear: '2024-2025',
        credits: 4,
        professor: professor._id,
        maxStudents: 35,
        isActive: true,
        isPublished: true,
        schedule: {
          days: ['Monday', 'Wednesday', 'Friday'],
          startTime: '09:00',
          endTime: '10:00',
          room: 'MATH-101',
          building: 'Mathematics Building'
        }
      }
    ];

    const createdCourses = [];
    for (const courseData of courses) {
      const course = new Course(courseData);
      await course.save();
      createdCourses.push(course);
      console.log('📚 Created course:', course.courseCode, '-', course.name);
    }

    // Enroll some students in courses
    console.log('\n📝 Enrolling students in courses...');

    // Enroll first 3 students in CS101
    for (let i = 0; i < 3; i++) {
      await createdCourses[0].enrollStudent(students[i]._id);
      students[i].enrolledCourses.push(createdCourses[0]._id);
      await students[i].save();
      console.log(`✅ Enrolled ${students[i].firstName} in ${createdCourses[0].courseCode}`);
    }

    // Enroll first 2 students in CS201
    for (let i = 0; i < 2; i++) {
      await createdCourses[1].enrollStudent(students[i]._id);
      students[i].enrolledCourses.push(createdCourses[1]._id);
      await students[i].save();
      console.log(`✅ Enrolled ${students[i].firstName} in ${createdCourses[1].courseCode}`);
    }

    // Enroll students 2, 3, 4 in MATH101
    for (let i = 1; i < 4; i++) {
      await createdCourses[2].enrollStudent(students[i]._id);
      students[i].enrolledCourses.push(createdCourses[2]._id);
      await students[i].save();
      console.log(`✅ Enrolled ${students[i].firstName} in ${createdCourses[2].courseCode}`);
    }

    console.log('\n🎉 Test data creation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Professor: ${professor.email} (password: password123)`);
    console.log(`- Students: ${students.length} created`);
    console.log(`- Courses: ${createdCourses.length} created`);
    console.log(`- Enrollments: Created various enrollments`);

    console.log('\n🔑 Test Credentials:');
    console.log('Professor Login: professor@test.com / password123');
    students.forEach((student, index) => {
      console.log(`Student ${index + 1} Login: ${student.email} / password123`);
    });

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
createTestData();
