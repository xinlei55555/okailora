package ca.kailo.berkeley

import ca.kailo.berkeley.api.TrainAPI
import ca.kailo.berkeley.model.TrainStartRequest
import ca.kailo.berkeley.model.TrainStatus200Response
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.Future
import org.springframework.core.io.Resource
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.RestController

@RestController
class TrainRestController(
    private val storage: Storage,
    private val deploymentRegistry: DeploymentRegistry,
) : TrainAPI {

    // thread‐pool for running training jobs
    private val executor = Executors.newCachedThreadPool()

    // map of deploymentId -> Future representing the running job
    private val trainingJobs = ConcurrentHashMap<String, Future<*>>()

    override fun trainUploadData(deploymentId: String, file: Resource?): ResponseEntity<Unit> {
        storage.saveData(Storage.StorageType.TRAIN, deploymentId, file!!)
        return ResponseEntity.ok().build()
    }

    override fun trainStart(deploymentId: String, trainStartRequest: TrainStartRequest): ResponseEntity<Unit> {
        // make sure the data is there
        val zipPath = storage.getDataPath(Storage.StorageType.TRAIN, deploymentId)

        val type = Deployment.Type.of(trainStartRequest.modelType.value)!!
        val deployment = Deployment(deploymentId, type, "sample description")
        deploymentRegistry.put(deployment)

        // prepare the ProcessBuilder
        val processBuilder = ProcessBuilder(
            "python3",
            "train.py",
            "--config", "${type.path}.yaml",
            "--data_path", zipPath,
            "--deployment_id", deploymentId
        ).inheritIO()

        // submit job asynchronously
        val future: Future<*> = executor.submit {
            try {
                val process = processBuilder.start()
                val exitCode = process.waitFor()
                if (exitCode != 0) {
                    // log or handle non‐zero exit
                    System.err.println("Training for $deploymentId failed with exit code $exitCode")
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        trainingJobs[deploymentId] = future

        // return immediately
        return ResponseEntity.ok().build()
    }

    override fun trainStatus(deploymentId: String): ResponseEntity<TrainStatus200Response> {
        val future = trainingJobs[deploymentId]
        val finished = future?.isDone ?: false
        return ResponseEntity.ok(TrainStatus200Response(finished))
    }
}