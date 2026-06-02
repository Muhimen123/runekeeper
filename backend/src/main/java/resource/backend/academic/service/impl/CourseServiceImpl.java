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
import resource.backend.gdrive.service.GoogleDriveService;

import javax.swing.filechooser.FileSystemView;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseServiceImpl implements CourseService {

        private final CourseRepository courseRepository;
        private final SemesterRepository semesterRepository;
        private final FolderRepository folderRepository;
        private final GoogleDriveService googleDriveService;

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
        public CourseResponse createCourse(UUID semesterId, CreateCourseRequest request, String userIdStr) {
                try {
                        // 1. Generate unique IDs for both entities up front
                        UUID newFolderId = UUID.randomUUID();
                        UUID newCourseId = UUID.randomUUID();

                        // 2. Create the folder in Google Drive at the Root Level
                        // Passing "root" keeps your Google Drive API happy without a parent ID
                        // FIXED: Changed request.getName() to request.name() for Java Record syntax
                        com.google.api.services.drive.model.File googleFolder =
                                googleDriveService.createFolder(userIdStr, request.name(), "root");

                        // 3. Create and Save the Folder record to the database first
                        // Note: parent_id MUST be null to bypass your database's cycle-prevention trigger
                        // FIXED: Removed .id() from builder and assigned it using the public setter method instead
                        Folder localFolder = Folder.builder()
                                .name(request.name())
                                .driveFolderId(googleFolder.getId())
                                .parent(null) // <--- Enforces top-level folder status safely
                                .build();
                        localFolder.setId(newFolderId); // <--- Explicitly sets the inherited ID via its public setter
                        folderRepository.save(localFolder);

                        // 4. Create and Save the Course record, linking it to the folder we just saved
                        // FIXED: Removed .id() from builder and assigned it using the public setter method instead
                        // <--- Explicitly sets the inherited ID via its public setter
                        Semester semesterProxy = semesterRepository.getReferenceById(semesterId);

// 2. Pass it directly to the builder
                        Course courseEntity = Course.builder()
                                .name(request.name())
                                .semester(semesterProxy) // <--- Fixed: passing the Semester object reference
                                .rootFolder(localFolder)  // <--- Optional/Clean: pass the Folder object directly instead of raw ID
                                .build();
                        courseEntity.setId(newCourseId);
                        Course savedCourse = courseRepository.save(courseEntity);

                        return toResponse(savedCourse);

                } catch (IOException e) {
                        throw new RuntimeException("Failed to provision folder infrastructure on Google Drive", e);
                }
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

        @Override
        public List<CourseResponse> getCoursesByRoomId(UUID roomId) {
                // In your schema layout, roomId aligns with semesterId
                return courseRepository.findBySemesterId(roomId).stream()
                        .map(this::toResponse)
                        .toList();
        }

}