package resource.backend.academic.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import resource.backend.academic.dto.request.CreateCourseRequest;
import resource.backend.academic.dto.request.UpdateCourseRequest;
import resource.backend.academic.dto.response.CourseResponse;
import resource.backend.academic.service.CourseService;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/rooms/{roomId}/courses")
public class CourseController {

        private final CourseService courseService;

        @GetMapping
        public Page<CourseResponse> getCourses(
                        @PathVariable UUID roomId,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {

                return courseService.getCourses(
                                roomId,
                                page,
                                size);
        }

        @GetMapping("/{courseId}")
        public CourseResponse getCourse(
                        @PathVariable UUID roomId,
                        @PathVariable UUID courseId) {

                return courseService.getCourse(
                                roomId,
                                courseId);
        }

        @PostMapping
        public CourseResponse createCourse(
                        @PathVariable UUID roomId,
                        @RequestBody @Valid CreateCourseRequest request) {
                System.out.println("CONTROLLER HIT");

                return courseService.createCourse(
                                roomId,
                                request);
        }

        @PatchMapping("/{courseId}")
        public CourseResponse updateCourse(
                        @PathVariable UUID roomId,
                        @PathVariable UUID courseId,
                        @RequestBody UpdateCourseRequest request) {

                return courseService.updateCourse(
                                roomId,
                                courseId,
                                request);
        }

        @DeleteMapping("/{courseId}")
        public void deleteCourse(
                        @PathVariable UUID roomId,
                        @PathVariable UUID courseId) {

                courseService.deleteCourse(
                                roomId,
                                courseId);
        }
}