package resource.backend.academic.service;

import org.springframework.data.domain.Page;
import resource.backend.academic.dto.request.CreateCourseRequest;
import resource.backend.academic.dto.request.UpdateCourseRequest;
import resource.backend.academic.dto.response.CourseResponse;

import java.util.UUID;

public interface CourseService {

    Page<CourseResponse> getCourses(
            UUID semesterId,
            int page,
            int size);

    CourseResponse getCourse(
            UUID semesterId,
            UUID courseId);

    CourseResponse createCourse(
            UUID semesterId,
            CreateCourseRequest request);

    CourseResponse updateCourse(
            UUID semesterId,
            UUID courseId,
            UpdateCourseRequest request);

    void deleteCourse(
            UUID semesterId,
            UUID courseId);
}