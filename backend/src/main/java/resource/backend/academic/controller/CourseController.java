package resource.backend.academic.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import resource.backend.academic.dto.request.CreateCourseRequest;
import resource.backend.academic.dto.request.UpdateCourseRequest;
import resource.backend.academic.dto.response.CourseResponse;
import resource.backend.academic.service.CourseService;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000") // Ensures your Next.js client can hit it safely
@RequestMapping("/rooms/{roomId}/courses")
public class CourseController {

        private final CourseService courseService;

        /**
         * Fetches all courses belonging to the given room (semester).
         * Changed from Page<CourseResponse> to List<CourseResponse> to match Next.js array expectations.
         */
        @GetMapping
        public List<CourseResponse> getCourses(@PathVariable UUID roomId) {
                // Delegates the local DB relationship lookup to your service layer
                return courseService.getCoursesByRoomId(roomId);
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

                // Temporary hardcoded Demo User ID string matching your Next.js client
                String temporaryUserIdStr = "2deb6920-19b0-4fa9-aa5f-6364b03bce5d";

                // Pass all 3 required parameters to resolve the compilation error
                return courseService.createCourse(
                        roomId,
                        request,
                        temporaryUserIdStr
                );
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