package ca.kailo.berkeley

import ca.kailo.berkeley.api.InferenceAPI
import ca.kailo.berkeley.model.InferenceList200ResponseInner
import org.springframework.core.io.Resource
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.RestController

/**
 * Implementation of the InferenceAPI endpoints.
 */
@RestController
class InferenceRestController(
    private val storage: Storage,
    private val deploymentRegistry: DeploymentRegistry
) : InferenceAPI {

    override fun inferenceList(): ResponseEntity<List<InferenceList200ResponseInner>> {
        val list = deploymentRegistry.deployments.values.map {
            InferenceList200ResponseInner(
                it.id,
                it.type.path,
                it.description
            )
        }
        return ResponseEntity.ok(list)
    }

    override fun inferenceUploadData(deploymentId: String, file: Resource?): ResponseEntity<Unit> {
        if (file == null || !file.exists()) {
            return ResponseEntity.badRequest().build()
        }
        storage.saveData(Storage.StorageType.INFERENCE, deploymentId, file)
        return ResponseEntity.ok().build()
    }

    override fun inferenceStart(deploymentId: String, body: Any): ResponseEntity<Unit> {
        val processBuilder = ProcessBuilder(
            "python3",
            "inference.py",
            "--config ${deploymentRegistry.deployments[deploymentId]!!.type.path}.yaml",
            "--deployment_id $deploymentId"
        ).inheritIO()

        return try {
            val process = processBuilder.start()
            val exitCode = process.waitFor()
            if (exitCode == 0) ResponseEntity.ok().build()
            else ResponseEntity.status(500).build()
        } catch (e: Exception) {
            e.printStackTrace()
            ResponseEntity.status(500).build()
        }
    }

    override fun inferenceWeights(deploymentId: String): ResponseEntity<Any> {
        return ResponseEntity.noContent().build()
    }
}