import Course from "../models/course.model.js";
import AppError from "../utils/error.util.js";
import cloudinary from "cloudinary";
import fs from "fs/promises";

const getAllCourses = async function (req, res, next) {
  try {
    const courses = await Course.find({}).select("-lectures");

    res.status(200).json({
      success: true,
      message: "All courses",
      courses,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

const getLecturesByCourseId = async function (req, res, next) {
  try {
    const { id } = req.params;
    // console.log("id:  " + id);

    const course = await Course.findById(id);
    // console.log("course :  "+course);

    if (!course) {
      return next(new AppError("Invalid course id", 400));
    }

    res.status(200).json({
      success: true,
      message: "Course lectures fetched successfully",
      lectures: course.lectures,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

const createCourse = async function (req, res, next) {
  const { title, description, category, createdBy } = req.body;

  if (!title || !description || !category || !createdBy) {
    return next(new AppError("All field are required", 400));
  }

  const course = await Course.create({
    title,
    description,
    category,
    createdBy,
    thumbnail: {
      public_id: "Dummy",
      secure_url: "Dummy",
    },
  });

  if (!course) {
    return next(
      new AppError("Course could not be created, please try again", 500)
    );
  }
  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
      });
      console.log(JSON.stringify(result));

      if (result) {
        course.thumbnail.public_id = result.public_id;
        course.thumbnail.secure_url = result.secure_url;
      }

      fs.rm(`uploads/${req.file.filename}`);
    } catch (e) {
      return next(new AppError(e.message, 500));
    }
  }

  await course.save();

  res.status(200).json({
    success: true,
    message: "Course created successfully",
    course,
  });
};
// to  updatecourse  give course id in url and json data (PUT)
const updateCourse = async function (req, res, next) {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndUpdate(
      id,
      { $set: req.body },
      { runValidators: true, new: true }
    );

    if (!course) {
      return next(new AppError("Course with given id does not exist", 500));
    }

    res.status(200).json({
      success: true,
      message: "Course updated successfully ✔",
      course,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

// to delete give course id in url (DELETE)
const removeCourse = async function (req, res, next) {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      return next(new AppError("Course with given id does not exist", 404));
    }

    // Use Course.findByIdAndDelete to delete the course
    await Course.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Course deleted successfully ✔",
      course,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};
// to addlecture give courese id in url (POST)
const addLectureToCourseById = async function (req, res, next) {
  try {
    const { title, description } = req.body;
    const { id } = req.params;

    if (!title || !description) {
      return next(new AppError("All fields are required", 400));
    }
    const course = await Course.findById(id);

    if (!course) {
      return next(new AppError("Course does not exist with the given id", 500));
    }

    const lecturesDate = {
      title,
      description,
      lectures: {}, // Initialize `lectures` object here
    };

    if (req.file) {
      try {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: "lms",
        });
        console.log("Result:==", JSON.stringify(result));

        if (result) {
          // Place `public_id` and `secure_url` inside the `lectures` object
          lecturesDate.lectures.public_id = result.public_id;
          lecturesDate.lectures.secure_url = result.secure_url;
        }

        // Clean up the uploaded file
        fs.rm(`uploads/${req.file.filename}`);
      } catch (e) {
        return next(new AppError(e.message, 500));
      }
    }

    console.log("lecture >", JSON.stringify(lecturesDate));

    // Push the updated `lecturesDate` object into `course.lectures`
    course.lectures.push(lecturesDate);

    // Update number of lectures
    course.numbersOfLectures = course.lectures.length;

    await course.save();

    res.status(200).json({
      success: true,
      message: "Lecture successfully added to the course ✔",
      course,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};
// delete give lecture id in url and (DELETE)
const removeLecture = async function (req, res, next) {
  try {
    const { id, lectureId } = req.params;

    const course = await Course.findById(id);

    if (!course) {
      return next(new AppError("Course with given id does not exist", 404));
    }

    const lectureIndex = course.lectures.findIndex(
      (lecture) => lecture.lectures.public_id === lectureId
    );

    if (lectureIndex === -1) {
      return next(new AppError("Lecture with given id does not exist", 404));
    }

    course.lectures.splice(lectureIndex, 1);
    course.numbersOfLectures = course.lectures.length;

    await course.save();

    res.status(200).json({
      success: true,
      message: "Lecture deleted successfully ✔",
      course,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

export {
  getAllCourses,
  getLecturesByCourseId,
  createCourse,
  updateCourse,
  removeCourse,
  addLectureToCourseById,
  removeLecture,
};
