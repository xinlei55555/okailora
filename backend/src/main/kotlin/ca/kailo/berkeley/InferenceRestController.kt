package ca.kailo.berkeley

import ca.kailo.berkeley.TrainRestController.Companion
import ca.kailo.berkeley.TrainRestController.LogSchema
import ca.kailo.berkeley.api.InferenceAPI
import ca.kailo.berkeley.model.Deployment
import ca.kailo.berkeley.model.InferenceStatus200Response
import java.io.File
import java.nio.file.Paths
import java.util.Locale
import org.springframework.core.io.Resource
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.RestController

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.Future
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus

@RestController
class InferenceRestController(
    private val storage: Storage,
    private val deploymentRegistry: DeploymentRegistry
) : InferenceAPI {

    companion object {
        private val logger = LoggerFactory.getLogger(InferenceRestController::class.java)
    }

    // thread‐pool for running inference jobs
    private val executor = Executors.newCachedThreadPool()

    // map of deploymentId -> Future representing the running job
    private val inferenceJobs = ConcurrentHashMap<String, Future<*>>()

    override fun inferenceList(): ResponseEntity<List<Deployment>> {
        return ResponseEntity.ok(deploymentRegistry.getAll().toList())
    }

    override fun inferenceUploadData(deploymentId: String, file: Resource?): ResponseEntity<Unit> {
        storage.saveData(Storage.StorageType.INFERENCE, deploymentId, file!!)
        return ResponseEntity.ok().build()
    }

    override fun inferenceStart(deploymentId: String): ResponseEntity<Unit> {
        val zipPath = storage.getDataPath(Storage.StorageType.INFERENCE, deploymentId)
        val configPath = deploymentRegistry.get(deploymentId)!!.type!!.value.lowercase(Locale.getDefault()) + ".yaml"

        // --- new: unzip into ../model_zoo/data/datasets/DEPLOYMENT_ID ---
        val datasetsRoot = Paths.get("..", "model_zoo", "data", "inference_datasets")
        val targetDir = datasetsRoot.resolve(deploymentId).toFile()
        if (!targetDir.exists()) {
            targetDir.parentFile.mkdirs()
            targetDir.mkdirs()
        }

        logger.info("Unzipping {} into {}", zipPath, targetDir.absolutePath)
        val unzipProcess = ProcessBuilder("unzip", "-o", zipPath.toString(), "-d", targetDir.absolutePath)
            .redirectErrorStream(true)
            .start()
        val unzipExit = unzipProcess.waitFor()
        if (unzipExit != 0) {
            logger.error("Failed to unzip {} (exit code {})", zipPath, unzipExit)
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
        }
        // ---------------------------------------------------------------

        val processBuilder = ProcessBuilder(
            "venv/bin/python", "-u",
            "train.py",
            "--inference_mode", "1",
            "--config", "classification.yaml",//"$configPath.yaml",
            "--data_path", "data/inference_datasets/$deploymentId",
            "--deployment_id", deploymentId
        ).directory(File("../model_zoo"))

        logger.info("Running ${processBuilder.command().joinToString(" ")}")

        processBuilder.redirectErrorStream(true)

        // submit job asynchronously
        val future: Future<*> = executor.submit {
            try {
                val process = processBuilder.start()

                process.inputStream.bufferedReader().use { reader ->
                    var line: String?
                    logger.info(">> started reading inference output")
                    while (reader.readLine().also { line = it } != null) {
                        logger.info(">> got line: {}", line)
                    }
                }

                val exitCode = process.waitFor()
                if (exitCode != 0) {
                    logger.error("Training for {} failed with exit code {}", deploymentId, exitCode)
                }
                logger.info("Finished!")
            } catch (e: Exception) {
                logger.error("Error in training thread for {}", deploymentId, e)
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
