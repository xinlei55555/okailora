package ca.kailo.berkeley

import ca.kailo.berkeley.api.TrainAPI
import ca.kailo.berkeley.model.TrainStartRequest
import org.springframework.core.io.Resource
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.RestController

/**
 * Implementation of the TrainAPI endpoints.
 */
@RestController
class TrainRestController(
    private val storage: Storage,
    private val deploymentRegistry: DeploymentRegistry,
) : TrainAPI {

    override fun trainUploadData(deploymentId: String, file: Resource?): ResponseEntity<Unit> {
        // Validate resource
//        if (file == null || !file.exists()) {
//            return ResponseEntity.badRequest().build()
//        }
        // Save the uploaded ZIP
        storage.saveData(Storage.StorageType.TRAIN, deploymentId, file!!)
        return ResponseEntity.ok().build()
    }

    override fun trainStart(deploymentId: String, trainStartRequest: TrainStartRequest): ResponseEntity<Unit> {
        // Lookup the uploaded ZIP
        val zipPath = storage.getDataPath(Storage.StorageType.TRAIN, deploymentId)

        // Prepare to run the Python training script
        val processBuilder = ProcessBuilder(
            "python3",
            "train.py",
            "--config ${deploymentRegistry.deployments[deploymentId]!!.type.path}.yaml",
            "--data_path $zipPath",
            "--deployment_id $deploymentId"
        ).inheritIO()

        return try {
            val process = processBuilder.start()
            val exitCode = process.waitFor()
            if (exitCode == 0) {
                ResponseEntity.ok().build()
            } else {
                ResponseEntity.status(500).build()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            ResponseEntity.status(500).build()
        }
    }
}
