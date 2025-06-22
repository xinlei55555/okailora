package ca.kailo.berkeley

import ca.kailo.berkeley.api.InferenceAPI
import ca.kailo.berkeley.model.Deployment
import ca.kailo.berkeley.model.InferenceStatus200Response
import ca.kailo.berkeley.model.InferenceStatus200ResponseResultInner
import com.fasterxml.jackson.databind.ObjectMapper
import java.io.File
import java.nio.file.Paths
import java.util.Locale
import org.springframework.core.io.Resource
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.RestController
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArrayList
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus

@RestController
class InferenceRestController(
    private val storage: Storage,
    private val deploymentRegistry: DeploymentRegistry,
    private val objectMapper: ObjectMapper
) : InferenceAPI {

    companion object {
        private val logger = LoggerFactory.getLogger(InferenceRestController::class.java)
    }

    // map of deploymentId -> collected inference results
    private val classifications = ConcurrentHashMap<String, MutableList<LogSchema>>()

    override fun inferenceList(): ResponseEntity<List<Deployment>> {
        return ResponseEntity.ok(deploymentRegistry.getAll().toList())
    }

    override fun inferenceUploadData(deploymentId: String, file: Resource?): ResponseEntity<Unit> {
        storage.saveData(Storage.StorageType.INFERENCE, deploymentId, file!!)
        return ResponseEntity.ok().build()
    }

    override fun inferenceStart(deploymentId: String): ResponseEntity<Unit> {
        val zipPath = storage.getDataPath(Storage.StorageType.INFERENCE, deploymentId)
        val configFile = deploymentRegistry.get(deploymentId)!!
        val configName = configFile.type!!.value.lowercase(Locale.getDefault()) + ".yaml"

        // unzip into ../model_zoo/data/inference_datasets/DEPLOYMENT_ID
        val datasetsRoot = Paths.get("..", "model_zoo", "data", "inference_datasets")
        val targetDir = datasetsRoot.resolve(deploymentId).toFile()
        if (!targetDir.exists()) {
            targetDir.parentFile.mkdirs()
            targetDir.mkdirs()
        }

        logger.info("Unzipping {} into {}", zipPath, targetDir.absolutePath)
        val unzipExit = ProcessBuilder("unzip", "-o", zipPath.toString(), "-d", targetDir.absolutePath)
            .redirectErrorStream(true)
            .start()
            .waitFor()
        if (unzipExit != 0) {
            logger.error("Failed to unzip {} (exit code {})", zipPath, unzipExit)
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
        }

        // prepare synchronous process
        val processBuilder = ProcessBuilder(
            "venv/bin/python", "-u",
            "train.py",
            "--inference_mode", "1",
            "--config", configName,
            "--data_path", "data/inference_datasets/$deploymentId",
            "--deployment_id", deploymentId
        ).directory(File("../model_zoo"))

        logger.info("Running synchronous inference: ${processBuilder.command().joinToString(" ")}")

        // initialize results list
        classifications[deploymentId] = CopyOnWriteArrayList()

        try {
            val process = processBuilder.start()
            process.inputStream.bufferedReader().use { reader ->
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    logger.info(">> got line: {}", line)
                    if (line!!.startsWith("pipe:")) {
                        val json = line!!.removePrefix("pipe:")
                        val entry = objectMapper.readValue(json, LogSchema::class.java)
                        classifications[deploymentId]!!.add(entry)
                        logger.info("LOGGING POINT: {}", entry)
                    }
                }
            }
            val exitCode = process.waitFor()
            if (exitCode != 0) {
                logger.error("Inference for {} failed with exit code {}", deploymentId, exitCode)
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
            }
        } catch (e: Exception) {
            logger.error("Error during synchronous inference for {}", deploymentId, e)
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
        }

        return ResponseEntity.ok().build()
    }

    override fun inferenceWeights(deploymentId: String): ResponseEntity<Any> {
        return ResponseEntity.noContent().build()
    }

    override fun inferenceStatus(deploymentId: String): ResponseEntity<InferenceStatus200Response> {
        // Since inferenceStart now blocks, the job is always finished
        val finished = true
        val data = classifications[deploymentId].orEmpty()
        val results = data.map {
            InferenceStatus200ResponseResultInner(it.image, it.classification, it.base64)
        }
        return ResponseEntity.ok(InferenceStatus200Response(finished, results))
    }

    data class LogSchema(val image: String, val classification: String, val base64: String)
}
