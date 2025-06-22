package ca.kailo.berkeley

import ca.kailo.berkeley.api.TrainAPI
import ca.kailo.berkeley.model.*
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.databind.ObjectMapper
import java.io.File
import java.nio.file.Paths
import org.springframework.core.io.Resource
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.RestController
import java.util.concurrent.*
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus

@RestController
class TrainRestController(
    private val storage: Storage,
    private val deploymentRegistry: DeploymentRegistry,
    private val objectMapper: ObjectMapper
) : TrainAPI {

    companion object {
        private val logger = LoggerFactory.getLogger(TrainRestController::class.java)
    }

    // thread-pool for running training jobs
    private val executor: ExecutorService = Executors.newCachedThreadPool()

    // map of deploymentId -> Future representing the running job
    private val trainingJobs = ConcurrentHashMap<String, Future<*>>()

    // now hold mutable lists so we can append new DataPoints
    private val metrics = ConcurrentHashMap<String, MutableList<LogSchema>>()

    override fun trainUploadData(deploymentId: String, file: Resource?): ResponseEntity<Unit> {
        storage.saveData(Storage.StorageType.TRAIN, deploymentId, file!!)
        return ResponseEntity.ok().build()
    }

    override fun trainStart(
        deploymentId: String,
        trainStartRequest: TrainStartRequest
    ): ResponseEntity<Unit> {
        // ensure data is uploaded
        val zipPath = storage.getDataPath(Storage.StorageType.TRAIN, deploymentId)

        // --- new: unzip into ../model_zoo/data/datasets/DEPLOYMENT_ID ---
        val datasetsRoot = Paths.get("..", "model_zoo", "data", "datasets")
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

        val type = Deployment.Type.of(trainStartRequest.modelType.value)
            ?: throw IllegalArgumentException("Unknown model type")
        val deployment = Deployment(deploymentId, type, "sample description")
        deploymentRegistry.put(deployment)

        // initialize empty, thread-safe lists for metrics
        metrics[deploymentId] = CopyOnWriteArrayList()

        val processBuilder = ProcessBuilder(
            "venv/bin/python", "-u",
            "train.py",
            "--config", "classification.yaml",//"${type.path}.yaml",
            "--data_path", "data/datasets/$deploymentId",
            "--deployment_id", deploymentId
        ).directory(File("../model_zoo"))

        logger.info("Running ${processBuilder.command().joinToString(" ")}")

        processBuilder.redirectErrorStream(true)

        val future: Future<*> = executor.submit {
            try {
                val process = processBuilder.start()

                process.inputStream.bufferedReader().use { reader ->
                    var line: String?
                    logger.info(">> started reading training output")
                    while (reader.readLine().also { line = it } != null) {
                        logger.info(">> got line: {}", line)
                        if (line!!.startsWith("pipe:")) {
                            val json  = line!!.removePrefix("pipe:")
                            val entry = objectMapper.readValue(json, LogSchema::class.java)
                            metrics[deploymentId]!!.add(entry)
                            logger.info("LOGGING POINT: {}", entry)
                        }
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
        trainingJobs[deploymentId] = future

        return ResponseEntity.ok().build()
    }

    override fun trainStatus(deploymentId: String): ResponseEntity<TrainStatus200Response> {
        val finished = trainingJobs[deploymentId]?.isDone ?: false

        // safely grab whatever we have so far (or empty)
        val pts = metrics[deploymentId].orEmpty()

        val valLoss = pts.sortedBy { it.epoch }.map { it.valLoss }.toList()
        val trainLoss = pts.sortedBy { it.epoch }.map { it.trainLoss }.toList()
        val valAcc = pts.sortedBy { it.epoch }.map { it.valAcc }.filterNotNull().toList()
        val trainAcc = pts.sortedBy { it.epoch }.map { it.trainAcc }.filterNotNull().toList()


        return ResponseEntity.ok(
            TrainStatus200Response(
                finished,
                valLoss,
                trainLoss,
                valAcc,
                trainAcc
            )
        )
    }

    data class LogSchema(
        val epoch: Int,
        @JsonProperty("train_loss") val trainLoss: Float,
        @JsonProperty("val_loss") val valLoss: Float,
        @JsonProperty("train_acc") val trainAcc: Float?,
        @JsonProperty("val_acc") val valAcc: Float?
    )
}
