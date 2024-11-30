const Course = require("../../models/Course");
const StudentCourses = require("../../models/StudentCourses");

const getAllStudentViewCourses = async (req, res) => {
  try {
    const {
      category = [],
      level = [],
      primaryLanguage = [],
      sortBy = "price-lowtohigh",
    } = req.query;

    console.log(req.query, "req.query");

    let filters = {};
    if (category.length) {
      filters.category = { $in: category.split(",") };
    }
    if (level.length) {
      filters.level = { $in: level.split(",") };
    }
    if (primaryLanguage.length) {
      filters.primaryLanguage = { $in: primaryLanguage.split(",") };
    }

    let sortParam = {};
    switch (sortBy) {
      case "price-lowtohigh":
        sortParam.pricing = 1;

        break;
      case "price-hightolow":
        sortParam.pricing = -1;

        break;
      case "title-atoz":
        sortParam.title = 1;

        break;
      case "title-ztoa":
        sortParam.title = -1;

        break;

      default:
        sortParam.pricing = 1;
        break;
    }

    const coursesList = await Course.find(filters).sort(sortParam);

    res.status(200).json({
      success: true,
      data: coursesList,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getStudentViewCourseDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const courseDetails = await Course.findById(id);

    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "No course details found",
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      data: courseDetails,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const checkCoursePurchaseInfo = async (req, res) => {
  try {
    const { id, studentId } = req.params;

    // Fetch student's purchased courses
    const studentCourses = await StudentCourses.findOne({ userId: studentId });

    console.log("StudentCourses Query Result:", studentCourses);
    console.log("StudentId:", studentId);
    console.log("CourseId:", id);

    // Check if student has purchased courses
    if (!studentCourses || !studentCourses.courses.length) {
      console.log("No courses found for the student. Fetching course details...");
      const courseDetails = await Course.findById(id); // Fetch course details directly
      if (!courseDetails) {
        return res.status(404).json({
          success: false,
          message: "Course not found!",
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          purchased: false,
          courseDetails,
        },
      });
    }

    // Check if the student already purchased the course
    const ifStudentAlreadyBoughtCurrentCourse =
      studentCourses.courses.findIndex((item) => item.courseId === id) > -1;

    if (ifStudentAlreadyBoughtCurrentCourse) {
      const courseDetails = await Course.findById(id); // Fetch purchased course details
      return res.status(200).json({
        success: true,
        data: {
          purchased: true,
          courseDetails,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        purchased: false,
        courseDetails: null,
      },
    });
  } catch (e) {
    console.log("Error:", e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

async function enrollCourse(req, res) {
  try {
    const { userId, courseId, title, instructorId, instructorName, courseImage } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({ success: false, message: "userId and courseId are required." });
    }

    // Find the student's course record
    let studentCourses = await StudentCourses.findOne({ userId });

    // Create the course object
    const course = {
      courseId,
      title,
      instructorId,
      instructorName,
      dateOfPurchase: new Date(),
      courseImage,
    };

    if (!studentCourses) {
      // If the student doesn't have a record yet, create one
      studentCourses = new StudentCourses({
        userId,
        courses: [course],
      });
    } else {
      // Check if the course is already enrolled
      const isAlreadyEnrolled = studentCourses.courses.some(
        (c) => c.courseId === courseId
      );

      if (isAlreadyEnrolled) {
        return res.status(400).json({
          success: false,
          message: "Student is already enrolled in this course.",
        });
      }

      // Add the course to the student's course list
      studentCourses.courses.push(course);
    }

    // Save the updated record
    await studentCourses.save();

    res.status(200).json({
      success: true,
      message: "Successfully enrolled in the course.",
      data: studentCourses,
    });
  } catch (error) {
    console.error("Error enrolling course:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while enrolling in the course.",
    });
  }
}


module.exports = {
  getAllStudentViewCourses,
  getStudentViewCourseDetails,
  checkCoursePurchaseInfo,
  enrollCourse
};
