package ca.kailo.berkeley

import org.springframework.core.io.Resource
import org.springframework.stereotype.Component
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardCopyOption

/**
 * Stores mapping from deployment IDs to the location of their uploaded ZIP files.
 */
@Component
class Storage(
    private val deploymentRegistry: DeploymentRegistry
) {
    private val uploadDir: Path = Paths.get("uploads")

    init {
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir)
        }
        for (type in StorageType.entries) {
            if (!Files.exists(uploadDir.resolve(type.path))) {
                Files.createDirectories(uploadDir.resolve(type.path))
            }
        }
    }

    /**
     * Saves the provided resource as a ZIP file under the deployment ID.
     */
    fun saveData(type: StorageType, deploymentId: String, resource: Resource): Path {
        val targetPath = uploadDir.resolve(getDataPath(type, deploymentId))
        Files.createFile(targetPath)
        resource.inputStream.use { input ->
            Files.copy(input, targetPath, StandardCopyOption.REPLACE_EXISTING)
        }
        return targetPath
    }

    /**
     * Retrieves the stored ZIP path for the given deployment ID, or null if not found.
     */
    fun getDataPath(type: StorageType, deploymentId: String): String {
        return "${type.path}/$deploymentId.zip"
    }

    enum class StorageType(val path: String) {
        INFERENCE("inference"), TRAIN("train")
    }
}
