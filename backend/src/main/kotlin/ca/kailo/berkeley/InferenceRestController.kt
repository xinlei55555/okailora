package ca.kailo.berkeley

import ca.kailo.berkeley.api.InferenceAPI
import ca.kailo.berkeley.model.InferenceList200ResponseInner
import ca.kailo.berkeley.model.InferenceStatus200Response
import org.springframework.core.io.Resource
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.RestController

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.Future
import org.slf4j.LoggerFactory

@RestController
class InferenceRestController(
    private val storage: Storage,
    private val deploymentRegistry: DeploymentRegistry
) : InferenceAPI {

    companion object {
        private val logger = LoggerFactory.getLogger(TrainRestController::class.java)
    }

    // thread‐pool for running inference jobs
    private val executor = Executors.newCachedThreadPool()

    // map of deploymentId -> Future representing the running job
    private val inferenceJobs = ConcurrentHashMap<String, Future<*>>()

    override fun inferenceList(): ResponseEntity<List<InferenceList200ResponseInner>> {
        val list = deploymentRegistry.getAll().map {
            InferenceList200ResponseInner(
                it.id,
                it.type.path,
                it.description
            )
        }
        return ResponseEntity.ok(list)
    }

    override fun inferenceUploadData(deploymentId: String, file: Resource?): ResponseEntity<Unit> {
        storage.saveData(Storage.StorageType.INFERENCE, deploymentId, file!!)
        return ResponseEntity.ok().build()
    }

    override fun inferenceStart(deploymentId: String, body: Any): ResponseEntity<Unit> {
        val zipPath = storage.getDataPath(Storage.StorageType.INFERENCE, deploymentId).toString()
        val configPath = deploymentRegistry.get(deploymentId)!!.type.path + ".yaml"

        val processBuilder = ProcessBuilder(
            "bash", "-c",
            "source ../model_zoo/venv/bin/activate && " +
                    "python3 -u ../model_zoo/train.py " +
                    "--inference_mode 1 " +
                    "--config $configPath " +
                    "--data_path $zipPath " +
                    "--deployment_id $deploymentId"
        ).inheritIO()

        logger.info("Running ${processBuilder.command().joinToString(" ")}")

        // submit job asynchronously
        val future: Future<*> = executor.submit {
            try {
                val process = processBuilder.start()
                val exitCode = process.waitFor()
                if (exitCode != 0) {
                    System.err.println("Inference for $deploymentId failed with exit code $exitCode")
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        inferenceJobs[deploymentId] = future

        // return immediately
        return ResponseEntity.ok().build()
    }

    override fun inferenceWeights(deploymentId: String): ResponseEntity<Any> {
        return ResponseEntity.noContent().build()
    }

    override fun inferenceStatus(deploymentId: String): ResponseEntity<InferenceStatus200Response> {
        val future = inferenceJobs[deploymentId]
        val finished = future?.isDone ?: false
        return ResponseEntity.ok(InferenceStatus200Response(finished))
    }
}
