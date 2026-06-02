package resource.backend.academic.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import resource.backend.academic.dto.request.CreateCourseRequest;
import resource.backend.academic.dto.request.UpdateCourseRequest;
import resource.backend.academic.dto.response.CourseResponse;
import resource.backend.academic.entity.Course;
import resource.backend.academic.entity.Semester;
import resource.backend.academic.repository.CourseRepository;
import resource.backend.academic.repository.SemesterRepository;
import resource.backend.academic.service.CourseService;
import resource.backend.folder.entity.Folder;
import resource.backend.folder.repository.FolderRepository;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseServiceImpl implements CourseService {

        private final CourseRepository courseRepository;
        private final SemesterRepository semesterRepository;
        private final FolderRepository folderRepository;

        @Override
        @Transactional(readOnly = true)
        public Page<CourseResponse> getCourses(
                        UUID semesterId,
                        int page,
                        int size) {

                return courseRepository
                                .findBySemesterId(
                                                semesterId,
                                                PageRequest.of(page, size))
                                .map(this::toResponse);
        }

        @Override
        @Transactional(readOnly = true)
        public CourseResponse getCourse(
                        UUID semesterId,
                        UUID courseId) {

                Course course = courseRepository
                                .findByIdAndSemesterId(
                                                courseId,
                                                semesterId)
                                .orElseThrow(() -> new RuntimeException("Course not found"));

                return toResponse(course);
        }

        @Override
        public CourseResponse createCourse(
                        UUID semesterId,
                        CreateCourseRequest request) {

                System.out.println("===== CREATE COURSE =====");
                System.out.println("Semester ID: " + semesterId);
                System.out.println("Course Name: " + request.name());
                System.out.println("Root Folder ID: " + request.rootFolderId());

                Semester semester = semesterRepository
                                .findById(semesterId)
                                .orElseThrow(() -> new RuntimeException("Semester not found"));

                System.out.println("Semester Found: " + semester.getName());

                Course course = new Course();

                course.setName(request.name());
                course.setSemester(semester);

                if (request.rootFolderId() != null) {

                        Folder folder = folderRepository
                                        .findById(request.rootFolderId())
                                        .orElseThrow(() -> new RuntimeException("Folder not found"));

                        course.setRootFolder(folder);
                }

                course = courseRepository.save(course);

                System.out.println("Course Saved: " + course.getId());

                return toResponse(course);
        }

        @Override
        public CourseResponse updateCourse(
                        UUID semesterId,
                        UUID courseId,
                        UpdateCourseRequest request) {

                Course course = courseRepository
                                .findByIdAndSemesterId(
                                                courseId,
                                                semesterId)
                                .orElseThrow(() -> new RuntimeException("Course not found"));

                if (request.name() != null) {
                        course.setName(request.name());
                }

                if (request.rootFolderId() != null) {

                        Folder folder = folderRepository
                                        .findById(request.rootFolderId())
                                        .orElseThrow(() -> new RuntimeException("Folder not found"));

                        course.setRootFolder(folder);
                }

                return toResponse(course);
        }

        @Override
        public void deleteCourse(
                        UUID semesterId,
                        UUID courseId) {

                Course course = courseRepository
                                .findByIdAndSemesterId(
                                                courseId,
                                                semesterId)
                                .orElseThrow(() -> new RuntimeException("Course not found"));

                courseRepository.delete(course);
        }

        private CourseResponse toResponse(Course course) {

                return new CourseResponse(
                                course.getId(),
                                course.getName(),
                                course.getSemester().getId(),
                                course.getRootFolder() != null
                                                ? course.getRootFolder().getId()
                                                : null,
                                course.getCreatedAt(),
                                course.getUpdatedAt());
        }
}