package resource.backend.academic.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import resource.backend.academic.dto.response.CourseResponse;
import resource.backend.academic.service.CourseService;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/courses") // Matches the frontend fetch root exactly
public class CourseFlatController {

    private final CourseService courseService;

    /**
     * PHASE A Fix: Resolves the course metadata directly.
     * Matches: GET http://localhost:8080/api/v1/courses/{courseId}
     */
    @GetMapping("/{courseId}")
    public CourseResponse getCourseDirectlyWithoutRoom(@PathVariable UUID courseId) {
        // Passes null for semesterId to hit your newly updated service logic branch!
        return courseService.getCourse(null, courseId);
    }
}