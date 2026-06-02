package resource.backend.common.response;

/**
 * Standardized API Response wrapper to ensure consistent payloads across all endpoints.
 *
 * @param success Indicates if the operation was successful
 * @param data    The response payload
 * @param message Human-readable response message
 * @param <T>     The type of response data
 */
public record ApiResponse<T>(
    boolean success,
    T data,
    String message
) {
    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, data, message);
    }

    public static <T> ApiResponse<T> success(T data) {
        return success(data, "Operation completed successfully");
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, null, message);
    }
}
